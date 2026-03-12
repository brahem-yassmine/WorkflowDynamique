'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    CreditCard,
    TrendingUp,
    ArrowUpRight,
    Download,
    Clock,
    FileText,
    CheckCircle2,
    AlertCircle,
    Activity,
    Zap,
    DollarSign,
    ShieldCheck,
    ChevronUp,
    ChevronDown,
    X,
    Calendar,
    User,
    Lock
} from 'lucide-react';
import axios from 'axios';
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = 'http://localhost:5000/api';

interface Plan {
    _id: string;
    name: string;
    code: string;
    displayName: string;
    monthlyPrice: number;
    yearlyPrice: number;
    currency: string;
    features: any;
}

interface HistoryItem {
    _id: string;
    planName: string;
    planCode: string;
    price: number;
    status: string;
    createdAt: string;
    startDate?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    trialStartDate?: string;
    trialEndDate?: string;
    endDate?: string;
    selectedBy?: {
        email: string;
        firstName?: string;
        lastName?: string;
    };
}

interface PaymentDetails {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
}

type PlanType = 'demo' | 'starter' | 'pro';

const PLANS: { id: PlanType; name: string; price: string; features: string[] }[] = [
  { id: 'demo',    name: 'Demo Plan',     price: 'Free',       features: ['Up to 5 staff', 'Fixed'] },
  { id: 'starter', name: 'Starter Plan',  price: '79D/month',  features: ['Up to 10 staff', 'Pro analysis'] },
  { id: 'pro',     name: 'Pro Plan',      price: '299D/month', features: ['Unlimited staff', 'Advanced AI'] },
];


const fmtDate = (date: Date | null) =>
  date ? date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

const FISCAL_DATA = [
    { month: 'Oct', amount: 4500 },
    { month: 'Nov', amount: 5200 },
    { month: 'Dec', amount: 4800 },
    { month: 'Jan', amount: 6100 },
    { month: 'Feb', amount: 5900 },
    { month: 'Mar', amount: 7200 },
];


