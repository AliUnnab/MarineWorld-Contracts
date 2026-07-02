const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// Remove INTERACTIVE CLAUSE WORKSPACE
const workspaceTitleRegex = /<div className="text-\[10px\] font-bold text-white uppercase tracking-widest flex items-center gap-2 font-manrope">\s*<FileSignature size=\{14\} className="text-\[#00D4FF\]" \/> INTERACTIVE CLAUSE WORKSPACE\s*<\/div>/g;

content = content.replace(workspaceTitleRegex, '<div></div>');

// Remove AI CLAUSE TUNER TERMINAL
// We need to match from {/* AI Rewrite Terminal ... */} down to </div> right before {/* Standard Text Area ... */}
const tunerTerminalRegex = /\s*\{\/\* AI Rewrite Terminal integrated inside the active editing segment \*\/\}[\s\S]*?(?=\s*\{\/\* Standard Text Area for Human draft revision \*\/\}|\s*<div className="p-5 flex-1 space-y-4 bg-\[#041326\]\/40">)/;

content = content.replace(tunerTerminalRegex, '');

fs.writeFileSync('./components/ContractStudio.tsx', content);
