"use client";

import { useState, useEffect, useRef } from "react";
import useUser from '@/hooks/useUser';
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Shield,
  ShieldCheck,
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
  ChevronRight,
  Trash2,
  X,
  UserCircle,
  Camera
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const initialPlans = [
  { id: 1, name: "Starter Lattice", price: 19, maxWorkflows: 20, storage: "10GB", active: true },
  { id: 2, name: "Pro Cluster", price: 49, maxWorkflows: 999999, storage: "100GB", active: true },
  { id: 3, name: "Enterprise Node", price: 199, maxWorkflows: 5000, storage: "10TB", active: false },
];

export default function PlatformSettingsPage() {
  const { user } = useUser();
  const [plans, setPlans] = useState<any[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [platformName, setPlatformName] = useState("Axia Solutions");
  const [supportEmail, setSupportEmail] = useState("nexus@axia.global");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const [savingSettings, setSavingSettings] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  const [showLocModal, setShowLocModal] = useState(false);
  const [locForm, setLocForm] = useState({
    locale: 'English (US) - Default',
    timezone: 'UTC (Coordinated Universal Time)',
    location: 'Global / Distributed'
  });

  useEffect(() => { 
    fetchData();
    const savedImg = localStorage.getItem('superAdminProfileImage');
    if (savedImg) setProfileImage(savedImg);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const [plansRes, statsRes, logsStatsRes, settingsRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/plans', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/admin/logs/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/platform-settings/public')
      ]);

      const plansData = await plansRes.json();
      const statsData = await statsRes.json();
      const logsStatsData = await logsStatsRes.json();
      const settingsData = await settingsRes.json();

      if (plansData.success) setPlans(plansData.data);
      if (statsData.success) {
        setStats({ 
          ...statsData.data, 
          logs: logsStatsData.success ? logsStatsData.data : null 
        });
      }
      if (settingsData.success && settingsData.data) {
        setPlatformName(settingsData.data.platformName);
        setSupportEmail(settingsData.data.supportEmail);
        setMaintenanceMode(settingsData.data.maintenanceMode);
      }
      
    } catch (err) {
      console.error("Failed to fetch platform data:", err);
      toast.error("Failed to load platform configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlatformSettings = async () => {
    try {
      setSavingSettings(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/platform-settings/admin', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          platformName,
          supportEmail,
          maintenanceMode
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Platform settings updated successfully!");
      } else {
        toast.error(data.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("A network error occurred.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePlanChange = (id: string, field: string, value: any) => {
    setPlans(prev => prev.map(p => p._id === id || p.localId === id ? { ...p, [field]: value, isDirty: true } : p));
  };

  const addPlan = () => {
    const newPlan = { 
      localId: `temp-${Date.now()}`, 
      name: "New Tier", 
      code: "NEW_TIER",
      price: 0, 
      features: { maxWorkflows: 30 }, 
      interval: "month",
      isActive: false,
      expiryDate: null,
      isDirty: true,
      isNew: true
    };
    setPlans([...plans, newPlan]);
  };

  const deletePlan = async (id: string, isNew: boolean) => {
    if (isNew) {
      setPlans(plans.filter(p => p.localId !== id));
      return;
    }
    
    if (window.confirm("Are you sure you want to permanently delete this service tier?")) {
      const toastId = toast.loading("Deleting plan...");
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`http://localhost:5000/api/admin/plans/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setPlans(plans.filter(p => p._id !== id));
          toast.success("Plan deleted successfully.", { id: toastId });
        } else {
          toast.error("Failed to delete plan", { id: toastId });
        }
      } catch (err) {
        toast.error("Network error during deletion", { id: toastId });
      }
    }
  };

  const commitChanges = async () => {
    setIsCommitting(true);
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
      if (profileImage) {
        localStorage.setItem('superAdminProfileImage', profileImage);
      } else {
        localStorage.removeItem('superAdminProfileImage');
      }

      // Save Plans
      const dirtyPlans = plans.filter(p => p.isDirty);
      
      for (const plan of dirtyPlans) {
        try {
          // Map frontend structure to backend structure
          const payload = {
            name: plan.name,
            code: plan.code || plan.name.toUpperCase().replace(/\s+/g, '_'),
            price: plan.price,
            interval: plan.interval || 'month',
            currency: plan.currency || 'D',
            isActive: plan.isActive !== undefined ? plan.isActive : plan.active,
            expiryDate: plan.expiryDate,
            features: {
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
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            Platform Settings 
            <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">Global Config</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Lattice-level system parameters and service tier structuring.</p>
        </div>
        <button 
          onClick={commitChanges}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Navigation / Sections */}
        <div className="space-y-6">
          <div className="space-y-2">
          <SettingNav 
            active={activeSection === 'profile'} 
            icon={<UserCircle size={18} />} 
            label="Super Admin Profile" 
            onClick={() => {
              setActiveSection('profile');
              document.getElementById("profile-settings")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <SettingNav 
            active={activeSection === 'general'} 
            icon={<Settings size={18} />} 
            label="General Environment" 
            onClick={() => {
              setActiveSection('general');
              document.getElementById("general")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <SettingNav 
            active={activeSection === 'service-tiers'} 
            icon={<Layers size={18} />} 
            label="Service Tiers" 
            onClick={() => {
              setActiveSection('service-tiers');
              document.getElementById("service-tiers")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <SettingNav 
            active={activeSection === 'security'} 
            icon={<Shield size={18} />} 
            label="Security Protocols" 
            onClick={() => {
              setActiveSection('security');
              document.getElementById("security-protocols")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <SettingNav 
            active={activeSection === 'localization'} 
            icon={<Globe size={18} />} 
            label="Localization" 
            onClick={() => {
              setActiveSection('localization');
              const savedLocale = localStorage.getItem('systemLocale') || 'English (US) - Default';
              const savedTimezone = localStorage.getItem('primaryTimezone') || 'UTC (Coordinated Universal Time)';
              const savedLocation = localStorage.getItem('localRegion') || 'Global / Distributed';
              
              setLocForm({
                locale: savedLocale,
                timezone: savedTimezone,
                location: savedLocation
              });
              setShowLocModal(true);
            }}
          />

          </div>

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
          {/* Profile Settings */}
          <section id="profile-settings" className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 scroll-mt-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <UserCircle size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Super Admin Profile</h3>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-4xl shadow-inner border-4 border-white ring-4 ring-indigo-50 overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.firstName?.[0] || user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'S'
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg border-2 border-white hover:bg-indigo-700 transition-transform active:scale-95 flex items-center justify-center"
                  title="Upload Photo"
                >
                  <Camera size={14} />
                </button>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div className="space-y-5 flex-1 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Full Name</label>
                    <Input 
                      className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold"
                      value={user?.firstName || user?.name || user?.email?.split('@')[0] || 'Super Admin'}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Email Address</label>
                    <Input 
                      className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold text-slate-500"
                      value={user?.email || 'admin@lattice.local'}
                      readOnly
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">System Role</label>
                    <div className="flex items-center gap-2 h-12">
                      <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 uppercase tracking-widest font-black py-2 px-4 shadow-sm">
                        {user?.role === 'super_admin' ? 'System Operator' : user?.role || 'Administrator'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-transparent select-none uppercase tracking-widest block">Action</label>
                    <button 
                      onClick={() => window.location.href = '/forget?from=super_admin'}
                      className="h-12 w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl font-bold transition-all active:scale-95 shadow-sm"
                    >
                      <Lock size={16} />
                      Forget Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* General Environment */}
          <section id="general" className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 scroll-mt-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Server size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Core System Config</h3>
              <div className="ml-auto">
                <button 
                  onClick={handleSavePlatformSettings}
                  disabled={savingSettings}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 active:scale-95"
                >
                  <Save size={16} />
                  {savingSettings ? "Saving..." : "Save Config"}
                </button>
              </div>
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
          <section id="service-tiers" className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
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
                  const isExpired = p.expiryDate && new Date(p.expiryDate) < new Date();
                  const maxU = p.features?.maxUsers || p.maxUsers || 1;
                  const maxW = p.features?.maxWorkflows || p.maxWorkflows || 1;
                  
                  return (
                    <div key={id} className={`p-6 bg-slate-50 border rounded-2xl group hover:border-indigo-100 transition-all ${isExpired ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}>
                      <div className="flex flex-col gap-6">
                        {/* Top Row: Name and Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex-1 w-full space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Plan Identity & Signature</label>
                            <div className="flex gap-3">
                              <Input
                                className="flex-1 h-12 bg-white border-slate-200 rounded-xl font-black text-slate-800"
                                value={p.name}
                                placeholder="Name"
                                onChange={(e) => {
                                  const newName = e.target.value;
                                  const newCode = newName.toUpperCase().replace(/\s+/g, '_');
                                  setPlans(prev => prev.map(pl => (pl._id === id || pl.localId === id) ? { ...pl, name: newName, code: p.isNew ? newCode : pl.code, isDirty: true } : pl));
                                }}
                              />
                              <Input
                                className="w-1/3 h-12 text-[10px] bg-slate-100 border-none rounded-xl font-mono font-black text-slate-500 uppercase flex items-center justify-center text-center"
                                value={p.code}
                                placeholder="CODE"
                                onChange={(e) => handlePlanChange(id, "code", e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 self-end sm:self-center">
                            {isExpired ? (
                              <Badge className="bg-rose-100 text-rose-600 border-rose-200 uppercase tracking-widest font-black">
                                Expiré
                              </Badge>
                            ) : (
                              <Badge className={isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400'}>
                                {isActive ? 'Live' : 'Hidden'}
                              </Badge>
                            )}
                            <Switch checked={isActive} onCheckedChange={(v) => handlePlanChange(id, "isActive", v)} />
                            <div className="w-[1px] h-4 bg-slate-100 mx-1" />
                            <button 
                              onClick={() => deletePlan(id, !!p.isNew)}
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                              title="Delete Plan"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Row: Numerical Metrics (Maximized Width) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100 border-dashed">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Service Price (DT)</label>
                            <Input 
                              type="number" 
                              className="h-20 text-2xl font-black bg-white border-slate-200 rounded-2xl text-center focus:ring-2 focus:ring-indigo-600 transition-all shadow-sm" 
                              value={p.price} 
                              onChange={(e) => handlePlanChange(id, "price", Number(e.target.value))} 
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Workflow Threads</label>
                            <Input 
                              type="number" 
                              className="h-20 text-2xl font-black bg-white border-slate-200 rounded-2xl text-center focus:ring-2 focus:ring-indigo-600 transition-all shadow-sm" 
                              value={maxW} 
                              onChange={(e) => handlePlanChange(id, "features", { ...p.features, maxWorkflows: Number(e.target.value) })} 
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Expiry Date</label>
                            <div className="relative">
                              <Input 
                                type="date" 
                                className="h-20 text-sm font-bold bg-white border-slate-200 rounded-2xl text-center focus:ring-2 focus:ring-indigo-600 transition-all shadow-sm" 
                                value={p.expiryDate ? new Date(p.expiryDate).toISOString().split('T')[0] : ''} 
                                onChange={(e) => handlePlanChange(id, "expiryDate", e.target.value)} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Save Button for Plans */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button 
                onClick={commitChanges}
                disabled={isCommitting || !plans.some(p => p.isDirty || p.isDeleted)}
                className={`px-8 py-4 rounded-2xl shadow-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 active:scale-95 ${
                  plans.some(p => p.isDirty || p.isDeleted) 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isCommitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Save & Declare in Signup
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Database & Infrastructure */}
          <section id="security-protocols" className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Database size={100} className="text-white" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <Lock size={20} />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight text-glow">Master Infrastructure & Security</h3>
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
                <div className="pt-4 mt-4 border-t border-white/5 space-y-4">
                  <InfrastructureLine 
                    label="End-to-End Encryption (E2EE)" 
                    value="ACTIVE - AES-256 GCM" 
                  />
                  <InfrastructureLine 
                    label="Strict Transport Security (HSTS)" 
                    value="ENFORCED" 
                  />
                  <InfrastructureLine 
                    label="Data Residency Protocol" 
                    value="EU-WEST ISOLATION" 
                  />
                </div>
              </div>
              <a href="/super_admin/Log" className="inline-block mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer">
                View High-Level Logs
              </a>
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {showLocModal && (
          <motion.div 
            key="localization-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowLocModal(false);
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white rounded-[1.5rem] shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden relative"
            >
              <button 
                onClick={() => setShowLocModal(false)}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-40"
              >
                <X size={20} />
              </button>
              <div className="p-10 border-b border-slate-50 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50">
                <div className="flex gap-6 items-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 flex flex-col items-center justify-center shadow-xl shadow-indigo-200 text-white">
                    <Globe size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Localization Settings</h3>
                    <p className="text-sm font-medium text-slate-500 mt-2">Configure platform-wide locales and geographic parameters.</p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">System Locale</label>
                  <select 
                    value={locForm.locale}
                    onChange={(e) => setLocForm({...locForm, locale: e.target.value})}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 outline-none hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer"
                  >
                    <option value="English (US) - Default">English (US) - Default</option>
                    <option value="English (UK)">English (UK)</option>
                    <option value="French (FR)">French (FR)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Primary Timezone</label>
                  <select 
                    value={locForm.timezone}
                    onChange={(e) => setLocForm({...locForm, timezone: e.target.value})}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 outline-none hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer"
                  >
                    <option value="UTC (Coordinated Universal Time)">UTC (Coordinated Universal Time)</option>
                    <option value="EST (Eastern Standard Time)">EST (Eastern Standard Time)</option>
                    <option value="CET (Central European Time)">CET (Central European Time)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Primary Location (Place)</label>
                  <select 
                    value={locForm.location}
                    onChange={(e) => setLocForm({...locForm, location: e.target.value})}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 outline-none hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer"
                  >
                    <option value="Global / Distributed">Global / Distributed</option>
                    <option value="North America">North America</option>
                    <option value="Europe">Europe</option>
                    <option value="Asia Pacific">Asia Pacific</option>
                  </select>
                </div>
              </div>

              <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-3 sticky bottom-0">
                <button 
                  onClick={() => setShowLocModal(false)}
                  className="px-8 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    localStorage.setItem('systemLocale', locForm.locale);
                    localStorage.setItem('primaryTimezone', locForm.timezone);
                    localStorage.setItem('localRegion', locForm.location);
                    toast.success("Localization preferences updated.");
                    setShowLocModal(false);
                  }}
                  className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100 transition-all"
                >
                  Save Preferences
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingNav({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`
      flex items-center justify-between p-4 rounded-2xl transition-all group ${onClick ? 'cursor-pointer' : ''}
      ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100 cursor-pointer'}
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