export default function BillingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const upgradeRequest = searchParams.get('upgrade') as PlanType;

    const [plan, setPlan] = useState<PlanType>('demo');
    const [days, setDays] = useState(0);
    const [start, setStart] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirm, setConfirm] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [dbPlans, setDbPlans] = useState<Plan[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingPlan, setPendingPlan] = useState<PlanType | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const { subscriptionExpired: isExpired, daysRemaining, subscriptionLimit: limit } = useAuth();
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
        cardNumber: "",
        cardHolder: "",
        expiryDate: "",
        cvv: ""
    });

    const handleDownloadManifest = () => {
        if (history.length === 0) {
            toast.error("No transaction records to export");
            return;
        }

        const headers = ["Reference", "Plan", "Date", "Amount", "Status"];
        const csvContent = [
            headers.join(","),
            ...history.map(inv => {
                const date = fmtDate(new Date(inv.currentPeriodStart || inv.trialStartDate || inv.startDate || inv.createdAt || Date.now()));
                return [
                    `#${inv._id.slice(-8).toUpperCase()}`,
                    inv.planName,
                    date,
                    `${inv.price}D`,
                    inv.status
                ].join(",");
            })
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `fiscal_manifest_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Manifest exported successfully");
    };

    useEffect(() => {
        const fetchContext = async () => {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');
            
            try {
                // 1. Fetch Plans
                const plansRes = await axios.get(`${API_URL}/plans`);
                if (plansRes.data.success) setDbPlans(plansRes.data.data);

                if (token) {
                    // 2. Fetch History
                    const historyRes = await axios.get(`${API_URL}/subscriptions/history`, {
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'x-tenant-id': tenantId
                        }
                    });
                    if (historyRes.data.success) {
                        setHistory(historyRes.data.data);
                    }

                    // 3. Fetch Current Subscription
                    const currentRes = await axios.get(`${API_URL}/subscriptions/current`, {
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'x-tenant-id': tenantId
                        }
                    });
                    
                    if (currentRes.data.success && (currentRes.data.data.subscription || currentRes.data.data.tenantSubscription)) {
                        const sub = currentRes.data.data.subscription || currentRes.data.data.tenantSubscription;
                        const backendPlan = (sub.planCode || sub.planName || '').toLowerCase();
                        
                        let mappedPlan: PlanType = 'demo';
                        if (backendPlan.includes('starter')) mappedPlan = 'starter';
                        else if (backendPlan.includes('pro')) mappedPlan = 'pro';

                        setPlan(mappedPlan);
                        const sDateStr = sub.currentPeriodStart || sub.trialStartDate || sub.startDate || sub.createdAt;
                        if (sDateStr) {
                            const sDate = new Date(sDateStr);
                            setStart(sDate);
                            setDays(Math.ceil(Math.abs(Date.now() - sDate.getTime()) / 86400000));
                            
                            localStorage.setItem('selectedPlan', mappedPlan);
                            localStorage.setItem('planStartDate', sDate.toISOString());
                        }
                    } else {
                        loadFromLocalStorage();
                    }
                } else {
                    loadFromLocalStorage();
                }
            } catch (err) {
                console.error("Failed to fetch billing context:", err);
                loadFromLocalStorage();
            }
            setLoading(false);
        };

        const loadFromLocalStorage = () => {
            const saved = localStorage.getItem('selectedPlan') as PlanType;
            const savedDate = localStorage.getItem('planStartDate');
            if (saved && PLANS.find(p => p.id === saved)) setPlan(saved);
            const date = savedDate ? new Date(savedDate) : new Date();
            if (!savedDate) localStorage.setItem('planStartDate', date.toISOString());
            setStart(date);
            setDays(Math.ceil(Math.abs(Date.now() - date.getTime()) / 86400000));
        };

        fetchContext();
    }, []);

    useEffect(() => {
        if (upgradeRequest && PLANS.find(p => p.id === upgradeRequest) && !loading) {
            setPendingPlan(upgradeRequest);
            setShowPaymentModal(true);
        }
    }, [upgradeRequest, loading]);

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "cardNumber") {
            const cleaned = value.replace(/\s/g, "");
            if (cleaned.length <= 16) {
                const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
                setPaymentDetails(prev => ({ ...prev, [name]: formatted }));
            }
            return;
        }
        if (name === "expiryDate") {
            const cleaned = value.replace(/\D/g, "");
            if (cleaned.length <= 4) {
                if (cleaned.length > 2) {
                    setPaymentDetails(prev => ({ ...prev, [name]: `${cleaned.slice(0, 2)}/${cleaned.slice(2)}` }));
                } else {
                    setPaymentDetails(prev => ({ ...prev, [name]: cleaned }));
                }
            }
            return;
        }
        if (name === "cvv") {
            const cleaned = value.replace(/\D/g, "");
            if (cleaned.length <= 4) setPaymentDetails(prev => ({ ...prev, [name]: cleaned }));
            return;
        }
        setPaymentDetails(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        if (!loading && plan) {
            const isNowExpired = days >= 7;
            
            if (isNowExpired) {
                setTimeout(() => {
                    const el = document.getElementById('plans-protocol');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            }

            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user.subscriptionExpired !== isNowExpired) {
                        user.subscriptionExpired = isNowExpired;
                        localStorage.setItem('user', JSON.stringify(user));
                        window.dispatchEvent(new Event('subscriptionChange'));
                    }
                } catch (e) {
                    console.error("Failed to sync expiry state", e);
                }
            }
        }
    }, [loading, plan, days]);

    const changePlan = async (next: PlanType) => {
        if (next === plan) return;
        
        // Block downgrade from paid to demo
        if (next === 'demo' && plan !== 'demo') {
            toast.error("Downgrade to Demo is restricted for security protocols.");
            return;
        }

        if (next !== 'demo' && plan === 'demo') {
            setPendingPlan(next);
            setShowPaymentModal(true);
            return;
        }

        await executePlanChange(next);
    };

    const executePlanChange = async (next: PlanType, pDetails?: PaymentDetails) => {
        setLoading(true);
        try {
            const targetPlan = dbPlans.find(p => p.code.toLowerCase() === next.toLowerCase());
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');

            if (targetPlan && token) {
                const response = await axios.post(`${API_URL}/subscriptions/change`, {
                    planId: targetPlan._id,
                    billingCycle: 'monthly',
                    paymentInfo: pDetails
                }, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'x-tenant-id': tenantId
                    }
                });

                if (response.data.success) {
                    setPlan(next);
                    const now = new Date();
                    setStart(now);
                    setDays(0);
                    localStorage.setItem('selectedPlan', next);
                    localStorage.setItem('planStartDate', now.toISOString());

                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        try {
                            const user = JSON.parse(userStr);
                            user.subscriptionExpired = false;
                            localStorage.setItem('user', JSON.stringify(user));
                            window.dispatchEvent(new Event('subscriptionChange'));
                        } catch (e) {
                            console.error("Failed to sync expiry state", e);
                        }
                    }

                    setShowPaymentModal(false);
                    setConfirm(false);
                    toast.success(`Plan updated to ${next} successfully!`);

                    // Refresh History
                    try {
                        const historyRes = await axios.get(`${API_URL}/subscriptions/history`, {
                            headers: { 
                                Authorization: `Bearer ${token}`,
                                'x-tenant-id': tenantId
                            }
                        });
                        if (historyRes.data.success) {
                            setHistory(historyRes.data.data);
                        }
                    } catch (e) { console.error("Error refreshing history:", e); }
                } else {
                     toast.error(response.data.message || "Failed to change plan");
                }
            } else {
                // Fallback for demo/no-backend
                localStorage.setItem('selectedPlan', next);
                localStorage.setItem('planStartDate', new Date().toISOString());
                setPlan(next);
                setStart(new Date());
                setDays(0);
                setShowPaymentModal(false);
                setConfirm(false);
                toast.success(`Demo: Plan simulated as ${next}`);
            }
        } catch (err: any) {
            console.error("Plan change failed:", err);
            const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to change plan";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
    );

    const idx = PLANS.findIndex(p => p.id === plan);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 bg-slate-50/30 min-h-screen">
            {/* Header Protocol */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
                            <Zap size={20} className="text-white fill-white/20" />
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">System Level: admin</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Fiscal Matrix</h1>
                    <p className="text-slate-500 font-bold mt-4 uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        Active Subscription & Resource Allocation Ledger
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => {
                            const el = document.getElementById('ledger-registry');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <Calendar size={14} />
                        Cycle Report
                    </button>
                    <button 
                        onClick={handleDownloadManifest}
                        className="px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200 font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                    >
                        Download Manifest
                    </button>
                </div>
            </header>

            {/* Dash Status */}
            {isExpired && (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-[2rem] p-8 flex items-center justify-between shadow-xl shadow-rose-100/50">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                            <Lock size={32} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">Subscription Expired</h4>
                            <p className="text-slate-600 font-bold mt-1">
                                Your access period has ended. Please renew to restore lattice uplink.
                            </p>
                        </div>
                    </div>
                    <button 
                         onClick={() => {
                            const el = document.getElementById('plans-protocol');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-700 transition-all active:scale-95 shadow-xl shadow-rose-200"
                    >
                        Renew Access Now
                    </button>
                </div>
            )}

            {/* Dashboard Lattice */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
                <div className="lg:col-span-6 space-y-8">
                    {/* Stats above chart */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatsLedger 
                            label="Fiscal Status" 
                            value={isExpired ? "Restricted" : "Active"} 
                            trend={isExpired ? "Critical Delay" : "Optimal Sync"} 
                            icon={<Activity size={24} />} 
                            color={isExpired ? "text-rose-500" : "text-emerald-500"}
                        />
                        <StatsLedger 
                            label="Renewal Window" 
                            value={isExpired ? "0 Days" : `${daysRemaining} Days`} 
                            trend={isExpired ? "TERMINAL" : "Approaching"} 
                            icon={<Clock size={24} />} 
                            color={isExpired ? "text-rose-600" : (daysRemaining <= 3 ? "text-rose-500" : "text-amber-500")} 
                        />
                    </div>
                    
                    {/* Re-implemented Statistic Chart */}
                    <FiscalChart />
                </div>

                {/* Plan Manifest */}
                <div className="lg:col-span-4 bg-indigo-700 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col min-h-[500px] justify-between h-full">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Current Authorization</h3>
                        <h2 className="text-3xl font-black tracking-tight mt-2">{plan.toUpperCase()} Plan</h2>
                        <p className="text-indigo-100 text-sm font-medium mt-4 leading-relaxed opacity-80">
                            {plan === 'demo' ? 'Basic orchestration nodes with fundamental support protocols.' : 
                             plan === 'starter' ? 'Enhanced lattice throughput with priority uplink and API access.' : 
                             'Full enterprise-grade orchestration with 24/7 forensics and advanced analytics.'}
                        </p>
                    </div>

                    <div className="relative z-10 pt-10 border-t border-white/10 mt-6">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div 
                                className="cursor-help hover:bg-white/5 p-1 rounded-lg transition-colors"
                                onClick={() => setShowDebug(!showDebug)}
                            >
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Sync Date</p>
                                <p className="text-sm font-black mt-1">{fmtDate(start)}</p>
                                {showDebug && (
                                    <input 
                                        type="date" 
                                        className="mt-2 bg-indigo-900 border border-indigo-400 rounded px-2 py-1 text-[10px] text-white w-full"
                                        onChange={(e) => {
                                            const d = new Date(e.target.value);
                                            if (!isNaN(d.getTime())) {
                                                setStart(d);
                                                localStorage.setItem('planStartDate', d.toISOString());
                                                setDays(Math.ceil(Math.abs(Date.now() - d.getTime()) / 86400000));
                                            }
                                        }}
                                    />
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Active Time</p>
                                <p className="text-sm font-black mt-1">{days} Days</p>
                            </div>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-8">
                            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (days / 7) * 100)}%` }}></div>
                        </div>
                        <button 
                            onClick={() => setConfirm(true)}
                            className="w-full py-4 bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                        >
                            Session Termination Locked
                        </button>
                    </div>
                </div>
            </div>

            {/* Change Plan - Subscription Protocol */}
            <section id="plans-protocol" className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Subscription Protocol</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Matrix Scaling Options</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((p) => {
                        const isCurrent = p.id === plan;
                        const isDemo = p.id === 'demo';
                        const isRestricted = isDemo && plan !== 'demo';

                        return (
                            <div key={p.id} className={`rounded-[32px] border-2 p-8 transition-all relative overflow-hidden group ${
                                isCurrent ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 bg-white hover:border-slate-200'
                            }`}>
                                {isCurrent && (
                                    <div className="absolute top-4 right-4 bg-indigo-600 text-white p-1 rounded-full">
                                        <CheckCircle2 size={12} />
                                    </div>
                                )}
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{p.price}</p>
                                <h4 className="text-xl font-black text-slate-800 tracking-tight mb-6">{p.name}</h4>
                                <ul className="space-y-4 mb-10">
                                    {p.features.map(f => (
                                        <li key={f} className="text-xs text-slate-500 font-bold flex gap-3 items-center">
                                            <div className={`p-1 rounded-md ${isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <CheckCircle2 size={10} />
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => changePlan(p.id)}
                                    disabled={isCurrent || loading || isRestricted}
                                    className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
                                        isCurrent 
                                        ? 'bg-slate-100 text-slate-400 cursor-default' 
                                        : isRestricted
                                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                                    }`}
                                >
                                    {isCurrent ? 'Active Protocol' : isRestricted ? 'Restricted' : 'Sync Request'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-10 flex gap-4">
                    <button
                        onClick={() => idx > 0 && changePlan(PLANS[idx - 1].id)}
                        disabled={idx === 0 || loading || (idx === 1 && plan !== 'demo')}
                        className="flex-1 py-4 px-6 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all disabled:opacity-50"
                    >
                        <ChevronDown size={14} />
                        {idx === 1 && plan !== 'demo' ? 'Downgrade Restricted' : 'Downgrade Protocol'}
                    </button>
                    <button
                        onClick={() => idx < PLANS.length - 1 && changePlan(PLANS[idx + 1].id)}
                        disabled={idx === PLANS.length - 1 || loading}
                        className="flex-1 py-4 px-6 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                    >
                        <ChevronUp size={14} />
                        Upgrade Matrix
                    </button>
                </div>
            </section>

            {/* Invoice Registry */}
            <section id="ledger-registry" className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Ledger Registry</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Transaction History & Invoices</p>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">
                        <Download size={14} />
                        Export Full Ledger
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Reference</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Plan</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Period</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Amount</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {history.length > 0 ? history.map((inv) => (
                                <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-10 py-6 font-mono text-xs font-black text-slate-400">#{inv._id.slice(-8).toUpperCase()}</td>
                                    <td className="px-6 py-6 font-bold text-sm text-slate-700">{inv.planName}</td>
                                    <td className="px-6 py-6 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="flex items-center gap-1.5"><Calendar size={10} className="text-indigo-400"/> {fmtDate(new Date(inv.currentPeriodStart || inv.trialStartDate || inv.startDate || inv.createdAt || Date.now()))}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 font-black text-sm text-slate-800">{inv.price}D</td>
                                    <td className="px-10 py-6 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${inv.status === 'active' || inv.status === 'trial' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                            {inv.status === 'active' || inv.status === 'trial' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-10 py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
                                        No transaction records detected
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Confirm Termination Modal */}
            {confirm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl">
                        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-4">Terminate Protocol?</h2>
                        <p className="text-sm text-slate-500 font-bold mb-8 leading-relaxed">
                            Downgrading to Demo will restrict system capabilities. This action is recorded in the matrix logs.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setConfirm(false)} className="py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100">Abort</button>
                            <button onClick={() => executePlanChange('demo')} className="py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 shadow-xl">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && pendingPlan && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Payment Protocol</h2>
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            executePlanChange(pendingPlan, paymentDetails);
                        }} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Card Number</label>
                                <input name="cardNumber" value={paymentDetails.cardNumber} onChange={handlePaymentChange} required className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 ring-indigo-500" placeholder="0000 0000 0000 0000" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Expiry</label>
                                    <input name="expiryDate" value={paymentDetails.expiryDate} onChange={handlePaymentChange} required className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none placeholder:opacity-50" placeholder="MM/YY" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">CVV</label>
                                    <input name="cvv" value={paymentDetails.cvv} onChange={handlePaymentChange} required className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none" placeholder="***" type="password" />
                                </div>
                            </div>
                            <div className="pt-4">
                                <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200">
                                    {loading ? "Syncing..." : "Authorize Uplink"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function FiscalChart() {
    return (
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-[400px] relative overflow-hidden group transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/5">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                <TrendingUp size={120} />
            </div>
            <div className="flex justify-between items-center mb-10 relative z-10">
                <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Fiscal Analytics</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Resource Consumption Vectors</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase">Optimal Sync</span>
                    </div>
                </div>
            </div>
            <div className="h-[240px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={FISCAL_DATA}>
                        <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                            dy={10}
                        />
                        <YAxis 
                            hide={true}
                        />
                        <Tooltip 
                            contentStyle={{
                                borderRadius: '20px', 
                                border: 'none', 
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                padding: '12px 16px'
                            }}
                            itemStyle={{
                                fontWeight: 900,
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                color: '#4f46e5'
                            }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#4f46e5" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorAmount)" 
                            animationDuration={2000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function StatsLedger({ label, value, trend, icon, color = "text-indigo-600" }: { label: string; value: string; trend: string; icon: React.ReactNode; color?: string }) {
    return (
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all">
                {icon}
            </div>
            <div className="flex items-center gap-3 text-slate-400 mb-4">
                <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex items-end justify-between">
                <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
                <div className={`flex items-center gap-1 text-[10px] font-black ${color.includes('amber') ? 'text-amber-500' : 'text-emerald-500'}`}>
                    <TrendingUp size={12} />
                    {trend}
                </div>
            </div>
        </div>
    );
}
