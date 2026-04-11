'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, ChevronRight, MousePointer2, ArrowRight } from 'lucide-react';

interface HintProps {
    id: string;
    targetId: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export default function VisualHint({ id, targetId, title, content, position = 'bottom', delay = 0.5 }: HintProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(true);

    useEffect(() => {
        const checkVisibility = () => {
            const dismissedHints = JSON.parse(localStorage.getItem('axia_dismissed_hints') || '[]');
            const showHints = localStorage.getItem('axia_coaching_mode') === 'true';
            
            if (showHints && !dismissedHints.includes(id)) {
                // Check if target exists in DOM
                const element = document.getElementById(targetId);
                if (element) {
                    setIsDismissed(false);
                    setTimeout(() => setIsVisible(true), delay * 1000);
                }
            } else {
                setIsVisible(false);
                setIsDismissed(true);
            }
        };

        checkVisibility();
        // Listen for coaching mode toggle
        window.addEventListener('coachingModeToggled', checkVisibility);
        return () => window.removeEventListener('coachingModeToggled', checkVisibility);
    }, [id, targetId, delay]);

    const handleDismiss = () => {
        setIsVisible(false);
        const dismissedHints = JSON.parse(localStorage.getItem('axia_dismissed_hints') || '[]');
        if (!dismissedHints.includes(id)) {
            dismissedHints.push(id);
            localStorage.setItem('axia_dismissed_hints', JSON.stringify(dismissedHints));
        }
    };

    if (isDismissed) return null;

    const positions = {
        top: 'bottom-full mb-4 left-1/2 -translate-x-1/2',
        bottom: 'top-full mt-4 left-1/2 -translate-x-1/2',
        left: 'right-full mr-4 top-1/2 -translate-y-1/2',
        right: 'left-full ml-4 top-1/2 -translate-y-1/2'
    };

    const arrows = {
        top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-white border-l-transparent border-r-transparent border-b-transparent',
        bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-b-white border-l-transparent border-r-transparent border-t-transparent',
        left: 'right-[-6px] top-1/2 -translate-y-1/2 border-l-white border-t-transparent border-b-transparent border-r-transparent',
        right: 'left-[-6px] top-1/2 -translate-y-1/2 border-r-white border-t-transparent border-b-transparent border-l-transparent'
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[60] pointer-events-none">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className={`absolute pointer-events-auto w-64 p-5 bg-white rounded-3xl shadow-2xl border border-slate-100 ${positions[position]}`}
                        style={{
                            top: document.getElementById(targetId)?.getBoundingClientRect().top! + (position === 'bottom' ? document.getElementById(targetId)?.offsetHeight! : 0),
                            left: document.getElementById(targetId)?.getBoundingClientRect().left! + (document.getElementById(targetId)?.offsetWidth! / 2) - 128
                        }}
                    >
                        <div className={`absolute w-0 h-0 border-[6px] ${arrows[position]}`} />
                        
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center">
                                    <HelpCircle size={12} className="text-indigo-600" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Hint</span>
                            </div>
                            <button onClick={handleDismiss} className="text-slate-300 hover:text-slate-900 transition-colors">
                                <X size={14} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-black text-slate-800 tracking-tight leading-none">{title}</h4>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{content}</p>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                             <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                             </div>
                             <button onClick={handleDismiss} className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:translate-x-1 transition-transform flex items-center gap-1">
                                Understood <ChevronRight size={10} />
                             </button>
                        </div>
                    </motion.div>
                    
                    {/* Pulsing Target Overlay */}
                    <div 
                        className="absolute bg-indigo-500/10 border-2 border-indigo-500 rounded-xl animate-pulse"
                        style={{
                            top: document.getElementById(targetId)?.getBoundingClientRect().top!,
                            left: document.getElementById(targetId)?.getBoundingClientRect().left!,
                            width: document.getElementById(targetId)?.offsetWidth!,
                            height: document.getElementById(targetId)?.offsetHeight!
                        }}
                    />
                </div>
            )}
        </AnimatePresence>
    );
}
