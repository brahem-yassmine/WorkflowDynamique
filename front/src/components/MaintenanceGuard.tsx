"use client";

import { useEffect, useState } from "react";
import useUser from "@/hooks/useUser";
import { ServerCrash, ShieldAlert } from "lucide-react";
import Image from "next/image";

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [platformName, setPlatformName] = useState("Axia Solutions");
  const [supportEmail, setSupportEmail] = useState("nexus@axia.global");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/platform-settings/public");
        const data = await res.json();
        if (data.success && data.data) {
          setIsMaintenance(data.data.maintenanceMode);
          setPlatformName(data.data.platformName);
          setSupportEmail(data.data.supportEmail);
        }
      } catch (err) {
        console.warn("Maintenance check deferred: backend unreachable.");
      } finally {
        setChecking(false);
      }
    };
    
    checkMaintenance();
    
    // Poll every 30 seconds
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, []);

  if (checking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If maintenance is ON and user is NOT super_admin
  if (isMaintenance && user?.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Grid & Glow */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-lg w-full bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl text-center">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <ServerCrash size={40} className="animate-pulse" />
          </div>
          
          <h1 className="text-3xl font-black text-white tracking-tight mb-3">System Upgrade in Progress</h1>
          <p className="text-slate-300 mb-8 leading-relaxed">
            <span className="font-bold text-white">{platformName}</span> is currently undergoing scheduled maintenance to improve performance and stability. All non-master nodes are temporarily suspended.
          </p>

          <div className="bg-black/20 p-4 rounded-xl border border-white/5 mb-8">
            <p className="text-sm text-slate-400 font-medium">Expected Runtime: <span className="text-white font-bold">~15-30 minutes</span></p>
          </div>

          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
            Emergency Vector: <a href={`mailto:${supportEmail}`} className="text-indigo-400 hover:text-indigo-300 ml-1">{supportEmail}</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isMaintenance && user?.role === "super_admin" && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 flex items-center justify-center gap-2 shadow-md">
          <ShieldAlert size={14} />
          Lattice Maintenance Mode Active - Global Master Override Engaged
        </div>
      )}
      <div className={isMaintenance && user?.role === "super_admin" ? "mt-7" : ""}>
        {children}
      </div>
    </>
  );
}
