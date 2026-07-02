const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const target = "        {/* CENTER PANEL - AI Generated + Human Revised Workspace */}\\n        <div className={`shrink-0 border-r border-[#2B3347] flex bg-[#171B26] shadow-sm z-10 relative transition-all duration-300 ${sidebarCollapsed ? 'flex-[1.6]' : 'flex-[1.4]'} ${showHistorySidebar ? 'flex-[2]' : ''}`}>";

const replacement = "        {/* CENTER PANEL - AI Generated + Human Revised Workspace */}\\n        <div className={`shrink-0 border-r border-[#2B3347] flex bg-[#171B26] shadow-sm z-10 relative transition-all duration-300 ${sidebarCollapsed ? 'flex-[1.6]' : 'flex-[1.4]'} ${showHistorySidebar ? 'flex-[2]' : ''} ${showPdfPreviewOverlay ? '!hidden' : ''}`}>";

content = content.replace(target, replacement);

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated center panel visibility");
