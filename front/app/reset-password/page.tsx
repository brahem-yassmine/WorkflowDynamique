'use client';

const API_URL = 'http://localhost:5001/api';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const t = searchParams.get('token');
        if (t) setToken(t);
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas.');
            return;
        }

        if (password.length < 8) {
            toast.error('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5001/api/auth/reset-password', {
                token,
                password
            });

            if (response.data.success) {
                setSubmitted(true);
                toast.success('Mot de passe mis à jour !');
                setTimeout(() => {
                    router.push('/signin');
                }, 3000);
            }
        } catch (error: any) {
            console.error('Reset password error:', error);
            const msg = error.response?.data?.message || 'Lien invalide ou expiré.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
                <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-rose-100/50 border border-rose-50 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-500">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Token Manquant</h2>
                    <p className="text-slate-500 text-sm font-medium mb-8">Ce lien de réinitialisation semble invalide. Veuillez recommencer la procédure.</p>
                    <button
                        onClick={() => router.push('/forget')}
                        className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all"
                    >
                        Retourner à la demande
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <Toaster position="top-right" richColors />

            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-indigo-100/50 p-10 relative z-10 border border-slate-100"
            >
                <AnimatePresence mode="wait">
                    {!submitted ? (
                        <motion.div
                            key="reset-form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-8">
                                <ShieldCheck className="text-white w-8 h-8" />
                            </div>

                            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-tight mb-4">
                                Nouveau <br /> <span className="text-indigo-600">Mot de passe</span>
                            </h1>

                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                                Veuillez choisir un mot de passe fort et sécurisé pour protéger votre compte.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Nouveau Mot de passe
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Confirmer le Mot de passe
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300"
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
                                            Mettre à jour le mot de passe
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-6"
                        >
                            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100">
                                <CheckCircle2 className="text-emerald-500 w-10 h-10" />
                            </div>

                            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase mb-4">
                                Succès <span className="text-emerald-500 text-6xl block mt-[-10px]">Mis à jour</span>
                            </h1>

                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                                Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
                            </p>

                            <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 3 }}
                                    className="h-full bg-emerald-500"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <p className="mt-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] relative z-10">
                Sécurité Système Activée
            </p>
        </div>
    );
}
