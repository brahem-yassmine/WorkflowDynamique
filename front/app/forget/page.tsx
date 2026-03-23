'use client';

const API_URL = 'http://localhost:5000/api';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import { Mail, ArrowLeft, Send, CheckCircle2, ShieldQuestion } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgetPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            if (response.data.success) {
                setSubmitted(true);
                toast.success('Reset link sent!');
            }
        } catch (error: any) {
            console.error('Forget password error:', error);
            const msg = error.response?.data?.message || 'An error occurred.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <Link href="/signin" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm z-50">
                <ArrowLeft size={16} /> Back
            </Link>
            <Toaster position="top-right" richColors />

            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl shadow-indigo-100/50 p-14 relative z-10 border border-slate-100"
            >
                <Link
                    href="/signin"
                    className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors mb-10 text-xs font-black uppercase tracking-widest"
                >
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors border border-transparent group-hover:border-indigo-100">
                        <ArrowLeft size={16} />
                    </div>
                    Back to Login
                </Link>

                <AnimatePresence mode="wait">
                    {!submitted ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-8">
                                <ShieldQuestion className="text-white w-8 h-8" />
                            </div>

                            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-tight mb-4">
                                Forgot <br /> <span className="text-indigo-600 font-black">Password?</span>
                            </h1>

                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                                Enter the email address associated with your account and we will send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="example@box.com"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Send Reset Link
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-2"
                        >
                            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100">
                                <CheckCircle2 className="text-emerald-500 w-10 h-10" />
                            </div>

                            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase mb-4">
                                Email <span className="text-emerald-500 text-6xl block mt-[-10px]">Sent</span>
                            </h1>

                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                                We have sent instructions to <br /> <strong className="text-slate-800 underline decoration-indigo-200 decoration-[4px] underline-offset-4">{email}</strong>. <br /> Please check your inbox.
                            </p>

                            <button
                                onClick={() => setSubmitted(false)}
                                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors underline underline-offset-8"
                            >
                                I didn't receive the email
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <p className="mt-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] relative z-10">
                Axia Workflow System v2.0
            </p>
        </div>
    );
}
