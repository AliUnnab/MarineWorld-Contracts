import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Copy, PlusCircle, Check, Sparkles, Anchor } from 'lucide-react';
import { chatWithContractCopilot } from '../services/gemini';
import { db, auth } from '../services/firebase-service';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ContractCopilotProps {
  contractId: string | null;
  companyId: string | null;
  contractState: any;
}

export function ContractCopilot({ contractId, companyId, contractState }: ContractCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ id?: string; role: 'user' | 'model'; text: string; timestamp?: any }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contractId || !companyId) {
      setMessages([]);
      return;
    }
    
    const quotaActive = window.localStorage.getItem('firestore_quota_exceeded') === 'true';
    if (quotaActive) {
      console.warn("Copilot Firestore subscription skipped due to active quota limit. Utilizing offline chat memory.");
      return;
    }
    
    const messagesRef = collection(db, 'companies', companyId, 'copilot_sessions', contractId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as { id: string; role: 'user' | 'model'; text: string; timestamp: any }[];
      
      setMessages(msgs);
    }, (error) => {
      const isQuota = error && (
        error.message?.toLowerCase().includes('quota') ||
        error.message?.toLowerCase().includes('limit') ||
        error.message?.toLowerCase().includes('resource_exhausted') ||
        error.code === 'resource-exhausted'
      );
      if (isQuota) {
        console.warn("Copilot Firestore subscription error due to quota limit:", error.message);
        window.localStorage.setItem('firestore_quota_exceeded', 'true');
        (window as any).__markQuotaExceeded?.();
      } else {
        console.error("Copilot Firestore subscription error:", error);
      }
    });
    
    return () => unsubscribe();
  }, [contractId, companyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userText = inputValue.trim();
    setInputValue('');
    
    const history = messages.map(m => ({ role: m.role, text: m.text }));
    const tempUserMsg = { id: Date.now().toString(), role: 'user' as const, text: userText };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);
    
    try {
      const quotaActive = window.localStorage.getItem('firestore_quota_exceeded') === 'true';
      if (contractId && companyId && !quotaActive) {
        const messagesRef = collection(db, 'companies', companyId, 'copilot_sessions', contractId, 'messages');
        addDoc(messagesRef, {
          role: 'user',
          text: userText,
          timestamp: serverTimestamp(),
          userId: auth.currentUser?.uid || null
        }).catch(e => {
          const isQuota = e && (
            e.message?.toLowerCase().includes('quota') ||
            e.message?.toLowerCase().includes('limit') ||
            e.message?.toLowerCase().includes('resource_exhausted') ||
            e.code === 'resource-exhausted'
          );
          if (isQuota) {
            console.warn("Copilot addDoc user error due to quota limit:", e.message);
            window.localStorage.setItem('firestore_quota_exceeded', 'true');
            (window as any).__markQuotaExceeded?.();
          } else {
            console.error("Copilot addDoc user error:", e);
          }
        });
      }
      
      const responseText = await chatWithContractCopilot(userText, history, contractState);
      
      if (contractId && companyId && !quotaActive) {
        const messagesRef = collection(db, 'companies', companyId, 'copilot_sessions', contractId, 'messages');
        addDoc(messagesRef, {
          role: 'model',
          text: responseText,
          timestamp: serverTimestamp(),
          userId: auth.currentUser?.uid || null
        }).catch(e => {
          const isQuota = e && (
            e.message?.toLowerCase().includes('quota') ||
            e.message?.toLowerCase().includes('limit') ||
            e.message?.toLowerCase().includes('resource_exhausted') ||
            e.code === 'resource-exhausted'
          );
          if (isQuota) {
            console.warn("Copilot addDoc model error due to quota limit:", e.message);
            window.localStorage.setItem('firestore_quota_exceeded', 'true');
            (window as any).__markQuotaExceeded?.();
          } else {
            console.error("Copilot addDoc model error:", e);
          }
        });
        
        // Also push to local list so the UI updates immediately and doesn't rely solely on sub (in case sub lagged)
        setMessages(prev => {
          if (prev.some(m => m.text === responseText && m.role === 'model')) return prev;
          return [...prev, { id: Date.now().toString(), role: 'model' as const, text: responseText }];
        });
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model' as const, text: responseText }]);
      }
      
    } catch (error) {
      console.error("Error in Copilot chat:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model' as const, text: 'Ağ hatası veya zaman aşımı oluştu. Lütfen tekrar deneyin.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
      {isOpen && (
        <div className="bg-[#0b1221] border border-[#00D4FF]/30 shadow-[0_0_30px_rgba(0,212,255,0.15)] rounded-2xl w-[600px] h-[75vh] max-h-[800px] flex flex-col mb-4 pointer-events-auto overflow-hidden animate-in zoom-in-95 font-manrope">
          {/* Header */}
          <div className="bg-[#171B26] border-b border-[#00D4FF]/20 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00D4FF]/10 flex items-center justify-center border border-[#00D4FF]/20">
                <Anchor size={16} className="text-[#00D4FF]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Contract Copilot</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Enterprise Assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 text-xs mt-10 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#171B26] border border-[#2B3347] flex items-center justify-center mx-auto mb-2 relative">
                  <Anchor size={32} className="text-slate-400" />
                  <Sparkles size={14} className="text-[#00D4FF] absolute -top-1 -right-1" />
                </div>
                <p className="font-bold text-slate-300 text-sm">Contract Copilot Ready</p>
                <div className="text-[11px] leading-relaxed max-w-[300px] mx-auto space-y-2">
                  <p>Your active Agreement has been indexed.</p>
                  <p>I understand your current contract and will use it as the context throughout this session.</p>
                  <p>Ask me for guidance, drafting suggestions or contract explanations.</p>
                  <p className="text-[#00D4FF]/80 pt-1">Nothing is modified without your approval.</p>
                </div>
              </div>
            )}
            
            {messages.map((msg, idx) => {
              const msgId = msg.id || String(idx);
              return (
                <div key={msgId} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[95%] rounded-xl p-4 text-[13px] font-sans leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#00D4FF] text-[#041326]' 
                      : 'bg-[#171B26] border border-[#2B3347] text-slate-200 shadow-sm'
                  }`}>
                    <div className={`prose prose-sm max-w-none ${
                      msg.role === 'user' 
                        ? 'text-[#041326] prose-p:text-[#041326] prose-headings:text-[#041326] prose-strong:text-[#041326]' 
                        : 'prose-invert prose-p:leading-relaxed prose-headings:text-white prose-strong:text-[#00D4FF] prose-li:marker:text-[#00D4FF] prose-a:text-[#00D4FF] prose-li:my-1.5 prose-ul:my-3 prose-ol:my-3 prose-p:my-2.5'
                    }`}>
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </Markdown>
                    </div>
                  </div>
                  
                  {msg.role === 'model' && (
                    <div className="flex items-center gap-1.5 mt-1.5 ml-2">
                      <button 
                        onClick={() => handleCopy(msg.text, msgId)}
                        className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[9px] font-bold text-slate-400 hover:text-white transition-colors"
                      >
                        {copiedId === msgId ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                        {copiedId === msgId ? 'Copied' : 'Copy'}
                      </button>
                      <button className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-[#00D4FF]/10 border border-white/5 hover:border-[#00D4FF]/30 rounded text-[9px] font-bold text-slate-400 hover:text-[#00D4FF] transition-colors">
                        <PlusCircle size={10} />
                        Insert
                      </button>
                      <button className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[9px] font-bold text-slate-400 hover:text-white transition-colors">
                        Save to Notes
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#171B26] border border-[#2B3347] rounded-xl p-3 text-[12px] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#00D4FF] rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#00D4FF] rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-[#00D4FF] rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 bg-[#171B26] border-t border-[#00D4FF]/20">
            <div className="relative flex items-center">
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about this contract..."
                className="w-full bg-[#041326] border border-[#2B3347] focus:border-[#00D4FF]/50 rounded-xl pl-4 pr-12 py-3 text-xs text-white outline-none transition-colors placeholder:text-slate-500 font-sans"
              />
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 w-8 h-8 flex items-center justify-center bg-[#00D4FF] text-[#041326] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#33DDFF] transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#00D4FF] rounded-full shadow-[0_0_20px_rgba(0,212,255,0.4)] flex items-center justify-center text-[#041326] hover:scale-105 transition-transform pointer-events-auto border-2 border-[#041326] group relative"
        >
          <Anchor size={24} className="group-hover:animate-pulse" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-[#041326] flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
          </div>
        </button>
      )}
    </div>
  );
}
