'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { 
  getQuickActions, 
  executeQuickAction 
} from '@/service/quick-action.service';
import { apiService } from '@/service/api.service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface QuickAction {
  _id: string;
  name: string;
  key: string;
  icon: string;
  description: string;
  formSchema: any[];
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    _id: "default_purchase",
    name: "Purchase Request",
    key: "purchase_request",
    icon: "ShoppingCart",
    description: "Initialize a formal procurement protocol. System will automatically route tasks to selected manager and finance validator.",
    formSchema: [
      { id: "productName", type: "text", label: "Product Name", placeholder: "Ex: MacBook Pro M3", required: true },
      { id: "quantity", type: "number", label: "Quantity", placeholder: "1", required: true },
      { id: "estimatedBudget", type: "number", label: "Estimated Budget ($)", placeholder: "2500", required: true },
      { id: "supplierName", type: "text", label: "Supplier Name", placeholder: "Apple Inc." },
      { id: "managerApprover", type: "user", label: "Manager Approver", placeholder: "Select your direct manager", required: true },
      { id: "financeValidator", type: "user", label: "Finance Validator", placeholder: "Select finance officer", required: true },
      { id: "priority", type: "select", label: "Priority", options: ["High", "Medium", "Low"], required: true },
      { id: "deadline", type: "date", label: "Required Deadline", required: true }
    ]
  },
  {
    _id: "default_document",
    name: "Document Creation",
    key: "document_creation",
    icon: "FilePlus",
    description: "Launch a document lifecycle. Includes peer review, quality validation, and centralized archiving in the background.",
    formSchema: [
      { id: "documentName", type: "text", label: "Document Name", placeholder: "Ex: Q2 Marketing Plan", required: true },
      { id: "documentType", type: "select", label: "Document Type", options: ["Contract", "Invoice", "Report", "Policy"], required: true },
      { id: "description", type: "textarea", label: "Document Description", placeholder: "Briefly explain the intent...", required: true },
      { id: "reviewer", type: "user", label: "Document Reviewer", placeholder: "Assign a peer reviewer", required: true },
      { id: "validator", type: "user", label: "Final Validator", placeholder: "Select final authority", required: true },
      { id: "uploadFile", type: "file", label: "Attach Document Draft", required: true }
    ]
  },
  {
    _id: "default_payment",
    name: "Payment Request",
    key: "payment_request",
    icon: "CreditCard",
    description: "Trigger an intelligent payment flow. Finance will receive immediate validation tasks for bank execution.",
    formSchema: [
      { id: "amount", type: "number", label: "Transaction Amount ($)", placeholder: "500", required: true },
      { id: "paymentType", type: "select", label: "Payment Type", options: ["Cash", "Bank Transfer", "Check"], required: true },
      { id: "reason", type: "textarea", label: "Business Reason", placeholder: "Detailed justification for payment", required: true },
      { id: "financeApprover", type: "user", label: "Finance Approver", placeholder: "Select authorizing officer", required: true },
      { id: "invoiceFile", type: "file", label: "Invoice Attachment", required: true }
    ]
  },
  {
    _id: "default_transport",
    name: "Transport Request",
    key: "transport_request",
    icon: "Truck",
    description: "Logistics orchestration. System coordinates between logistics manager and driver for cargo execution.",
    formSchema: [
      { id: "destination", type: "text", label: "Destination Point", placeholder: "Ex: Warehouse 7, Block B", required: true },
      { id: "transportDate", type: "date", label: "Execution Date", required: true },
      { id: "cargoType", type: "text", label: "Cargo Specifications", placeholder: "Ex: 2 Tons, Fragile Electronics", required: true },
      { id: "logisticsManager", type: "user", label: "Logistics Coordinator", placeholder: "Route to logistics team", required: true },
      { id: "driver", type: "user", label: "Assigned Driver", placeholder: "Select transport personnel", required: true }
    ]
  }
];

