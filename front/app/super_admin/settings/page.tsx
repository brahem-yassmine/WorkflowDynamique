"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
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
  const [plans, setPlans] = useState<any[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [platformName, setPlatformName] = useState("Axia Solutions");
  const [supportEmail, setSupportEmail] = useState("nexus@axia.global");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { 
    fetchData();
    
    // Load local settings if any
    const savedName = localStorage.getItem('platformName');
    const savedEmail = localStorage.getItem('supportEmail');
    const savedMaintenance = localStorage.getItem('maintenanceMode');
    if (savedName) setPlatformName(savedName);
    if (savedEmail) setSupportEmail(savedEmail);
    if (savedMaintenance) setMaintenanceMode(savedMaintenance === 'true');
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const [plansRes, statsRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/plans', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const plansData = await plansRes.json();
      const statsData = await statsRes.json();

      if (plansData.success) setPlans(plansData.data);
      if (statsData.success) setStats(statsData.data);
      
    } catch (err) {
      console.error("Failed to fetch platform data:", err);
      toast.error("Failed to load platform configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (id: string, field: string, value: any) => {
    setPlans(prev => prev.map(p => p._id === id || p.localId === id ? { ...p, [field]: value, isDirty: true } : p));
  };

  const addPlan = () => {
    const newPlan = { 
      localId: `temp-${Date.now()}`, 
      name: "New Tier", 
      price: 0, 
      features: { maxUsers: 10, maxWorkflows: 5 }, 
      interval: "month",
      isActive: false,
      isDirty: true,
      isNew: true
    };
    setPlans([...plans, newPlan]);
  };

  const commitChanges = async () => {
    const toastId = toast.loading("Committing changes to master database...");
    let successCount = 0;
    let errorCount = 0;

    try {
      const token = localStorage.getItem('auth_token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Save local settings
      localStorage.setItem('platformName', platformName);
      localStorage.setItem('supportEmail', supportEmail);
      localStorage.setItem('maintenanceMode', maintenanceMode.toString());

      // Save Plans
      const dirtyPlans = plans.filter(p => p.isDirty);
      
      for (const plan of dirtyPlans) {
        try {
          // Map frontend structure to backend structure
          const payload = {
            name: plan.name,
            price: plan.price,
            interval: plan.interval || 'month',
            currency: plan.currency || 'tnd',
            isActive: plan.isActive !== undefined ? plan.isActive : plan.active,
            features: {
              maxUsers: plan.features?.maxUsers || plan.maxUsers || 1,
              maxWorkflows: plan.features?.maxWorkflows || plan.maxWorkflows || 1,
            }
          };

          if (plan.isNew) {
            await fetch('http://localhost:5000/api/admin/plans', {
              method: 'POST',
              headers,
              body: JSON.stringify(payload)
            });
          } else {
            await fetch(`http://localhost:5000/api/admin/plans/${plan._id}`, {
              method: 'PUT',
              headers,
              body: JSON.stringify(payload)
            });
          }
          successCount++;
        } catch (err) {
          console.error(`Error saving plan ${plan.name}:`, err);
          errorCount++;
        }
      }

      if (errorCount > 0) {
        toast.error(`Changes saved partially. ${errorCount} plan(s) failed.`, { id: toastId });
      } else {
        toast.success("Global configuration updated successfully.", { id: toastId });
      }
      
      // Refresh to get real IDs for new plans
      if (dirtyPlans.length > 0) {
        await fetchData();
      }
    } catch (err) {
      toast.error("Critical error while committing changes.", { id: toastId });
    }
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
        <button 
          onClick={commitChanges}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
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
              {loading ? (
                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
              ) : (
                plans.map((p) => {
                  const id = p._id || p.localId;
                  const isActive = p.isActive !== undefined ? p.isActive : p.active;
                  const maxU = p.features?.maxUsers || p.maxUsers || 1;
                  const maxW = p.features?.maxWorkflows || p.maxWorkflows || 1;
                  
                  return (
                    <div key={id} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-100 transition-all">
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Input
                          className="sm:w-1/3 h-10 bg-white border-slate-100 rounded-lg font-bold"
                          value={p.name}
                          onChange={(e) => handlePlanChange(id, "name", e.target.value)}
                        />
                        <div className="flex flex-1 items-center gap-2">
                          <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block">Price (DT)</label>
                            <Input type="number" className="h-9 font-bold bg-white" value={p.price} onChange={(e) => handlePlanChange(id, "price", Number(e.target.value))} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block">Users</label>
                            <Input type="number" className="h-9 font-bold bg-white" value={maxU} onChange={(e) => handlePlanChange(id, "features", { ...p.features, maxUsers: Number(e.target.value) })} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block">Workflows</label>
                            <Input type="number" className="h-9 font-bold bg-white text-xs" value={maxW} onChange={(e) => handlePlanChange(id, "features", { ...p.features, maxWorkflows: Number(e.target.value) })} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pl-4">
                          <Badge className={isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400'}>
                            {isActive ? 'Active' : 'Disabled'}
                          </Badge>
                          <Switch checked={isActive} onCheckedChange={(v) => handlePlanChange(id, "isActive", v)} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
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
                <InfrastructureLine 
                  label="Active Database Clusters" 
                  value={stats ? `${stats.activeCompanies || stats.totalCompanies} Live Tenant DBs` : `Loading...`} 
                />
                <InfrastructureLine 
                  label="System Load Proxy" 
                  value={stats ? `${stats.averageGpuUsage}%` : `---`} 
                />
                <InfrastructureLine 
                  label="Global Lattice Sync" 
                  value="v4.2.0-STABLE (Optimal)" 
                />
              </div>
              <a href="/super_admin/log" className="inline-block mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer">
                View High-Level Logs
              </a>
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
