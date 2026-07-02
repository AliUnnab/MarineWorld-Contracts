const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const target = `        <div className={\`bg-[#0b0f19] flex flex-col min-w-0 transition-all duration-300 \${
          showPdfPreviewOverlay 
            ? 'flex-1 bg-[#171B26] h-full relative overflow-hidden' 
            : 'flex-[1.5] border-l border-[#2B3347] relative overflow-hidden h-full'
        }\`}>`;

const replacement = `        <div className={\`bg-[#0b0f19] flex flex-col min-w-0 transition-all duration-300 \${
          showPdfPreviewOverlay 
            ? 'fixed inset-0 z-[99999] bg-[#171B26] h-screen w-screen !border-l-0 overflow-y-auto' 
            : 'flex-[1.5] border-l border-[#2B3347] relative overflow-hidden h-full'
        }\`}>`;

content = content.replace(target, replacement);

fs.writeFileSync('./components/ContractStudio.tsx', content);
