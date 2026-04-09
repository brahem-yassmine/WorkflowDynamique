'use client';

import React from 'react';
import { 
    Rocket, 
    UserPlus, 
    Globe, 
    Users, 
    Layers, 
    Copy, 
    Briefcase, 
    Workflow, 
    FileText, 
    PlayCircle, 
    Lock, 
    Zap, 
    CheckCircle2,
    Search,
    ChevronRight,
    ArrowRight,
    MousePointer2
} from 'lucide-react';
import { motion } from 'framer-motion';

const GUIDE_STEPS = [
    {
        id: 1,
        icon: <UserPlus className="text-blue-500" />,
        title: "Create Your Account & Login",
        description: "Your gateway to organizational orchestration.",
        content: [
            "Sign up using your professional email and secure password.",
            "Log in to access your personalized administrative workspace."
        ],
        accent: "bg-blue-500"
    },
    {
        id: 2,
        icon: <Globe className="text-indigo-500" />,
        title: "Create or Select a Domain",
        description: "Defining your business landscape.",
        content: [
            "Navigate to the 'Domains' repository in the sidebar.",
            "Click 'Create Domain' to define a new sector (e.g., BTP, Healthcare).",
            "If the domain already exists, simply select it from the matrix."
        ],
        accent: "bg-indigo-500"
    },
    {
        id: 3,
        icon: <Users className="text-emerald-500" />,
        title: "Set Up Roles & Users",
        description: "Establishing the hierarchy of authority.",
        content: [
            "Access 'Users & Roles' to define permissions.",
            "Create specialized roles (Admin, Manager, Creator, Worker).",
            "Assign granular permissions to ensure secure lattice access.",
            "Onboard team members and bind them to their respective roles."
        ],
        accent: "bg-emerald-500"
    },
    {
        id: 4,
        icon: <Layers className="text-violet-500" />,
        title: "Create Functional Modules",
        description: "Organizing by business function.",
        content: [
            "Go to 'Functional Modules' within your domain settings.",
            "Deploy modules representing core operations (e.g., Purchase, HR, Sales).",
            "These serve as logical containers for your structural templates."
        ],
        accent: "bg-violet-500"
    },
    {
        id: 5,
        icon: <Copy className="text-amber-500" />,
        title: "Architect Workflow Templates",
        description: "The blueprints of operational excellence.",
        content: [
            "Enter the 'Workflow Templates' repository.",
            "Forge a reusable protocol by selecting a module and entering the Architect mode.",
            "Design logic gates and nodes (e.g., 'Purchase Request' approval flow).",
            "Tip: Reusable templates save hundreds of hours in project scaling."
        ],
        accent: "bg-amber-500"
    },
    {
        id: 6,
        icon: <Briefcase className="text-rose-500" />,
        title: "Establish Strategic Projects",
        description: "Binding logic to real-world instances.",
        content: [
            "Create a 'Project' which represents a physical instance (e.g., 'Site A', 'Project Phoenix').",
            "Assign projects to their parent domains to maintain logical isolation."
        ],
        accent: "bg-rose-500"
    },
    {
        id: 7,
        icon: <Workflow className="text-cyan-500" />,
        title: "Deploy Active Workflows",
        description: "Activation of the operational lattice.",
        content: [
            {
                type: "Option A",
                text: "Import from Template (Recommended): Clone a pre-architected protocol directly into your project."
            },
            {
                type: "Option B",
                text: "Custom Forge: Build a unique operational flow from scratch for specialized cases."
            }
        ],
        accent: "bg-cyan-500"
    },
    {
        id: 8,
        icon: <FileText className="text-orange-500" />,
        title: "Integrate Dynamic Forms",
        description: "Data capture meets process logic.",
        content: [
            "Connect forms to specific workflow nodes.",
            "Ensure users capture the required telemetry at every critical step."
        ],
        accent: "bg-orange-500"
    },
    {
        id: 9,
        icon: <PlayCircle className="text-fuchsia-500" />,
        title: "Execute & Monitor",
        description: "Where strategy meets execution.",
        content: [
            "Trigger workflow instances to begin operation.",
            "Track real-time progress through the Progress Dashboard.",
            "Oversee validations, task dependencies, and operational bottlenecks."
        ],
        accent: "bg-fuchsia-500"
    },
    {
        id: 10,
        icon: <Lock className="text-slate-600" />,
        title: "Audit & Optimize",
        description: "Continuous improvement of the system.",
        content: [
            "Regularly review permission matrices.",
            "Analyze audit logs to ensure total procedural compliance."
        ],
        accent: "bg-slate-700"
    }
];

