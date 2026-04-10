'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Rocket, 
    ArrowRight, 
    ChevronRight, 
    ChevronLeft, 
    Layers, 
    Target, 
    Workflow, 
    ShieldCheck,
    CheckCircle2
} from 'lucide-react';

interface WizardStep {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    content: string[];
    color: string;
}

const WIZARD_STEPS: WizardStep[] = [
    {
        title: "Welcome to Axia Core",
        subtitle: "Your command center for business orchestration.",
        icon: <Rocket className="text-indigo-500" size={40} />,
        color: "bg-indigo-600",
        content: [
            "You are now at the center of a powerful workflow engine.",
            "Axia allows you to digitize complex business processes across multiple sectors.",
            "Let's get you familiar with the architecture in 3 simple steps."
        ]
    },
    {
        title: "The Hierarchy of Logic",
        subtitle: "How your data and processes are structured.",
        icon: <Layers className="text-emerald-500" size={40} />,
        color: "bg-emerald-600",
        content: [
            "Domains: Your business sectors (e.g., Construction, HR).",
            "Modules: Functional areas within a domain (e.g., Purchase, Onboarding).",
            "Templates: Standardized blueprints for reusable processes.",
            "Projects: Real-world containers where workflows are executed."
        ]
    },
    {
        title: "Ready for Deployment",
        subtitle: "Your high-speed operational roadmap.",
        icon: <Target className="text-amber-500" size={40} />,
        color: "bg-amber-600",
        content: [
            "1. Define your Domain and Sector parameters.",
            "2. Architect your Workflow Templates in the Studio.",
            "3. Create a Project and deploy workflows from your templates.",
            "4. Monitor execution and validate tasks in real-time."
        ]
    }
];

export default function WelcomeWizard() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const hasSeenWizard = localStorage.getItem('axia_has_seen_wizard');
        if (!hasSeenWizard) {
            setIsOpen(true);
        }

        const handleOpen = () => {
            setCurrentStep(0);
            setIsOpen(true);
        };

        window.addEventListener('openOnboardingWizard', handleOpen);
        return () => window.removeEventListener('openOnboardingWizard', handleOpen);
    }, []);

    const handleClose = () => {
        localStorage.setItem('axia_has_seen_wizard', 'true');
        setIsOpen(false);
    };

    const nextStep = () => {
        if (currentStep < WIZARD_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />
                    
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]"
                    >
                        {/* Left Side - Visual Sidebar */}
                        <div className={`w-full md:w-[30%] p-12 flex flex-col justify-between transition-colors duration-500 ${WIZARD_STEPS[currentStep].color}`}>
                            <div className="space-y-8">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[32px] flex items-center justify-center border border-white/20 shadow-2xl">
                                    <Workflow className="text-white" size={40} />
                                </div>
                                <div className="space-y-3">
                                    <div className="text-[11px] font-black uppercase tracking-[0.4em] text-white/60">Discovery Phase</div>
                                    <div className="text-4xl font-black text-white tracking-tighter leading-none">Axia<br/>Core</div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {WIZARD_STEPS.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'w-12 bg-white' : 'w-3 bg-white/30'}`} 
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Right Side - Content */}
                        <div className="flex-1 p-12 md:p-16 flex flex-col bg-white relative">
                            <button 
                                onClick={handleClose}
                                className="absolute top-10 right-10 p-2 text-slate-300 hover:text-slate-900 transition-colors z-20"
                            >
                                <X size={24} />
                            </button>

                            <motion.div 
                                key={currentStep}
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="flex-1 flex flex-col"
                            >
                                <div className="mb-8">
                                    <div className="mb-4">{WIZARD_STEPS[currentStep].icon}</div>
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                                        {WIZARD_STEPS[currentStep].title}
                                    </h2>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                        {WIZARD_STEPS[currentStep].subtitle}
                                    </p>
                                </div>

                                <div className="space-y-4 flex-1">
                                    {WIZARD_STEPS[currentStep].content.map((text, i) => (
                                        <div key={i} className="flex items-start gap-4 group">
                                            <div className="w-6 h-6 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                                <CheckCircle2 size={14} className="text-slate-300 group-hover:text-indigo-500" />
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{text}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-8 mt-auto border-t border-slate-50">
                                    <button 
                                        onClick={prevStep}
                                        disabled={currentStep === 0}
                                        className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-opacity ${currentStep === 0 ? 'opacity-0' : 'opacity-100 text-slate-400 hover:text-slate-900'}`}
                                    >
                                        <ChevronLeft size={16} />
                                        Previous
                                    </button>
                                    
                                    <button 
                                        onClick={nextStep}
                                        className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3 active:scale-95"
                                    >
                                        {currentStep === WIZARD_STEPS.length - 1 ? 'Get Started' : 'Next Protocol'}
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
