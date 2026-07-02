const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// Hide the left panel when previewing
content = content.replace(
  /<div className="w-\[320px\] lg:w-\[420px\] flex flex-col shrink-0 relative z-10 print:hidden border-r border-slate-200 bg-white">/g,
  `<div className={\`w-[320px] lg:w-[420px] flex flex-col shrink-0 relative z-10 print:hidden border-r border-slate-200 bg-white \${showPdfPreviewOverlay ? 'hidden' : ''}\`}>`
);

// We also need to fix the right panel classes
const rightPanelTarget = `        <div className={\`bg-[#0b0f19] flex flex-col min-w-0 transition-all duration-300 \${
          showPdfPreviewOverlay 
            ? 'fixed inset-0 z-[99999] bg-[#171B26] h-screen' 
            : 'flex-[1.5] border-l border-[#2B3347] relative overflow-hidden h-full'
        }\`}>`;

const rightPanelReplacement = `        <div className={\`bg-[#0b0f19] flex flex-col min-w-0 transition-all duration-300 \${
          showPdfPreviewOverlay 
            ? 'flex-1 bg-[#171B26] h-full relative overflow-hidden' 
            : 'flex-[1.5] border-l border-[#2B3347] relative overflow-hidden h-full'
        }\`}>`;

content = content.replace(rightPanelTarget, rightPanelReplacement);

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated layout to fix simulation portal visibility");
