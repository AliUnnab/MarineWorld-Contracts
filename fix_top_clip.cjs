const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// For Third Party participants box
content = content.replace(/className="p-1\.5 border border-slate-200 rounded text-\[8px\] bg-slate-50\/50"/g, 'className="p-2 border border-slate-200 rounded text-[8.5px] bg-slate-50/50 leading-relaxed"');
content = content.replace(/className="text-slate-900 block truncate"/g, 'className="text-slate-900 block font-bold pt-0.5 pb-0.5"');

// For Party A and Party B
content = content.replace(/<h4 className="text-\[11px\] font-serif font-bold text-slate-900 uppercase tracking-tight mt-1">/g, '<h4 className="text-[11px] font-serif font-bold text-slate-900 uppercase tracking-tight mt-1 pt-0.5 pb-0.5">');

fs.writeFileSync('./components/ContractStudio.tsx', content);
