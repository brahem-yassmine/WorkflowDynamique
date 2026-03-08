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

<<<<<<< HEAD

=======
>>>>>>> e6314a902f52656002db49b7c9c2223bf17d346f
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

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

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

    const [plan,    setPlan]    = useState<PlanType>('demo');
    const [days,    setDays]    = useState(0);
    const [start,   setStart]   = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirm, setConfirm] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    // New States for Payment and API
    const [dbPlans, setDbPlans] = useState<Plan[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingPlan, setPendingPlan] = useState<PlanType | null>(null);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
        cardNumber: "",
        cardHolder: "",
        expiryDate: "",
        cvv: ""
    });

    useEffect(() => {
        if (!loading && plan) {
            const isNowExpired = days >= (plan === 'demo' ? 7 : 15);
            
            if (isNowExpired) {
                // If expired, scroll to plans section
                setTimeout(() => {
                    const el = document.getElementById('plans-protocol');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            }

            // Sync with global state for AdminLayout to pick up
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
                    console.error("Failed to sync expiry state to localStorage", e);
                }
            }
        }
    }, [loading, plan, days]);

    useEffect(() => {
        const checkUpgrade = () => {
            if (upgradeRequest && PLANS.find(p => p.id === upgradeRequest) && !loading) {
                setPendingPlan(upgradeRequest);
                setShowPaymentModal(true);
            }
        };
        checkUpgrade();
    }, [upgradeRequest, loading]);

    useEffect(() => {
        const fetchContext = async () => {
            try {
                // 1. Fetch Plans
                const plansRes = await axios.get(`${API_URL}/plans`);
                if (plansRes.data.success) setDbPlans(plansRes.data.data);

                // 2. Fetch Current Subscription (if possible, fallback to localStorage)
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
                
                if (token) {
                    try {
                        const subRes = await axios.get(`${API_URL}/subscriptions/current`, {
                            headers: { 
                                Authorization: `Bearer ${token}`,
                                'x-tenant-id': tenantId
                            }
                        });
                        if (subRes.data.success && subRes.data.data.plan) {
                            const pName = subRes.data.data.plan.name.toLowerCase() as PlanType;
                            setPlan(pName);
                            // Set start date from sub if available
                            const cSub = subRes.data.data.subscription || subRes.data.data.tenantSubscription;
                            if (cSub) {
                                const rawDate = cSub.currentPeriodStart || cSub.trialStartDate || cSub.startDate;
                                if (rawDate) {
                                    const d = new Date(rawDate);
                                    setStart(d);
                                    setDays(Math.ceil(Math.abs(Date.now() - d.getTime()) / 86400000));
                                }
                            }
                        } else {
                            loadFromLocalStorage();
                        }
                    } catch (e) {
                        loadFromLocalStorage();
                    }
                } else {
                    loadFromLocalStorage();
                }

                // 3. Fetch Subscription History
                if (token) {
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
                    } catch (e) {
                        console.error("Error fetching history:", e);
                    }
                }
            } catch (err) {
                console.error("Error fetching billing context:", err);
                loadFromLocalStorage();
            } finally {
                setLoading(false);
            }
        };

        const loadFromLocalStorage = () => {
            const saved = localStorage.getItem('selectedPlan') as PlanType;
            const savedDate = localStorage.getItem('planStartDate');
            if (saved && PLANS.find(p => p.id === saved)) setPlan(saved);
            const date = savedDate ? new Date(savedDate) : new Date();
            if (!savedDate) localStorage.setItem('planStartDate', date.toISOString());
            setStart(date);
            setDays(Math.ceil(Math.abs(Date.now() - date.getTime()) / 86400000));
<<<<<<< HEAD

=======
>>>>>>> e6314a902f52656002db49b7c9c2223bf17d346f
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

    const changePlan = async (next: PlanType) => {
        // If it's a paid upgrade, show payment modal
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

        // Otherwise handle directly (e.g. downgrade to demo)
        await executePlanChange(next);
    };

    const executePlanChange = async (next: PlanType, pDetails?: PaymentDetails) => {
        setLoading(true);
        try {
            const targetPlan = dbPlans.find(p => p.code.toLowerCase() === next.toLowerCase());
            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenantId');

            if (targetPlan && token) {
                const response = await axios.post(`${API_URL}/subscriptions/change`, {
                    planId: targetPlan._id,
                    billingCycle: 'monthly',
                    paymentInfo: pDetails
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    setPlan(next);
                    const now = new Date();
                    setStart(now);
                    setDays(0);
                    localStorage.setItem('selectedPlan', next);
                    localStorage.setItem('planStartDate', now.toISOString());

                    // Immediate sync to un-blur sidebar
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

                    // 4. Refresh History immediately
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
                    } catch (e) {
                        console.error("Error refreshing history:", e);
                    }
                }
            } else {
                // Fallback for demo/no-backend
                await new Promise(r => setTimeout(r, 700));
                localStorage.setItem('selectedPlan', next);
                localStorage.setItem('planStartDate', new Date().toISOString());
                setPlan(next);
                setStart(new Date());
                setDays(0);
                setShowPaymentModal(false);
                setConfirm(false);
            }
        } catch (err) {
            console.error("Plan change failed:", err);
            alert("Failed to change plan. Please try again.");
        } finally {
            setLoading(false);
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
            {/* Ending Soon Warning */}
            {((plan === 'demo' ? 7 : 15) - days) <= 3 && ((plan === 'demo' ? 7 : 15) - days) > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex items-center justify-between shadow-sm animate-pulse-subtle">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-800 tracking-tight">Subscription Ending Soon</h4>
                            <p className="text-sm text-slate-500 font-bold">Your {plan} authorization will expire in {Math.max(0, (plan === 'demo' ? 7 : 15) - days)} days. Please renew to maintain lattice access.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => router.push('/admin/billing?upgrade=pro')}
                        className="px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all active:scale-95 shadow-lg shadow-amber-100"
                    >
                        Renew Protocol
                    </button>
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

            {/* ACTUAL EXPIRATION BANNER */}
            {days >= (plan === 'demo' ? 7 : 15) && (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-[2rem] p-8 flex items-center justify-between shadow-xl shadow-rose-100/50 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                            <Lock size={32} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">Subscription Expired</h4>
                            <p className="text-slate-600 font-bold mt-1">
                                Your {plan} period has ended. Please <span className="text-rose-600 underline decoration-rose-200 underline-offset-4">{plan === 'demo' ? 'Upgrade' : 'Renew'}</span> your authorization to restore lattice uplink and full system functionality.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            const el = document.getElementById('plans-protocol');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-700 transition-all active:scale-95 shadow-xl shadow-rose-200 flex items-center gap-3 transform hover:-translate-y-1"
                    >
                        <Zap size={16} fill="white" />
                        {plan === 'demo' ? 'Upgrade Plan Now' : 'Renew Access Now'}
                    </button>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsLedger label="Current Cycle" value="$7,200.00" trend="+14.2%" icon={<DollarSign size={20} />} />
                <StatsLedger label="Node Licenses" value="24 Active" trend="Nominal" icon={<Activity size={20} />} />
                <StatsLedger label="Resource Load" value="82.4 GB" trend="+5.1GB" icon={<Zap size={20} />} />
                <StatsLedger 
                    label="Renewal Window" 
                    value={`${Math.max(0, (plan === 'demo' ? 7 : 15) - days)} Days`} 
                    trend={((plan === 'demo' ? 7 : 15) - days) <= 3 ? "Urgent" : "Approaching"} 
                    icon={<Clock size={15} />} 
                    color={((plan === 'demo' ? 7 : 15) - days) <= 3 ? "text-rose-500" : "text-amber-500"} 
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
                            <span className="text-white text-[10px] font-black tracking-widest">{Math.min(100, Math.round((days / (plan === 'demo' ? 7 : 15)) * 100))}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (days / (plan === 'demo' ? 7 : 15)) * 100)}%` }}></div>
                            <span className="text-white text-[10px] font-black tracking-widest">{Math.min(100, Math.round((days / limit) * 100))}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (days / limit) * 100)}%` }}></div>
                        </div>
                        <button 
                            onClick={() => setConfirm(plan !== 'demo')}
                            disabled={true}
                            className="w-full mt-10 py-4 bg-white/10 text-white/40 rounded-2xl font-black text-xs uppercase tracking-widest cursor-not-allowed border border-white/10"
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
                                    disabled={isCurrent || loading || (p.id === 'demo' && plan !== 'demo')}
                                    className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
                                        isCurrent 
                                        ? 'bg-slate-100 text-slate-400 cursor-default' 
                                        : (p.id === 'demo' && plan !== 'demo')
                                          ? 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
                                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                                    }`}
                                >
                                    {isCurrent ? 'Active Protocol' : (p.id === 'demo' && plan !== 'demo') ? 'Restricted' : 'Sync Request'}
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
                        disabled={idx === 0 || loading || (idx === 1 && plan !== 'demo')}
                        className="flex-1 py-4 px-6 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all disabled:opacity-50"
                    >
                        <ChevronDown size={14} />
                        {idx === 1 ? 'Downgrade Restricted' : 'Downgrade Protocol'}
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
                                    <td className="px-6 py-6 font-bold text-xs text-indigo-600 truncate max-w-[150px]">{inv.selectedBy?.email || 'System'}</td>
                                    <td className="px-6 py-6 font-bold text-sm text-slate-700">{inv.planName}</td>
                                    <td className="px-6 py-6 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="flex items-center gap-1.5"><Calendar size={10} className="text-indigo-400"/> {fmtDate(new Date(inv.currentPeriodStart || inv.trialStartDate || inv.startDate || inv.createdAt))}</span>
                                            { (inv.currentPeriodEnd || inv.trialEndDate || inv.endDate) && (
                                                <span className="flex items-center gap-1.5 opacity-60 ml-3 text-[9px]"><ArrowUpRight size={10}/> {fmtDate(new Date(inv.currentPeriodEnd || inv.trialEndDate || inv.endDate))}</span>
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
                                            {inv.status === 'active' || inv.status === 'trial' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                            {inv.status === 'active' || inv.status === 'trial' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-10 py-20 text-center text-slate-400 font-bold italic">
                                        No transaction records found in the current lattice cycle.
                                    <td colSpan={6} className="px-10 py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
                                        No transaction records detected in current matrix
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {/* Payment Modal */}
            {showPaymentModal && pendingPlan && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Security Protocol</h2>
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-8 p-6 bg-indigo-50 rounded-[24px] border border-indigo-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Target Plan</p>
                                    <p className="text-lg font-black text-slate-800 tracking-tight">{PLANS.find(p => p.id === pendingPlan)?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Fiscal Unit</p>
                                    <p className="text-lg font-black text-indigo-600 tracking-tight">{PLANS.find(p => p.id === pendingPlan)?.price}</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); executePlanChange(pendingPlan, paymentDetails); }} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Card Identification</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="cardNumber"
                                        value={paymentDetails.cardNumber}
                                        onChange={handlePaymentChange}
                                        placeholder="0000 0000 0000 0000"
                                        className="w-full px-6 py-4 pl-14 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                                        maxLength={19}
                                        required
                                    />
                                    <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={20} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Authorized Holder</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="cardHolder"
                                        value={paymentDetails.cardHolder}
                                        onChange={handlePaymentChange}
                                        placeholder="Full Name"
                                        className="w-full px-6 py-4 pl-14 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                                        required
                                    />
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={20} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Expiry</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="expiryDate"
                                            value={paymentDetails.expiryDate}
                                            onChange={handlePaymentChange}
                                            placeholder="MM/YY"
                                            className="w-full px-6 py-4 pl-14 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                                            maxLength={5}
                                            required
                                        />
                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={20} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">CVV</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="cvv"
                                            value={paymentDetails.cvv}
                                            onChange={handlePaymentChange}
                                            placeholder="***"
                                            className="w-full px-6 py-4 pl-14 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                                            maxLength={4}
                                            required
                                        />
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={20} />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
                                <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-emerald-600 leading-relaxed italic">
                                    Simulated encryption active. No actual transaction will occur. Any data entered will be confirmed into the database metadata.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                                >
                                    {loading ? 'Syncing...' : 'Confirm Uplink'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
