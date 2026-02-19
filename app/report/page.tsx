import { SmartReportForm } from '@/components/report/smart-report-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ReportPage() {
    const session = await auth();

    if (!session) {
        redirect('/auth/signin');
    }

    if (session.user?.role === 'ADMIN') {
        redirect('/admin');
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 space-y-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                    Report an Issue
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Help us improve the city by reporting infrastructure failures.
                    Our AI-powered system will analyze your upload and notify authorities instantly.
                </p>
            </div>

            <SmartReportForm />
        </div>
    );
}
