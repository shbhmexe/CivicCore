import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { CardUpvoteButton } from '@/components/complaint/card-upvote-button';

// Badge Component (Inline for speed, or extract)
function StatusBadge({ status }: { status: string }) {
    const colors = {
        PENDING: 'bg-red-500/20 text-red-500 border-red-500/50',
        ASSIGNED: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
        IN_PROGRESS: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
        RESOLVED: 'bg-green-500/20 text-green-500 border-green-500/50',
        REJECTED: 'bg-gray-500/20 text-gray-500 border-gray-500/50',
    };
    // @ts-ignore
    const classes = colors[status] || colors.PENDING;
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${classes}`}>
            {status}
        </span>
    );
}

export function ComplaintList({ complaints, userId }: { complaints: any[]; userId?: string }) {
    if (complaints.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground glass-panel rounded-lg">
                No complaints found in this area. Be the first to report!
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complaints.map((complaint) => (
                <Link href={`/complaints/${complaint.id}`} key={complaint.id} className="block group">
                    <Card className="glass-card hover:bg-white/10 transition-colors h-full">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <StatusBadge status={complaint.status} />
                                <span className="text-xs text-muted-foreground">
                                    {new Date(complaint.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <CardTitle className="text-lg mt-2 truncate group-hover:text-teal-400 transition-colors">{complaint.title}</CardTitle>
                            <CardDescription className="line-clamp-2">{complaint.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                            {complaint.images[0] && (
                                <div className="relative w-full h-48 rounded-md overflow-hidden">
                                    <Image src={complaint.images[0]} alt={complaint.title} fill className="object-cover" />
                                </div>
                            )}

                            {/* Resolution Proof Banner */}
                            {complaint.status === 'RESOLVED' && complaint.resolutionImage && (
                                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                        <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Resolved</span>
                                    </div>
                                    <div className="relative w-full h-32 rounded-md overflow-hidden">
                                        <Image src={complaint.resolutionImage} alt="Resolution proof" fill className="object-cover" />
                                    </div>
                                </div>
                            )}

                            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                                <span className="font-semibold text-primary">{complaint.category}</span>
                                <span>•</span>
                                <span>{complaint.address || "Unknown Location"}</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                            <div className="flex gap-4 items-center">
                                <CardUpvoteButton
                                    complaintId={complaint.id}
                                    initialVoteCount={complaint.votes?.length || 0}
                                    initialVoted={userId ? complaint.votes?.some((v: any) => v.userId === userId) : false}
                                />
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-400">
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    {complaint._count?.comments || 0}
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </Link>
            ))}
        </div>
    );
}

