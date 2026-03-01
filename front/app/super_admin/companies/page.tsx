"use client";

import { useState, useEffect } from "react";
import {
  Card,
} from "@/components/ui/card";
import {
  Loader2,
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  MoreHorizontal,
  Mail,
  Calendar,
  Database,
  User,
  ShieldCheck,
  ShieldAlert,
  Building2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Company = {
  id: string;
  name: string;
  plan: string;
  users: number;
  registrationDate: string;
  adminName: string;
  email: string;
  status: string;
  databaseName: string;
};

export default function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/admin/tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to synchronize nodes');
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setCompanies(data.data.map((tenant: any) => ({
          id: tenant._id || '',
          name: tenant.name || 'Anonymous Entity',
          plan: tenant.selectedPlan?.name || tenant.planDetails?.name || 'Standard Tier',
          users: tenant.userCount || 0,
          registrationDate: tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
          adminName: tenant.adminName || tenant.email?.split('@')[0] || 'Admin',
          email: tenant.email || 'N/A',
          status: tenant.status || 'inactive',
          databaseName: tenant.databaseName || 'system_node'
        })));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Synchronization error");
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async () => {
    if (!selectedCompany) return;
    try {
      setUpdating(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5001/api/admin/tenants/${selectedCompany.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedCompany)
      });
      if (response.ok) {
        setCompanies(prev => prev.map(c => c.id === selectedCompany.id ? selectedCompany : c));
        setOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const toggleCompanyStatus = async (companyId: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      const response = await fetch(`http://localhost:5001/api/admin/tenants/${companyId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: newStatus } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            Organization Matrix
            <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">Active Nodes</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Lattice-level management of corporate identities and access tiers.</p>
        </div>
        <button
          onClick={fetchCompanies}
          className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold shadow-sm hover:shadow-md hover:bg-indigo-50 transition-all active:scale-95"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Re-Sync Nodes
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickStatCard label="Total Organizations" value={companies.length} icon={<Building2 size={20} />} color="bg-blue-50 text-blue-600" />
        <QuickStatCard label="Live Instances" value={companies.filter(c => c.status === 'active').length} icon={<ShieldCheck size={20} />} color="bg-emerald-50 text-emerald-600" />
        <QuickStatCard label="Suspended Clusters" value={companies.filter(c => c.status === 'suspended').length} icon={<ShieldAlert size={20} />} color="bg-rose-50 text-rose-600" />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md group text-slate-400">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by identity or connectivity endpoint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all font-medium text-slate-700"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
            <Filter size={20} />
          </button>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Lattice Depth: Global</span>
        </div>
      </div>

      {/* Organizations Matrix Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Organization Entity</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Tier</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nodes Active</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Initialization</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lattice Status</th>
                <th className="px-8 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{company.name}</p>
                        <p className="text-xs font-medium text-slate-400 italic">ID: {company.id.slice(-8).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="px-3 py-1 bg-white border border-indigo-100 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-tight">
                      {company.plan}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm font-black text-slate-600">{company.users}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs">
                      <Calendar size={14} className="text-slate-300" />
                      {company.registrationDate}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${company.status === 'active'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                        : 'bg-rose-50 text-rose-600 border-rose-100/50'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${company.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setSelectedCompany(company); setOpen(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <button
                        onClick={() => toggleCompanyStatus(company.id, company.status)}
                        className={`p-2 rounded-lg transition-all ${company.status === 'active'
                            ? 'text-rose-400 hover:bg-rose-50 hover:text-rose-600'
                            : 'text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                        title={company.status === 'active' ? 'Suspend Cluster' : 'Authorize Cluster'}
                      >
                        {company.status === 'active' ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCompanies.length === 0 && (
          <div className="p-20 text-center text-slate-400 font-bold italic tracking-tight">
            No registered organizations detected in this lattice sector.
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-indigo-700 p-8 text-white relative">
            <DialogTitle className="text-2xl font-black tracking-tight">Refine Entity Specifications</DialogTitle>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">Manual Node Override</p>
          </DialogHeader>

          {selectedCompany && (
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Entity Name</label>
                  <div className="relative flex items-center">
                    <Building2 className="absolute left-3 text-slate-300" size={16} />
                    <Input
                      className="pl-10 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700"
                      value={selectedCompany.name}
                      onChange={(e) => setSelectedCompany({ ...selectedCompany, name: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Status Protocol</label>
                  <Select
                    value={selectedCompany.status}
                    onValueChange={(value) => setSelectedCompany({ ...selectedCompany, status: value })}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active Lattice</SelectItem>
                      <SelectItem value="suspended">Suspended Cluster</SelectItem>
                      <SelectItem value="inactive">Deep Cold Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Connectivity Endpoint (Admin Email)</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 text-slate-300" size={16} />
                  <Input
                    className="pl-10 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700"
                    type="email"
                    value={selectedCompany.email}
                    onChange={(e) => setSelectedCompany({ ...selectedCompany, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Primary Persona Link</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 text-slate-300" size={16} />
                  <Input
                    className="pl-10 h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 font-bold text-slate-700"
                    value={selectedCompany.adminName}
                    onChange={(e) => setSelectedCompany({ ...selectedCompany, adminName: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase">System Key</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Database size={14} className="text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-900">{selectedCompany.databaseName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-indigo-400 uppercase">Creation Hash</p>
                  <p className="text-xs font-bold text-indigo-900 mt-1">{selectedCompany.id.toUpperCase()}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-8 pt-0 flex gap-4">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 py-3 text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              Discard Changes
            </button>
            <button
              onClick={updateCompany}
              disabled={updating}
              className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {updating ? <Loader2 size={18} className="animate-spin inline mr-2" /> : "Synchronize Node"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuickStatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
      <div className={`p-4 rounded-2xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
