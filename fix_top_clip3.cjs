const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

content = content.replace(/className="text-slate-900 block font-bold pt-1 pb-1"/g, 'className="text-slate-900 block font-bold pt-1 pb-1 overflow-visible"');

content = content.replace(/className="text-\[11px\] font-serif font-bold text-slate-900 uppercase tracking-tight mt-1 pt-1 pb-1"/g, 'className="text-[11px] font-serif font-bold text-slate-900 uppercase tracking-tight mt-1 pt-1 pb-1 overflow-visible"');

content = content.replace(/className="text-\[10px\] font-serif font-bold text-slate-900 uppercase mt-0\.5 pt-0\.5 pb-0\.5"/g, 'className="text-[10px] font-serif font-bold text-slate-900 uppercase mt-0.5 pt-1 pb-1 overflow-visible"');


fs.writeFileSync('./components/ContractStudio.tsx', content);
