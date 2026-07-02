const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// Hide LEFT PANEL
content = content.replace(
  /<div className={\`print:hidden shrink-0 border-r border-\\[#2B3347\\] flex flex-col bg-\\[#071326\\] text-slate-300 transition-all duration-300 \\$\\{sidebarCollapsed \? 'w-\\[72px\\]' : 'w-\\[140px\\]'\\}\`}>/g,
  `<div className={\`print:hidden shrink-0 border-r border-[#2B3347] flex flex-col bg-[#071326] text-slate-300 transition-all duration-300 \${sidebarCollapsed ? 'w-[72px]' : 'w-[140px]'} \${showPdfPreviewOverlay ? '!hidden' : ''}\`}>`
);

// Hide CENTER PANEL
content = content.replace(
  /<div className={\`shrink-0 border-r border-\\[#2B3347\\] flex bg-\\[#171B26\\] shadow-sm z-10 relative transition-all duration-300 \\$\\{sidebarCollapsed \? 'flex-\\[1\\.6\\]' : 'flex-\\[1\\.4\\]'\\} \\$\\{showHistorySidebar \? 'flex-\\[2\\]' : ''\\}\`}>/g,
  `<div className={\`shrink-0 border-r border-[#2B3347] flex bg-[#171B26] shadow-sm z-10 relative transition-all duration-300 \${sidebarCollapsed ? 'flex-[1.6]' : 'flex-[1.4]'} \${showHistorySidebar ? 'flex-[2]' : ''} \${showPdfPreviewOverlay ? '!hidden' : ''}\`}>`
);

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated center and left panels to hide on preview");
