import fs from 'fs';

let content = fs.readFileSync('./components/CompanyInterface.tsx', 'utf8');

// Replace bright white-ish borders with more subtle corporate borders on hover for inputs and textareas
content = content.replace(/className="w-full bg-\[#010a14\]\/90 border border-system-text-primary\/20 /g, 'className="w-full bg-[#010a14]/90 border border-slate-800/60 hover:border-[#19A7C1]/40 focus:border-[#19A7C1]/60 ');
content = content.replace(/className="w-full bg-system-bg\/50 border border-\[#19A7C1\]\/20 /g, 'className="w-full bg-system-bg/50 border border-slate-800/60 hover:border-[#19A7C1]/40 focus:border-[#19A7C1]/60 ');
content = content.replace(/border-\[#19A7C1\]\/30 focus:border-\[#19A7C1\]/g, 'border-slate-800/60 hover:border-[#19A7C1]/40 focus:border-[#19A7C1]/60');

fs.writeFileSync('./components/CompanyInterface.tsx', content);
