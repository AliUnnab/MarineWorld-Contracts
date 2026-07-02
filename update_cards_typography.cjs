const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

content = content.replace(
  /<span className="text-\[8\.5px\] text-slate-450 uppercase tracking-wider font-bold block mb-1">/g,
  '<span className="font-manrope font-semibold text-[11pt] text-slate-500 uppercase tracking-wider block mb-1">'
);

content = content.replace(
  /<span className="font-serif font-bold text-\[11px\] text-slate-900">/g,
  '<span className="font-inter font-medium text-[10.5pt] text-slate-900">'
);

content = content.replace(
  /<span className="font-sans font-semibold text-slate-800">/g,
  '<span className="font-inter font-medium text-[10.5pt] text-slate-800">'
);

content = content.replace(
  /<span className="text-\[8\.5px\] text-slate-450 uppercase tracking-wider font-bold block mb-1\.5">/g,
  '<span className="font-manrope font-semibold text-[11pt] text-slate-500 uppercase tracking-wider block mb-1.5">'
);

content = content.replace(
  /<p className="text-\[9\.5px\] text-slate-650 font-serif leading-relaxed whitespace-pre-line text-justify max-h-48 overflow-y-auto pr-1">/g,
  '<p className="font-inter font-normal text-[10.5pt] text-slate-700 leading-[1.45] whitespace-pre-line text-left">'
);

content = content.replace(
  /<span className="text-\[8px\] text-slate-450 uppercase tracking-wider font-bold block mb-0\.5">/g,
  '<span className="font-manrope font-semibold text-[11pt] text-slate-500 uppercase tracking-wider block mb-0.5">'
);

content = content.replace(
  /<span className="font-sans font-bold text-slate-800">/g,
  '<span className="font-inter font-medium text-[10.5pt] text-slate-800">'
);

content = content.replace(
  /<h3 className="text-\[8\.5px\] font-sans font-bold text-slate-800 uppercase tracking-\[0\.15em\] mb-2 border-b border-slate-200 pb-0\.5">/g,
  '<h3 className="font-manrope font-semibold text-[12pt] text-slate-800 uppercase tracking-[0.15em] mb-2 border-b border-slate-200 pb-0.5">'
);

// Footer & page numbers & seal
content = content.replace(
  /<div className="mt-auto pt-6 text-\[8px\] text-slate-500 border-t border-slate-200 flex justify-between font-sans">/g,
  '<div className="mt-auto pt-6 font-inter font-medium text-[8pt] text-slate-500 border-t border-slate-200 flex justify-between">'
);

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated ContractStudio cards typography");
