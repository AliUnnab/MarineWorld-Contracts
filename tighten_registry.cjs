const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

content = content.replace(/className="text-\[9px\] font-sans font-bold text-slate-800 uppercase tracking-\[0.2em\] mb-3 border-b/g, 'className="text-[9px] font-sans font-bold text-slate-800 uppercase tracking-[0.2em] mb-2 border-b');
content = content.replace(/className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between"/g, 'className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between"');

// also for third-party participants block:
// p-2 is fine, let's make it p-1.5 to save tiny bit space
content = content.replace(/className="p-2 border border-slate-200 rounded text-\[8px\] bg-slate-50\/50"/g, 'className="p-1.5 border border-slate-200 rounded text-[8px] bg-slate-50/50"');

fs.writeFileSync('./components/ContractStudio.tsx', content);
