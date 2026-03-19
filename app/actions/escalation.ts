import { revalidatePath } from 'next/cache';
import { runEscalationCycle } from '@/lib/escalation';

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
    }
    
    return result;
}

