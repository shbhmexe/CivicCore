import prisma from './prisma';
import { sendEscalationEmail } from './mailer';

/**
 * Uses Groq AI to determine the appropriate local authority based on coordinates.
 */
async function getAuthorityFromCoordinates(lat: number, lng: number, departmentName: string): Promise<string> {
    if (!process.env.GROQ_API_KEY) return `${departmentName} (Local Branch)`;

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
                        content: 'You are an Indian civic administration expert. Given coordinates and a department name, return ONLY the full name of the specific authority responsible. For example: "Municipal Corporation of Delhi (MCD) - Roads Division, South Zone". Do not include any conversational text.'
                    },
                    {
                        role: 'user',
                        content: `Coordinates: ${lat}, ${lng}\nDepartment: ${departmentName}`
                    }
                ],
                temperature: 0.1,
                max_tokens: 50,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            const authority = data.choices?.[0]?.message?.content?.trim();
            if (authority && authority.length > 5) {
                return authority;
            }
        }
    } catch (e) {
        console.error('[ESCALATION BOT] Groq Authority Lookup failed:', e);
    }

    return `${departmentName} (Local Branch)`;
}

/**
 * Core escalation logic that doesn't depend on Next.js-specific environment like revalidatePath.
 */
export async function runEscalationCycle() {
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
                escalationEmailSent: false
            },
            include: {
                department: true
            }
        });

        if (overdueComplaints.length === 0) {
            return { success: true, count: 0 };
        }

        console.log(`[ESCALATION BOT] Found ${overdueComplaints.length} overdue complaints. Initiating escalation sequence...`);

        let successCount = 0;

        for (const complaint of overdueComplaints) {
            try {
                const deptName = complaint.department?.name || 'General Municipal Services';
                const deptEmail = complaint.department?.email || process.env.SMTP_USER || 'admin@civiccore.app';
                
                console.log(`[ESCALATION BOT] Determining authority for ${complaint.id}...`);
                const authorityDetails = await getAuthorityFromCoordinates(complaint.latitude, complaint.longitude, deptName);
                
                const emailSent = await sendEscalationEmail(
                    deptEmail,
                    complaint.id,
                    complaint.title,
                    complaint.description,
                    complaint.address,
                    complaint.latitude,
                    complaint.longitude,
                    complaint.severity,
                    authorityDetails
                );

                // Update the complaint record as escalated
                await (prisma as any).complaint.update({
                    where: { id: complaint.id },
                    data: {
                        isEscalated: true,
                        escalationEmailSent: true,
                        escalatedTo: authorityDetails,
                        escalatedAt: new Date()
                    }
                });

                console.log(`[ESCALATION BOT] Successfully escalated issue: ${complaint.id} to ${authorityDetails}`);
                successCount++;
            } catch (err) {
                console.error(`[ESCALATION BOT] Failed to escalate complaint ${complaint.id}:`, err);
            }
        }

        return { success: true, count: successCount };
    } catch (error) {
        console.error('[ESCALATION BOT] Critical Error:', error);
        return { success: false, error: 'Failed to process escalation' };
    }
}
