const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// The main layout has a few sidebars. 
content = content.replace(
  /<div className={`shrink-0 border-r border-\[#2B3347\] flex flex-col bg-\[#071326\] text-slate-300 transition-all duration-300 \${sidebarCollapsed \? 'w-\[72px\]' : 'w-\[140px\]'}`}>\s*<div/g,
  '<div className={`print:hidden shrink-0 border-r border-[#2B3347] flex flex-col bg-[#071326] text-slate-300 transition-all duration-300 ${sidebarCollapsed ? \'w-[72px]\' : \'w-[140px]\'}`}>\n          <div'
);

content = content.replace(
  /<div className={`shrink-0 border-r border-\[#2B3347\] flex bg-\[#171B26\] shadow-sm z-10 relative transition-all duration-300 \${sidebarCollapsed \? 'flex-\[1\.6\]' : 'flex-\[1\.4\]'} \${showHistorySidebar \? 'flex-\[2\]' : ''}`}>\s*<div/g,
  '<div className={`print:hidden shrink-0 border-r border-[#2B3347] flex bg-[#171B26] shadow-sm z-10 relative transition-all duration-300 ${sidebarCollapsed ? \'flex-[1.6]\' : \'flex-[1.4]\'} ${showHistorySidebar ? \'flex-[2]\' : \'\'}`}>\n          <div'
);

// We need to hide the toolbars at the top of the PDF container.
content = content.replace(
  /<div className={`border-b shrink-0 flex items-center justify-between px-6 z-\[10000\] /g,
  '<div className={`print:hidden border-b shrink-0 flex items-center justify-between px-6 z-[10000] '
);

// We should also remove the black/gray background on the pdf container in print mode
content = content.replace(
  /<div id="contract-pages-container" className="flex-1 overflow-auto pt-20 pb-20 px-8 flex flex-col items-center bg-\[#0b0f19\] min-w-0 font-sans">/g,
  '<div id="contract-pages-container" className="flex-1 overflow-auto print:overflow-visible print:pt-0 print:pb-0 print:px-0 pt-20 pb-20 px-8 flex flex-col items-center bg-[#0b0f19] print:bg-white min-w-0 font-sans">'
);

// Also the zoom wrapper:
content = content.replace(
  /className={`flex flex-col items-center w-full origin-top transition-all duration-300 \${/g,
  'className={`print:block print:transform-none flex flex-col items-center w-full origin-top transition-all duration-300 ${'
);


fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated ContractStudio print classes");
