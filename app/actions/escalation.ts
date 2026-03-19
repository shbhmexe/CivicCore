'use server';

import { revalidatePath } from 'next/cache';
import { runEscalationCycle, prepareEscalation } from '@/lib/escalation';
import { sendEscalationEmail, getEscalationEmailTemplate } from '@/lib/mailer';
import prisma from '@/lib/prisma';

/**
 * Checks for complaints that have been pending for more than 10 days
 * and marks them as escalated, looking up the authority and sending an email.
 * This is the Server Action version that includes revalidation.
 */
export async function checkAndEscalate() {
    const result = await runEscalationCycle();
    
    if (result.success && result.count! > 0) {
        revalidatePath('/dashboard');
        revalidatePath('/my-reports');
        revalidatePath('/admin');
    }
    
    return result;
}

export async function getEscalationPreviewAction(id: string) {
    const result = await prepareEscalation(id);
    
    if (result.success && result.complaint && result.authorityDetails) {
        const { complaint, authorityDetails } = result;
        
        // Generate the HTML preview
        const html = getEscalationEmailTemplate(
            complaint.id,
            complaint.title,
            complaint.description,
            complaint.address,
            complaint.latitude as number,
            complaint.longitude as number,
            complaint.severity,
            authorityDetails
        );

        return { 
            success: true, 
            authorityDetails, 
            html, 
            deptEmail: result.deptEmail,
            title: complaint.title
        };
    }
    
    return { success: false, error: result.error || 'Failed to prepare preview' };
}

/**
 * Manually sends an escalation email after admin review.
 */
export async function sendManualEscalationAction(id: string, authorityDetails: string, targetEmail: string) {
    try {
        const complaint = await prisma.complaint.findUnique({
            where: { id }
        });

        if (!complaint) throw new Error('Complaint not found');

        const emailSent = await sendEscalationEmail(
            targetEmail,
            complaint.id,
            complaint.title,
            complaint.description,
            complaint.address,
            complaint.latitude,
            complaint.longitude,
            complaint.severity,
            authorityDetails
        );

        if (emailSent) {
            await (prisma as any).complaint.update({
                where: { id },
                data: {
                    isEscalated: true,
                    escalationEmailSent: true,
                    escalatedTo: authorityDetails,
                    escalatedAt: new Date()
                }
            });

            revalidatePath('/admin');
            revalidatePath('/dashboard');
            revalidatePath(`/complaints/${id}`);
            
            return { success: true };
        }
        
        return { success: false, error: 'Failed to send email' };
    } catch (error: any) {
        console.error('[ACTION] Manual escalation failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Toggles the pause state of an escalation timer.
 */
export async function toggleEscalationPauseAction(id: string, paused: boolean) {
    try {
        await (prisma as any).complaint.update({
            where: { id },
            data: { escalationPaused: paused }
        });
        
        revalidatePath('/admin');
        revalidatePath('/dashboard');
        
        return { success: true };
    } catch (error: any) {
        console.error('[ACTION] Toggle pause failed:', error);
        return { success: false, error: error.message };
    }
}
