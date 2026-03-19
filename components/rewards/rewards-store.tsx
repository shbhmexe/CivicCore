'use client';

import { useState, useTransition } from 'react';
import { Gift, ShoppingBag, CreditCard, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { redeemReward } from '@/app/actions/redeem';
import { toast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const REWARDS = [
    {
        id: 'amazon-500',
        name: 'Amazon Gift Card',
        brand: 'Amazon',
        value: '₹500',
        points: 500,
        color: 'from-[#232f3e] to-[#37475a]',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg'
    },
    {
        id: 'flipkart-500',
        name: 'Flipkart Voucher',
        brand: 'Flipkart',
        value: '₹500',
        points: 450,
        color: 'from-[#2874f0] to-[#047bd5]',
        logo: 'https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/logo_lite-cbb357.png'
    },
    {
        id: 'swiggy-250',
        name: 'Swiggy Food Coupon',
        brand: 'Swiggy',
        value: '₹250',
        points: 200,
        color: 'from-[#fc8019] to-[#ff5d00]',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/12/Swiggy_logo.svg/1200px-Swiggy_logo.svg.png'
    },
    {
        id: 'zomato-250',
        name: 'Zomato Credits',
        brand: 'Zomato',
        value: '₹250',
        points: 200,
        color: 'from-[#cb202d] to-[#e03a3c]',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Zomato_Logo.svg'
    }
];

export default function RewardsPage({ userKarma }: { userKarma: number }) {
    const [isPending, startTransition] = useTransition();
    const [successCode, setSuccessCode] = useState<string | null>(null);

    const handleRedeem = (reward: (typeof REWARDS)[0]) => {
        if (userKarma < reward.points) {
            toast(`You need ${reward.points - userKarma} more karma points.`, "error");
            return;
        }

        startTransition(async () => {
            const result = await redeemReward(reward.name, reward.points);
            if (result.success) {
                toast(`Your ${reward.name} has been processed.`, "success");
                setSuccessCode("REDEEMED-" + Math.random().toString(36).substring(7).toUpperCase());
            } else {
                toast(result.error || "Failed to redeem reward.", "error");
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Navy Hero Banner */}
            <div className="bg-[#002f5a] relative overflow-hidden py-16 pb-24">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[60%] bg-orange-500 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[50%] bg-blue-400 rounded-full blur-[100px]" />
                </div>
                
                <div className="max-w-6xl mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <Link href="/dashboard" className="inline-flex items-center text-sm text-blue-200 hover:text-white transition-colors mb-6 group font-medium">
                                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                                Back to Dashboard
                            </Link>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">Karma Store</h1>
                            <p className="text-blue-100/70 text-lg font-medium">Redeem your hard-earned points for exclusive gift cards.</p>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] flex flex-col items-center shadow-2xl">
                            <span className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2">Available Balance</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-white">{userKarma}</span>
                                <span className="text-sm font-black text-blue-200">KARMA</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20 pb-20">
                {/* Rewards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {REWARDS.map((reward) => (
                        <Card key={reward.id} className="group relative overflow-hidden bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] flex flex-col">
                            <div className={cn("absolute inset-x-0 top-0 h-2 bg-gradient-to-r", reward.color)} />
                            <CardHeader className="text-center pt-10 pb-4">
                                <div className="w-20 h-20 mx-auto bg-gray-50 rounded-[2rem] p-4 shadow-inner mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                    <img src={reward.logo} alt={reward.brand} className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all" />
                                </div>
                                <CardTitle className="text-xl font-extrabold text-[#002f5a]">{reward.name}</CardTitle>
                                <CardDescription className="text-orange-600 font-bold uppercase tracking-widest text-[10px] mt-1">{reward.value} Voucher</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 mt-auto">
                                <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100 group-hover:bg-orange-50/50 group-hover:border-orange-100 transition-colors">
                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Redeem For</span>
                                    <span className="text-2xl font-black text-[#002f5a]">{reward.points} <span className="text-xs text-gray-400">PTS</span></span>
                                </div>
                                <Button 
                                    onClick={() => handleRedeem(reward)}
                                    disabled={isPending || userKarma < reward.points}
                                    className={cn(
                                        "w-full h-14 rounded-2xl font-black text-sm uppercase tracking-wider transition-all",
                                        userKarma < reward.points 
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                            : "bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 active:scale-95"
                                    )}
                                >
                                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Redeem Now"}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Info / Perks Section */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 p-12 bg-white rounded-[3rem] border border-gray-100 shadow-xl">
                    <div className="flex flex-col items-center text-center gap-5 group">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-[#002f5a] group-hover:text-white transition-all duration-300 shadow-sm">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-black text-[#002f5a] text-lg mb-2">Instant Delivery</h3>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">Your gift card code is generated instantly upon successful redemption.</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center text-center gap-5 group">
                        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-[#f97316] group-hover:bg-[#f97316] group-hover:text-white transition-all duration-300 shadow-sm">
                            <Gift className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-black text-[#002f5a] text-lg mb-2">Partner Rewards</h3>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">We partner with India's top brands to bring you the best value for your karma.</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center text-center gap-5 group">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-300 shadow-sm">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-black text-[#002f5a] text-lg mb-2">No Refunds</h3>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">Points once redeemed cannot be returned. Please verify your selection carefully.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
