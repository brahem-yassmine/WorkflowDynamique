'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, X, ArrowRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function SubscriptionWarning() {
    const [isVisible, setIsVisible] = useState(false);
    const [daysLeft, setDaysLeft] = useState<number | null>(null);
    const [planName, setPlanName] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkSubscription = () => {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;

            try {
                const user = JSON.parse(userStr);
                // These values should be updated during login or periodic checks
                const warningSoon = localStorage.getItem('subscription_warning') === 'true';
                const days = localStorage.getItem('subscription_days_left');
                const plan = localStorage.getItem('subscription_plan');

                if (warningSoon && days) {
                    setDaysLeft(parseInt(days));
                    setPlanName(plan || 'Current Plan');
                    setIsVisible(true);
                }
            } catch (err) {
                console.error('Error parsing user for subscription warning:', err);
            }
        };

        checkSubscription();
        // Check every minute in case something changes
        const interval = setInterval(checkSubscription, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-rose-600 text-white relative overflow-hidden"
                >
                    <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex-1 flex items-center min-w-0">
                                <span className="flex p-2 rounded-lg bg-rose-700">
                                    <AlertCircle className="h-5 w-5 text-white" aria-hidden="true" />
                                </span>
                                <p className="ml-3 font-bold text-white truncate">
                                    <span className="md:hidden text-xs uppercase tracking-widest">
                                        Action Requis: {daysLeft} jours restants!
                                    </span>
                                    <span className="hidden md:inline text-sm font-black uppercase tracking-widest">
                                        Attention : Votre abonnement <span className="underline decoration-rose-300">{planName}</span> expire dans {daysLeft} jours.
                                    </span>
                                </p>
                            </div>
                            <div className="order-3 flex-shrink-0 w-full sm:order-2 sm:w-auto">
                                <button
                                    onClick={() => router.push('/admin/billing')}
                                    className="flex items-center justify-center px-6 py-2 border border-transparent rounded-xl shadow-sm text-xs font-black uppercase tracking-widest text-rose-600 bg-white hover:bg-rose-50 transition-all active:scale-95"
                                >
                                    <Zap size={14} className="mr-2" />
                                    Renouveler Maintenant
                                </button>
                            </div>
                            <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-2">
                                <button
                                    type="button"
                                    onClick={() => setIsVisible(false)}
                                    className="-mr-1 flex p-2 rounded-md hover:bg-rose-500 focus:outline-none transition-colors"
                                >
                                    <span className="sr-only">Dismiss</span>
                                    <X className="h-5 w-5 text-white" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-rose-500 rounded-full opacity-20 blur-2xl"></div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