export default function QuickActionsContent() {
  const [actions, setActions] = useState<QuickAction[]>(DEFAULT_ACTIONS);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchActions();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
       const res = await apiService.getUsers();
       if (res.success) {
          setUsers(res.data);
       }
    } catch (err) {
       console.warn("Failed to fetch users for selection.");
    }
  };

  const fetchActions = async () => {
    try {
      const res = await getQuickActions();
      if (res.success && res.data && res.data.length > 0) {
        const dbActions = res.data;
        
        // Merge DB actions with Default local actions to ensure schemas are present
        const finalActions = dbActions.map((db: any) => {
          const localMatch = DEFAULT_ACTIONS.find(def => def.key === db.key);
          return {
            ...db,
            // If DB schema is empty, use the local one
            formSchema: (db.formSchema && db.formSchema.length > 0) ? db.formSchema : localMatch?.formSchema || []
          };
        });
        
        DEFAULT_ACTIONS.forEach(def => {
          if (!dbActions.find((db: any) => db.key === def.key)) {
            finalActions.push(def);
          }
        });
        
        setActions(finalActions);
      }
    } catch (error) {
      console.warn("Using default fallback actions.");
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: QuickAction) => {
    setSelectedAction(action);
    setFormData({});
  };

  const handleInputChange = (id: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;

    setIsSubmitting(true);
    try {
      const res = await executeQuickAction(selectedAction.key, formData);
      if (res.success) {
        toast.success("Request submitted successfully!");
        setSelectedAction(null);
        router.push(`/User/tasks`);
      } else {
        toast.error(res.message || "Execution failed");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Server Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Zap;
    return <IconComponent className={className || "w-6 h-6"} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative w-16 h-16">
           <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {actions.map((action) => (
          <motion.div
            key={action._id}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleActionClick(action)}
            className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-100/50 border border-slate-50 hover:border-indigo-100 hover:shadow-indigo-500/10 transition-all cursor-pointer group flex flex-col h-full"
          >
            <div className="flex items-start justify-between">
              <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-12 transition-all duration-300">
                {renderIcon(action.icon)}
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Icons.ArrowUpRight className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            
            <div className="mt-6 flex-1">
              <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors uppercase text-[12px] tracking-[0.05em] mb-2">{action.name}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-3">{action.description}</p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Start Process</span>
               <Icons.ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedAction && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAction(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[8px]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden text-slate-900 flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                    {renderIcon(selectedAction.icon, "w-6 h-6")}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedAction.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Initialize Protocol</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAction(null)}
                  className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <Icons.X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 overflow-y-auto custom-scrollbar">
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Protocol Reference Title</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: July Office Equipment"
                      className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                  </div>

                  {selectedAction.formSchema?.map((field: any) => (
                    <div key={field.id} className={`space-y-2 ${field.type === 'textarea' || field.id === 'description' ? 'md:col-span-2' : ''}`}>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          required={field.required}
                          placeholder={field.placeholder}
                          className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all min-h-[100px] font-semibold"
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          required={field.required}
                          className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSIjOTQ5Nzk2IiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-[length:20px] bg-[right_1.25rem_center] bg-no-repeat"
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                        >
                          <option value="">Choose an option...</option>
                          {field.options?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'user' ? (
                        <div className="relative group">
                          <select
                            required={field.required}
                            className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSIjOTQ5Nzk2IiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-[length:20px] bg-[right_1.25rem_center] bg-no-repeat"
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            value={formData[field.id] || ""}
                          >
                            <option value="">{field.placeholder || "Select User..."}</option>
                            {users.map((user) => (
                              <option key={user._id} value={user._id}>
                                {user.firstName} {user.lastName} ({user.role})
                              </option>
                            ))}
                          </select>
                          <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                             <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                Assign to specific operator
                             </div>
                          </div>
                        </div>
                      ) : (
                        <input
                          type={field.type === 'file' ? 'text' : (field.type || 'text')} 
                          required={field.required}
                          placeholder={field.placeholder}
                          className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold"
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          value={formData[field.id] || ""}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer Section - Fixed at bottom */}
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedAction(null)}
                    className="px-10 py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        <Icons.Loader2 className="w-4 h-4 animate-spin" />
                        <span>Initializing...</span>
                      </>
                    ) : (
                      <>
                        <Icons.Send className="w-4 h-4" />
                        <span>Launch Execution</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
