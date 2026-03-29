'use client'

import React from 'react';
import { 
    ShieldCheck, 
    History as HistoryIcon, 
    Terminal 
} from 'lucide-react';
import ActivityRegistry from '../../super_admin/components/ActivityRegistry';

export default function LogsPage() {
    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header / Info */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-4 md:px-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Organization Audit Trail</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Operational history and system events</p>
                </div>
            </div>

            {/* Matrix Integration */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
                <ActivityRegistry 
                    showTitle={false}
                    limit={100}
                    apiEndpoint="/api/tenants/logs"
                    isTenantView={true}
                    customTabLabels={{
                        LOG: 'System Events',
                        HISTORY: 'Action History',
                        AUDIT: 'Detailed Audit'
                    }}
                    defaultTab="HISTORY"
                />
            </div>
        </div>
    );
}

