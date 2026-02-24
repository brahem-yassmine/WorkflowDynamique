'use client'

import React from 'react';
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
    ShieldCheck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
    return (
        <div className="space-y-10 animate-in fade-in duration-500">


            {/* Top Ledger Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsLedger label="Current Cycle" value="$7,200.00" trend="+14.2%" icon={<DollarSign size={20} />} />
                <StatsLedger label="Node Licenses" value="24 Active" trend="Nominal" icon={<Activity size={20} />} />
                <StatsLedger label="Resource Load" value="82.4 GB" trend="+5.1GB" icon={<Zap size={20} />} />
                <StatsLedger label="Renewal Window" value="12 Days" trend="Approaching" icon={<Clock size={20} />} color="text-amber-500" />
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
                        <h2 className="text-3xl font-black tracking-tight mt-2">Enterprise Lattice</h2>
                        <p className="text-indigo-100 text-sm font-medium mt-4 leading-relaxed opacity-80">
                            Full access to complex orchestration nodes, unlimited talent management, and advanced security forensics.
                        </p>
                    </div>

                    <div className="relative z-10 pt-10 border-t border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-indigo-200 text-xs font-bold">Node Usage</span>
                            <span className="text-white text-xs font-black tracking-widest">78 / 100</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-white w-[78%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                        </div>
                        <button className="w-full mt-10 py-4 bg-white text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shadow-xl">
                            Upgrade Matrix Capacity
                        </button>
                    </div>
                </div>
            </div>

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
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Allocation Type</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Sync Date</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Fiscal Amount</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol State</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {INVOICES.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-10 py-6 font-mono text-xs font-black text-slate-400">#{inv.id}</td>
                                    <td className="px-6 py-6 font-bold text-sm text-slate-700">{inv.type}</td>
                                    <td className="px-6 py-6 text-sm font-medium text-slate-500">{inv.date}</td>
                                    <td className="px-6 py-6 font-black text-sm text-slate-800">{inv.amount}</td>
                                    <td className="px-10 py-6 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                            {inv.status === 'Paid' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
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
