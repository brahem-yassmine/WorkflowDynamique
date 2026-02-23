"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Settings,
  Shield,
  Smartphone,
  Globe,
  Mail,
  Server,
  Database,
  Layers,
  Zap,
  Plus,
  Save,
  Info,
  AlertTriangle,
  Lock,
  ChevronRight
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const initialPlans = [
  { id: 1, name: "Starter Lattice", price: 19, maxUsers: 10, maxWorkflows: 20, storage: "10GB", active: true },
  { id: 2, name: "Pro Cluster", price: 49, maxUsers: 50, maxWorkflows: 100, storage: "100GB", active: true },
  { id: 3, name: "Enterprise Node", price: 199, maxUsers: 1000, maxWorkflows: 5000, storage: "10TB", active: false },
];

export default function PlatformSettingsPage() {
  const [plans, setPlans] = useState(initialPlans);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [platformName, setPlatformName] = useState("Axia Solutions");
  const [supportEmail, setSupportEmail] = useState("nexus@axia.global");

  const handlePlanChange = (id: number, field: string, value: any) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addPlan = () => {
    setPlans([...plans, { id: Date.now(), name: "Unidentified Tier", price: 0, maxUsers: 1, maxWorkflows: 1, storage: "1GB", active: false }]);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            Platform Orchestration
            <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">Global Config</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Lattice-level system parameters and service tier structuring.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
          <Save size={18} />
          Commit All Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Navigation / Sections */}
        <div className="space-y-2">
          <SettingNav active icon={<Settings size={18} />} label="General Environment" />
          <SettingNav icon={<Layers size={18} />} label="Service Tiers" />
          <SettingNav icon={<Shield size={18} />} label="Security Protocols" />
          <SettingNav icon={<Globe size={18} />} label="Localization" />
          <SettingNav icon={<Smartphone size={18} />} label="Mobile Lattice" />

          <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100">
            <div className="flex items-center gap-2 mb-2 text-amber-700">
              <AlertTriangle size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">System Warning</span>
            </div>
            <p className="text-xs text-amber-900 font-medium leading-relaxed">
              Modifying platform-level parameters may destabilize active user clusters. Handle with cryptographic caution.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-10">
          {/* General Environment */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Server size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Core System Config</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Identity</label>
                <Input
                  className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:ring-4 focus:ring-indigo-50 font-bold"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Vector (Email)</label>
                <Input
                  className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:ring-4 focus:ring-indigo-50 font-bold"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">Lattice Maintenance Mode</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Suspend all non-master node access during system upgrades.</p>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>
          </section>

          {/* Plan Management */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Zap size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Service Tiers Matrix</h3>
              </div>
              <button
                onClick={addPlan}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {plans.map((p) => (
                <div key={p.id} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-100 transition-all">
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <Input
                      className="sm:w-1/3 h-10 bg-white border-slate-100 rounded-lg font-bold"
                      value={p.name}
                      onChange={(e) => handlePlanChange(p.id, "name", e.target.value)}
                    />
                    <div className="flex flex-1 items-center gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block">Price (€)</label>
                        <Input type="number" className="h-9 font-bold bg-white" value={p.price} onChange={(e) => handlePlanChange(p.id, "price", Number(e.target.value))} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block">Nodes</label>
                        <Input type="number" className="h-9 font-bold bg-white" value={p.maxUsers} onChange={(e) => handlePlanChange(p.id, "maxUsers", Number(e.target.value))} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block">Cloud</label>
                        <Input className="h-9 font-bold bg-white text-xs" value={p.storage} onChange={(e) => handlePlanChange(p.id, "storage", e.target.value)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pl-4">
                      <Badge className={p.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400'}>
                        {p.active ? 'Active' : 'Disabled'}
                      </Badge>
                      <Switch checked={p.active} onCheckedChange={(v) => handlePlanChange(p.id, "active", v)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Database & Infrastructure */}
          <section className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Database size={100} className="text-white" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <Lock size={20} />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight text-glow">Master Infrastructure</h3>
              </div>
              <div className="space-y-4">
                <InfrastructureLine label="Active Database Clusters" value="8 Main + 32 Shards" />
                <InfrastructureLine label="Global Lattice Sync" value="v4.2.0-STABLE" />
                <InfrastructureLine label="Backup Redundancy" value="Triple-Active Replication" />
              </div>
              <button className="mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                View High-Level Logs
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SettingNav({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`
      flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all group
      ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100'}
    `}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-bold tracking-tight">{label}</span>
      </div>
      <ChevronRight size={16} className={active ? 'text-indigo-200' : 'text-slate-300 group-hover:text-indigo-400'} />
    </div>
  );
}

function InfrastructureLine({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-bold text-indigo-300">{value}</span>
    </div>
  );
}
