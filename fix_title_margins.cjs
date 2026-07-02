const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// Title margins
content = content.replace(/className="text-center my-6 py-4 border-y border-slate-200"/g, 'className="text-center my-2 py-3 border-y border-slate-200"');
content = content.replace(/className="grid grid-cols-2 gap-x-6 gap-y-3 my-4 text-\[10px\]"/g, 'className="grid grid-cols-2 gap-x-6 gap-y-3 my-2 text-[10px]"');

// Parties block margin
content = content.replace(/<div className="my-4">\s*<h3 className="text-\[9px\] font-sans font-bold/g, '<div className="my-2">\n                          <h3 className="text-[9px] font-sans font-bold');

// Participants block margin
content = content.replace(/<div className="my-2">\s*<h3 className="font-manrope font-semibold text-\[12pt\] text-slate-800 uppercase tracking-\[0.15em\] mb-2 border-b/g, '<div className="my-1">\n                            <h3 className="font-manrope font-semibold text-[12pt] text-slate-800 uppercase tracking-[0.15em] mb-1 border-b');

// Bottom seal padding
content = content.replace(/className="flex items-center justify-between border-t border-slate-200 pt-4 mt-auto"/g, 'className="flex items-center justify-between border-t border-slate-200 pt-2 mt-auto"');


fs.writeFileSync('./components/ContractStudio.tsx', content);
