const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// Title Page Title
content = content.replace(
  /<h1 className="text-lg font-serif uppercase text-black font-extrabold tracking-tight leading-tight mb-2">/g,
  '<h1 className="font-manrope font-bold text-[24pt] tracking-[0.5px] text-black uppercase leading-tight mb-2">'
);

// Document Metadata
content = content.replace(
  /<div className="text-\[9px\] font-sans font-bold text-slate-500 uppercase tracking-\[0\.25em\]">/g,
  '<div className="font-inter font-semibold text-[9pt] text-slate-500 uppercase">'
);

// Section Titles (e.g. <h2>)
content = content.replace(
  /<h2 className="text-\[11px\] font-serif font-bold uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex justify-between">/g,
  '<h2 className="font-manrope font-semibold text-[16pt] uppercase mb-[16px] border-b border-slate-200 pb-2 flex justify-between text-black">'
);

// Replace font-serif text styling in section wrapper
content = content.replace(
  /<div className="space-y-6 text-\[11px\] leading-relaxed font-serif text-slate-800 flex-1">/g,
  '<div className="flex-1">'
);

// Replace font-serif inside section block
content = content.replace(
  /<div className="text-slate-900 leading-relaxed font-serif text-\[10\.5px\]">/g,
  '<div className="text-slate-900">'
);

// Update Commercial Scope header
content = content.replace(
  /<div className="text-\[9px\] font-sans font-black text-slate-800 uppercase tracking-\[0\.18em\]">SECTION II - COMMERCIAL SCOPE & LOGISTICS COVER<\/div>/g,
  '<div className="font-manrope font-bold text-[13pt] tracking-[0.3px] text-black uppercase">SECTION II - COMMERCIAL SCOPE & LOGISTICS COVER</div>'
);

// Cards / Registry updates
// We will simply let LegalMarkdown handle the primary text

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated ContractStudio typography");