export default function PlatformGuidePage() {
    return (
        <div className="max-w-6xl mx-auto py-12 px-6">
            <div className="mb-16 text-center relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center justify-center gap-4 mb-6"
                >
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600">
                        <Rocket size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Official Launch Manual</span>
                    </div>
                    <button 
                        onClick={() => {
                            localStorage.setItem('axia_coaching_mode', 'true');
                            localStorage.removeItem('axia_dismissed_hints');
                            window.dispatchEvent(new CustomEvent('coachingModeToggled'));
                        }}
                        className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-600 border border-indigo-500 rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                    >
                        <MousePointer2 size={16} />
                        Enable Guided Hints
                    </button>
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('openOnboardingWizard'))}
                        className="inline-flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                    >
                        <PlayCircle size={16} className="text-indigo-400" />
                        Restart Welcome Wizard
                    </button>
                </motion.div>
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-6xl font-black text-slate-800 tracking-tighter mb-6"
                >
                    Getting Started <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">with Axia</span>
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg text-slate-500 max-w-2xl mx-auto font-medium"
                >
                    Welcome to the core of organizational automation. Follow this architectural guide to master the configuration and deployment of your business lattice.
                </motion.p>
            </div>

            {/* Practical Quick Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                <div className="p-8 bg-slate-900 rounded-[40px] text-white space-y-4 shadow-2xl shadow-slate-900/20 col-span-1 md:col-span-2 lg:col-span-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">Core Philosophy</h3>
                    <p className="text-lg font-bold leading-tight">Mastering Reusability via Templates and Recursive Modules.</p>
                    <div className="pt-4 flex items-center gap-3 text-white/50 text-[10px] font-black uppercase tracking-widest">
                       <Zap size={14} className="text-indigo-400" />
                       Efficiency maximized
                    </div>
                </div>
                <div className="p-8 bg-white border border-slate-100 rounded-[40px] space-y-4">
                    <div className="flex items-center justify-between">
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 italic font-serif">Rule #1</h3>
                         <CheckCircle2 size={18} className="text-emerald-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Every Workflow instance must reside within a bounded Project container.</p>
                </div>
                <div className="p-8 bg-white border border-slate-100 rounded-[40px] space-y-4">
                    <div className="flex items-center justify-between">
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 italic font-serif">Rule #2</h3>
                         <Layers size={18} className="text-indigo-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Templates are global blueprints; Workflows are project-specific activations.</p>
                </div>
            </div>

            {/* The Step-by-Step Matrix */}
            <div className="space-y-12 relative">
                {/* Visual Connector Line */}
                <div className="absolute left-[39px] md:left-1/2 top-10 bottom-10 w-[2px] bg-indigo-50 hidden md:block" />

                {GUIDE_STEPS.map((step, idx) => (
                    <motion.div 
                        key={step.id}
                        initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className={`flex flex-col md:flex-row items-center gap-10 ${idx % 2 === 0 ? '' : 'md:flex-row-reverse'}`}
                    >
                        {/* The Visual Card */}
                        <div className="flex-1 w-full">
                            <div className="group relative bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-indigo-500/[0.02] hover:shadow-indigo-500/10 transition-all duration-500">
                                <div className={`absolute top-0 ${idx % 2 === 0 ? 'right-0 rounded-tr-[48px] rounded-bl-[48px]' : 'left-0 rounded-tl-[48px] rounded-br-[48px]'} w-24 h-24 ${step.accent} opacity-5 group-hover:opacity-10 transition-opacity`} />
                                
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        {React.cloneElement(step.icon as React.ReactElement<{ size: number }>, { size: 32 })}
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Architect Step {step.id}</div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{step.title}</h3>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{step.description}</p>
                                    <div className="space-y-4">
                                        {step.content.map((item, i) => (
                                            <div key={i} className="flex items-start gap-4">
                                                <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                                    <ChevronRight size={14} className="text-slate-400" />
                                                </div>
                                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                                    {typeof item === 'string' ? item : (
                                                        <>
                                                            <strong className="text-slate-800 font-black tracking-tight uppercase mr-2">{item.type}:</strong>
                                                            {item.text}
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Centered Step Indicator */}
                        <div className="relative z-10 w-20 flex items-center justify-center hidden md:flex">
                            <div className={`w-20 h-20 rounded-full ${step.accent} border-8 border-slate-50 shadow-2xl flex items-center justify-center text-white font-black text-2xl`}>
                                {step.id}
                            </div>
                        </div>

                        {/* Spacer for the other side */}
                        <div className="flex-1 hidden md:block" />
                    </motion.div>
                ))}
            </div>

            {/* Closing Section */}
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-32 p-16 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[64px] text-center text-white overflow-hidden relative"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-2xl" />
                
                <h2 className="text-5xl font-black tracking-tighter mb-8 relative z-10">You're Ready to Architect.</h2>
                <p className="text-xl text-indigo-100 mb-12 max-w-xl mx-auto font-medium relative z-10">The platform lattice is now under your command. Begin by creating your first domain.</p>
                <button 
                   onClick={() => window.location.href = '/admin/domains'}
                   className="px-10 py-5 bg-white text-indigo-600 rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-indigo-900/40 hover:scale-105 transition-transform relative z-10"
                >
                    Go to Domains Matrix
                </button>
            </motion.div>
        </div>
    );
}
