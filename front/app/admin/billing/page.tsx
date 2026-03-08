'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  { id: 'demo',    name: 'Demo Starter',  price: 'Free',       features: ['Basic features', 'Email support'] },
  { id: 'starter', name: 'Starter',       price: '$29/month',  features: ['All demo features', 'Priority support', 'API access'] },
  { id: 'pro',     name: 'Professional',  price: '$99/month',  features: ['All starter features', '24/7 support', 'Advanced analytics'] },
];

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';

const FISCAL_DATA = [
    { month: 'Oct', amount: 4500 },
    { month: 'Nov', amount: 5200 },
    { month: 'Dec', amount: 4800 },
    { month: 'Jan', amount: 6100 },
    { month: 'Feb', amount: 5900 },
    { month: 'Mar', amount: 7200 },
];

const INVOICES = [
    { id: 'INV-2025-001', date: 'Mar 01, 2025', amount: '$720.00', status: 'Paid', type: 'Node Scaling' },
    { id: 'INV-2025-002', date: 'Feb 01, 2025', amount: '$720.00', status: 'Paid', type: 'Lattice Maintenance' },
    { id: 'INV-2025-003', date: 'Jan 01, 2025', amount: '$1,200.00', status: 'Late', type: 'Storage Expansion' },
];

export default function BillingPage() {
    const router = useRouter();
    const [plan, setPlan] = useState<PlanType>('demo');
    const [days, setDays] = useState(0);
    const [start, setStart] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirm, setConfirm] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const { subscriptionExpired: isExpired, daysRemaining, subscriptionLimit: limit } = useAuth();

    // New States
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [dbPlans, setDbPlans] = useState<Plan[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingPlan, setPendingPlan] = useState<PlanType | null>(null);

    useEffect(() => {
        // 1. Initial Local Check
        const saved = localStorage.getItem('selectedPlan') as PlanType;
        const savedDate = localStorage.getItem('planStartDate');
        if (saved && PLANS.find(p => p.id === saved)) setPlan(saved);
        const date = savedDate ? new Date(savedDate) : new Date();
        setStart(date);
        setDays(Math.ceil(Math.abs(Date.now() - date.getTime()) / 86400000));

        // 2. Fetch Context from Backend
        const fetchContext = async () => {
            const token = localStorage.getItem('auth_token');
            const tenantId = localStorage.getItem('tenantId');
            
            if (token) {
                try {
                    // Fetch History
                    const historyRes = await axios.get(`${API_URL}/subscriptions/history`, {
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'x-tenant-id': tenantId
                        }
                    });
                    if (historyRes.data.success) {
                        setHistory(historyRes.data.data);
                    }

                    // Fetch Available Plans (for mapping IDs)
                    const plansRes = await axios.get(`${API_URL}/plans`, {
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'x-tenant-id': tenantId
                        }
                    });
                    if (plansRes.data.success) {
                        setDbPlans(plansRes.data.data);
                    }

                    // Fetch Current Subscription
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
                        // Robust date fallback: currentPeriodStart -> trialStartDate -> startDate -> createdAt
                        const sDateStr = sub.currentPeriodStart || sub.trialStartDate || sub.startDate || sub.createdAt;
                        if (sDateStr) {
                            const sDate = new Date(sDateStr);
                            setStart(sDate);
                            setDays(Math.ceil(Math.abs(Date.now() - sDate.getTime()) / 86400000));
                            
                            localStorage.setItem('selectedPlan', mappedPlan);
                            localStorage.setItem('planStartDate', sDate.toISOString());
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch billing context:", err);
                }
            }
            setLoading(false);
        };

        fetchContext();
    }, []);

    useEffect(() => {
        if (!loading && plan) {
            const isNowExpired = days >= (plan === 'demo' ? 7 : 15);
            
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
            const token = localStorage.getItem('auth_token');
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
                        const user = JSON.parse(userStr);
                        user.subscriptionExpired = false;
                        localStorage.setItem('user', JSON.stringify(user));
                        window.dispatchEvent(new Event('subscriptionChange'));
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
                }
            } else {
                // Fallback
                localStorage.setItem('selectedPlan', next);
                localStorage.setItem('planStartDate', new Date().toISOString());
                setPlan(next);
                setStart(new Date());
                setDays(0);
                setShowPaymentModal(false);
                setConfirm(false);
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
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Expiration Warning */}
            {isExpired && (
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-[32px] flex items-center justify-between shadow-sm animate-pulse">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                            <AlertCircle size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-rose-950 tracking-tight">Subscription Expired</h3>
                            <p className="text-rose-600/70 text-sm font-bold mt-1">
                                Your <span className="font-black underline uppercase">{plan}</span> protocol has reached its terminal window. 
                                Please {plan === 'demo' ? 'Uplink to a Paid Plan' : 'Renew your Matrix access'} below.
                            </p>
                        </div>
                    </div>
                </div>
            )}


            {/* Top Ledger Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsLedger label="Current Cycle" value="$7,200.00" trend="+14.2%" icon={<DollarSign size={20} />} />
                <StatsLedger label="Node Licenses" value="24 Active" trend="Nominal" icon={<Activity size={20} />} />
                <StatsLedger label="Resource Load" value="82.4 GB" trend="+5.1GB" icon={<Zap size={20} />} />
                <StatsLedger 
                    label="Renewal Window" 
                    value={isExpired ? "0 Days" : `${daysRemaining} Days`} 
                    trend={isExpired ? "TERMINAL" : "Approaching"} 
                    icon={<Clock size={20} />} 
                    color={isExpired ? "text-rose-600" : (daysRemaining <= 3 ? "text-rose-500" : "text-amber-500")} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Expenditure Graph */}
                <div className="lg:col-span-8 bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Expenditure Trajectory</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Lattice Consumption Analysis</p>
                        </div>
                        <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-black text-indigo-600 outline-none">
                            <option>Last 6 Cycles</option>
                            <option>Last 12 Cycles</option>
                        </select>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={FISCAL_DATA}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorAmount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Plan Manifest */}
                <div className="lg:col-span-4 bg-indigo-700 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Current Authorization</h3>
                        <h2 className="text-3xl font-black tracking-tight mt-2">{PLANS[idx].name}</h2>
                        <p className="text-indigo-100 text-sm font-medium mt-4 leading-relaxed opacity-80">
                            {idx === 0 ? 'Basic orchestration nodes with fundamental support protocols.' : 
                             idx === 1 ? 'Enhanced lattice throughput with priority uplink and API access.' : 
                             'Full enterprise-grade orchestration with 24/7 forensics and advanced analytics.'}
                        </p>
                    </div>

                    <div className="relative z-10 pt-10 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div 
                                className="cursor-help hover:bg-white/5 p-1 rounded-lg transition-colors"
                                onClick={() => setShowDebug(!showDebug)}
                            >
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1">
                                    Sync Date {showDebug ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
                                </p>
                                <p className="text-sm font-black mt-1">{fmtDate(start)}</p>
                                
                                {showDebug && (
                                    <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <input 
                                            type="date" 
                                            className="bg-indigo-900/50 border border-indigo-400/30 rounded px-2 py-1 text-[10px] text-white outline-none focus:ring-1 ring-white/50 w-full"
                                            onChange={(e) => {
                                                const newDate = new Date(e.target.value);
                                                if (!isNaN(newDate.getTime())) {
                                                    setStart(newDate);
                                                    localStorage.setItem('planStartDate', newDate.toISOString());
                                                    setDays(Math.ceil(Math.abs(Date.now() - newDate.getTime()) / 86400000));
                                                    toast.info(`Debug: Start date updated to ${fmtDate(newDate)}`);
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Days Active</p>
                                <p className="text-sm font-black mt-1">{days} Days</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Cycle Progress</span>
                            <span className="text-white text-[10px] font-black tracking-widest">{Math.min(100, Math.round((days / limit) * 100))}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (days / limit) * 100)}%` }}></div>
                        </div>
                        <button 
                            onClick={() => setConfirm(plan !== 'demo')}
                            disabled={plan === 'demo'}
                            className="w-full mt-10 py-4 bg-white text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {plan === 'demo' ? 'Uplink to Paid Matrix' : 'Terminate Proxy Session'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Change Plan - Subscription Protocol */}
            <section className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Subscription Protocol</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Matrix Scaling Options</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((p, i) => {
                        const isCurrent = i === idx;
                        const isDemo = p.id === 'demo';
                        const hasUsedDemo = history.some(h => (h.planCode || '').toLowerCase().includes('demo'));
                        const isRestricted = isDemo && hasUsedDemo && !isCurrent;

                        return (
                            <div key={p.id} className={`rounded-[32px] border-2 p-8 transition-all relative overflow-hidden group ${
                                isCurrent ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 bg-white hover:border-slate-200'
                            } ${isRestricted ? 'opacity-75 grayscale-[0.5]' : ''}`}>
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
                                    {isCurrent ? 'Active Protocol' : isRestricted ? 'Protocol Used' : 'Sync Request'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-10 flex gap-4">
                    <button
                        onClick={() => idx > 0 && changePlan(PLANS[idx - 1].id)}
                        disabled={idx === 0 || loading}
                        className="flex-1 py-4 px-6 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all disabled:opacity-50"
                    >
                        <ChevronDown size={14} />
                        Downgrade Protocol
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
            <section className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
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
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Reference Number</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Account ID</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Allocation Type</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Allocation Period</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Fiscal Amount</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol State</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {history.length > 0 ? history.map((inv) => (
                                <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-10 py-6 font-mono text-xs font-black text-slate-400">#{inv._id.slice(-8).toUpperCase()}</td>
                                    <td className="px-6 py-6 font-bold text-xs text-indigo-600 truncate max-w-[150px]">
                                        {inv.selectedBy?.firstName 
                                            ? `${inv.selectedBy.firstName} ${inv.selectedBy.lastName || ''}` 
                                            : (inv.selectedBy?.email || 'System')}
                                    </td>
                                    <td className="px-6 py-6 font-bold text-sm text-slate-700">{inv.planName}</td>
                                    <td className="px-6 py-6 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="flex items-center gap-1.5"><Calendar size={10} className="text-indigo-400"/> {fmtDate(new Date(inv.currentPeriodStart || inv.trialStartDate || inv.startDate || inv.createdAt || Date.now()))}</span>
                                            { (inv.currentPeriodEnd || inv.trialEndDate || inv.endDate) && (
                                                <span className="flex items-center gap-1.5 opacity-60 ml-3 text-[9px]"><ArrowUpRight size={10}/> {fmtDate(new Date((inv.currentPeriodEnd || inv.trialEndDate || inv.endDate) || Date.now()))}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 font-black text-sm text-slate-800">{inv.price}D</td>
                                    <td className="px-10 py-6 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${inv.status === 'active' || inv.status === 'trial' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                            {inv.status === 'active' || inv.status === 'trial' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-10 py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
                                        No transaction records detected in current matrix
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        {/* Confirm modal */}
        {confirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Terminate Protocol?</h3>
              <p className="text-sm text-slate-500 font-bold leading-relaxed mb-8">
                By terminating your current subscription protocol, you will be moved back to the basic Demo plan. Matrix access will be limited.
              </p>
              <div className="flex gap-4">
                <button 
                    onClick={() => setConfirm(false)} 
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                    Retain Plan
                </button>
                <button 
                    onClick={() => executePlanChange('demo')} 
                    className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                >
                    Yes, Terminate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && pendingPlan && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[110] p-4">
            <div className="bg-white shadow-2xl rounded-[40px] w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-indigo-600 p-8 text-white relative">
                    <button onClick={() => setShowPaymentModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-all">
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/10 rounded-2xl"><CreditCard size={24}/></div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight">Payment Protocol</h3>
                            <p className="text-indigo-100/60 text-[10px] font-bold uppercase tracking-widest">Authorize {pendingPlan} Upgrade</p>
                        </div>
                    </div>
                </div>
                
                <div className="p-10 space-y-8">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        executePlanChange(pendingPlan!, {
                            cardNumber: fd.get('cardNumber') as string,
                            cardHolder: fd.get('cardHolder') as string,
                            expiryDate: fd.get('expiry') as string,
                            cvv: fd.get('cvv') as string,
                        });
                    }}>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Card Holder Identity</label>
                                <input name="cardHolder" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-indigo-500/20 transition-all" placeholder="JOHN DOE" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Card Matrix Number</label>
                                <div className="relative">
                                    <input name="cardNumber" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-indigo-500/20 transition-all" placeholder="XXXX XXXX XXXX XXXX" />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300"><CreditCard size={18} /></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Temporal Window (MM/YY)</label>
                                    <input name="expiry" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-indigo-500/20 transition-all" placeholder="01/27" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Node (CVV)</label>
                                    <div className="relative">
                                        <input name="cvv" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 ring-indigo-500/20 transition-all" placeholder="***" type="password" maxLength={3} />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300"><Lock size={16} /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-10 pt-10 border-t border-slate-50 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Fee</p>
                                <p className="text-2xl font-black text-slate-800 tracking-tight">{pendingPlan === 'starter' ? '79' : '299'}D <span className="text-xs text-slate-400 ml-1">/ Cycle</span></p>
                            </div>
                            <button type="submit" disabled={loading} className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3">
                                {loading ? <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"/> : <Zap size={16} />}
                                Authorize Uplink
                            </button>
                        </div>
                    </form>
                </div>
            </div>
          </div>
        )}
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
