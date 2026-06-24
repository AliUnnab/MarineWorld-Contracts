import React from 'react';
import ContractStudio from './components/ContractStudio';
import { User, Bell, ChevronDown } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-system-bg text-system-text-primary">
      {/* Global Navigation Header */}
      <header className="h-[60px] shrink-0 border-b border-system-border-base bg-[#121212] flex items-center justify-between px-6 z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#121212" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-lg font-manrope font-semibold text-[#E8EAED] tracking-tight">MarineWorld Contracts</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-[#BBC0C4] hover:text-[#E8EAED] transition-colors p-2 rounded-full hover:bg-white/5">
            <Bell size={18} />
          </button>
          <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
          <div className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 p-1.5 pl-2 pr-3 rounded-lg transition-colors border border-transparent hover:border-white/10 group">
            <div className="w-8 h-8 rounded-full bg-system-surface border border-system-border-base flex items-center justify-center text-primary group-hover:bg-[#2D2D2D] transition-colors">
              <User size={16} />
            </div>
            <div className="hidden sm:block text-left mr-1">
              <div className="text-[13px] font-medium text-[#E8EAED] leading-none">Ali Unnab</div>
              <div className="text-[11px] text-[#BBC0C4] mt-1">Administrator</div>
            </div>
            <ChevronDown size={14} className="text-[#80868B] group-hover:text-[#BBC0C4] transition-colors" />
          </div>
        </div>
      </header>
      
      <main className="flex-1 relative flex flex-col h-[calc(100vh-60px)] overflow-hidden">
        <ContractStudio onBack={() => {}} />
      </main>
    </div>
  );
};

export default App;

