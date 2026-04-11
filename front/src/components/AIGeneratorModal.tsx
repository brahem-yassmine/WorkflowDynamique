"use client";
import { useState } from 'react';
import { Wand2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AIGeneratorModalProps {
  type: 'workflow' | 'form';
  isTemplate?: boolean;
  onGenerate: (data: any) => void;
}

export default function AIGeneratorModal({ type, onGenerate, isTemplate = false }: AIGeneratorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'workflow' ? '/api/ai/generate-workflow' : '/api/ai/generate-form';
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: prompt })
      });
      const data = await response.json();
      
      if(data.error) throw new Error(data.error);
      
      onGenerate(data);
      setIsOpen(false);
      setPrompt('');
      toast.success(`${type === 'workflow' ? (isTemplate ? 'Template' : 'Workflow') : 'Form'} successfully generated!`);
    } catch(err: any) {
      toast.error(err.message || 'Error occurred during generation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="flex items-center gap-2 bg-gradient-to-r from-pink-500 hover:from-pink-600 to-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-md shadow-md transition-all font-medium text-sm whitespace-nowrap"
        type="button"
      >
        <Wand2 size={16} /> Generate with AI ✨
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] p-6 w-full max-w-lg border border-indigo-100">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-xl flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                  <Wand2 className="text-pink-500" /> AI {type === 'workflow' ? (isTemplate ? 'Template' : 'Workflow') : 'Form'} Generator
               </h3>
               <button onClick={() => setIsOpen(false)} className="bg-gray-100 p-1.5 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors">
                 <X size={18} />
               </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Describe your needs in natural language. Our AI will automatically design the structure to save you time.
            </p>
            
            <textarea 
              className="w-full border border-gray-200 rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-purple-500 outline-none text-sm placeholder:text-gray-400 bg-gray-50/50"
              placeholder={type === 'workflow' ? "Ex: I want a leave request process. First the employee submits, then the manager validates, and finally HR is notified." : "Ex: I want a recruitment form with full name, email address, a field to attach a CV, and a dropdown for the experience level."}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            
            <div className="mt-6 flex justify-end gap-3 text-black">
               <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors">Cancel</button>
               <button 
                 onClick={handleGenerate} 
                 disabled={!prompt.trim() || loading}
                 className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium rounded-md flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all whitespace-nowrap"
               >
                 {loading ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                 {loading ? 'Generating...' : 'Generate!'}
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
