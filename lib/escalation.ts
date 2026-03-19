import prisma from './prisma';
import { sendEscalationEmail } from './mailer';

/**
 * Uses Groq AI to determine the appropriate local authority and contact email based on coordinates.
 */
async function getAuthorityFromCoordinates(lat: number, lng: number, departmentName: string): Promise<{ authority: string, email: string | null }> {
    const fallback = { authority: `${departmentName} (Local Branch)`, email: null };
    if (!process.env.GROQ_API_KEY) return fallback;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an Indian civic administration expert. Given coordinates and a department name, identify the responsible authority and their official contact email. Return ONLY a JSON object with keys "authority" and "email". Example: {"authority": "Municipal Corporation of Delhi (MCD)", "email": "contact@mcd.nic.in"}. If email is unknown, return null for the email field. Do not include any conversational text.'
                    },
                    {
                        role: 'user',
                        content: `Coordinates: ${lat}, ${lng}\nDepartment: ${departmentName}`
                    }
                ],
                temperature: 0.1,
                max_tokens: 100,
                response_format: { type: "json_object" }
            }),
        });

        if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
                const parsed = JSON.parse(content);
                return {
                    authority: parsed.authority || fallback.authority,
                    email: parsed.email || null
                };
            }
        }
    } catch (e) {
        console.error('[ESCALATION BOT] Groq Authority Lookup failed:', e);
    }

    return fallback;
}

/**
 * Core escalation logic that doesn't depend on Next.js-specific environment like revalidatePath.
 */
export async function runEscalationCycle(onEscalate?: (complaint: any) => void) {
    try {
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

        // Find all complaints that are not resolved and older than 5 minutes
        const overdueComplaints = await (prisma as any).complaint.findMany({
            where: {
                status: {
                    in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS']
                },
                createdAt: {
                    lt: fiveMinutesAgo
                },
                isEscalated: false,
                escalationEmailSent: false,
                escalationPaused: false
            },
            include: {
                department: true
            }
        });

        if (overdueComplaints.length === 0) {
            return { success: true, count: 0 };
        }

        console.log(`[ESCALATION BOT] Found ${overdueComplaints.length} overdue complaints. Parallelizing escalation...`);

        const escalationPromises = overdueComplaints.map(async (complaint: any) => {
            try {
                const deptName = complaint.department?.name || 'General Municipal Services';
                const deptEmail = complaint.department?.email || process.env.SMTP_USER || 'admin@civiccore.app';

                // Use custom routing if provided by admin, otherwise use AI
                let authority = complaint.customEscalationAuthority;
                let finalEmail = complaint.customEscalationEmail;

                if (!authority || !finalEmail) {
                    const aiResult = await getAuthorityFromCoordinates(complaint.latitude, complaint.longitude, deptName);
                    if (!authority) authority = aiResult.authority;
                    if (!finalEmail) finalEmail = aiResult.email || deptEmail;
                }

                const emailSent = await sendEscalationEmail(
                    finalEmail!,
                    complaint.id,
                    complaint.title,
                    complaint.description,
                    complaint.address,
                    complaint.latitude,
                    complaint.longitude,
                    complaint.severity,
                    `Regional District Authority (${authority})`
                );

                if (emailSent) {
                    await (prisma as any).complaint.update({
                        where: { id: complaint.id },
                        data: {
                            isEscalated: true,
                            escalationEmailSent: true,
                            escalatedTo: authority,
                            escalatedAt: new Date()
                        }
                    });

                    // Trigger callback for real-time notifications
                    if (onEscalate) onEscalate(complaint);

                    return true;
                }
                return false;
            } catch (err) {
                console.error(`[ESCALATION BOT] Failed for ${complaint.id}:`, err);
                return false;
            }
        });

        const results = await Promise.all(escalationPromises);
        const successCount = results.filter(Boolean).length;

        return { success: true, count: successCount };
    } catch (error: any) {
        // Handle common database hibernation/connection issues gracefully
        const isConnError = error.message?.includes('PrismaClientInitializationError') ||
            error.message?.includes('Can\'t reach database server');

        if (isConnError) {
            console.log('[CRON] 😴 Database is hibernating or connecting. Retrying in next cycle (15s)...');
            return { success: false, error: 'Database connecting' };
        }

        console.error('[ESCALATION BOT] Unexpected Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Manually prepares an escalation for a specific complaint.
 * Finds the authority and return details for preview.
 */
export async function prepareEscalation(complaintId: string) {
    try {
        const complaint = await (prisma as any).complaint.findUnique({
            where: { id: complaintId },
            include: { department: true }
        });

        if (!complaint) throw new Error('Complaint not found');

        const deptName = complaint.department?.name || 'General Municipal Services';
        const deptEmail = complaint.department?.email || process.env.SMTP_USER || 'admin@civiccore.app';

        // Return saved routing if present, otherwise fetch AI suggestion
        if (complaint.customEscalationAuthority && complaint.customEscalationEmail) {
            return {
                success: true,
                complaint,
                authorityDetails: complaint.customEscalationAuthority,
                deptEmail: complaint.customEscalationEmail,
                isCustom: true
            };
        }

        const { authority, email: aiEmail } = await getAuthorityFromCoordinates(
            complaint.latitude,
            complaint.longitude,
            deptName
        );

        return {
            success: true,
            complaint,
            authorityDetails: authority,
            deptEmail: aiEmail || deptEmail,
            isCustom: false
        };
    } catch (error: any) {
        console.error('[ESCALATION] Preparation failed:', error);
        return { success: false, error: error.message };
    }
}
