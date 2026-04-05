"use client";

// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, X, Maximize2, Minimize2, Send, Loader2 } from 'lucide-react';

export default function AiChatWidget() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.body) throw new Error("Erreur de flux");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      const assistantMsgId = (Date.now()+1).toString();
      let assistantContent = '';
      
      setMessages([...newMessages, { id: assistantMsgId, role: 'assistant', content: assistantContent }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        // Mise à jour de l'état avec le nouveau texte du Stream
        setMessages(prev => {
           const updated = [...prev];
           updated[updated.length - 1] = { id: assistantMsgId, role: 'assistant', content: assistantContent };
           return updated;
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const safeInput = input || '';

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl shadow-indigo-500/30 flex items-center justify-center z-[9999] transition-transform hover:scale-110"
      >
        <Bot size={30} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white border border-gray-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] rounded-2xl flex flex-col z-[9999] overflow-hidden transition-all duration-300 ${isExpanded ? 'w-[70vw] h-[85vh] max-w-[800px]' : 'w-[380px] h-[550px]'}`}>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <Bot size={22} />
          <h3 className="font-semibold m-0">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-white/80 hover:text-white transition-colors">
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#f8f9fa]">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-12 space-y-4">
            <div className="bg-indigo-100 p-4 rounded-full inline-block">
              <Bot size={40} className="text-indigo-600" />
            </div>
            <p className="font-medium text-gray-600">Hello!</p>
            <p className="text-sm">I'm your AI Assistant. Ask me anything about configuring the platform or creating workflows.</p>
          </div>
        )}
        {messages.map((m: any) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none text-gray-800'}`}>
              <div className="prose prose-sm max-w-none prose-p:my-0 prose-pre:my-0">
                <ReactMarkdown>
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-3.5 rounded-2xl rounded-tl-none shadow-sm text-gray-500 flex items-center gap-2 text-sm">
              <Loader2 className="animate-spin" size={16} /> Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-white border-t flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 px-4 py-2.5 bg-gray-100/80 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-none"
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="h-10 w-10 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send size={18} className="translate-x-[2px]" />
        </button>
      </form>
    </div>
  );
}
