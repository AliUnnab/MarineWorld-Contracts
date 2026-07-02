const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// For Additional Party Box names just in case
content = content.replace(/<h4 className="text-\[10px\] font-serif font-bold text-slate-900 uppercase mt-0\.5">/g, '<h4 className="text-[10px] font-serif font-bold text-slate-900 uppercase mt-0.5 pt-0.5 pb-0.5">');

// Make sure the party block names have pt-1 to prevent top clipping
content = content.replace(/className="text-\[11px\] font-serif font-bold text-slate-900 uppercase tracking-tight mt-1 pt-0\.5 pb-0\.5"/g, 'className="text-[11px] font-serif font-bold text-slate-900 uppercase tracking-tight mt-1 pt-1 pb-1"');

// Third party participants
content = content.replace(/className="text-slate-900 block font-bold pt-0\.5 pb-0\.5"/g, 'className="text-slate-900 block font-bold pt-1 pb-1"');

// Let's also check standard Tailwind leading options. Often line-height of 1 or tight causes clipping.
content = content.replace(/leading-tight/g, 'leading-normal');

fs.writeFileSync('./components/ContractStudio.tsx', content);
