const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const t1 = `        {/* LEFT PANEL - Contract Structure (with Collapsible Sidebar and Vertical Milestones) */}
        <div className={\`print:hidden shrink-0 border-r border-[#2B3347] flex flex-col bg-[#071326] text-slate-300 transition-all duration-300 \${sidebarCollapsed ? 'w-[72px]' : 'w-[140px]'}\`}>`;

const r1 = `        {/* LEFT PANEL - Contract Structure (with Collapsible Sidebar and Vertical Milestones) */}
        <div className={\`print:hidden shrink-0 border-r border-[#2B3347] flex flex-col bg-[#071326] text-slate-300 transition-all duration-300 \${sidebarCollapsed ? 'w-[72px]' : 'w-[140px]'} \${showPdfPreviewOverlay ? 'hidden' : ''}\`}>`;

const t2 = `        {/* CENTER PANEL - AI Generated + Human Revised Workspace */}
        <div className={\`shrink-0 border-r border-[#2B3347] flex bg-[#171B26] shadow-sm z-10 relative transition-all duration-300 \${sidebarCollapsed ? 'flex-[1.6]' : 'flex-[1.4]'} \${showHistorySidebar ? 'flex-[2]' : ''}\`}>`;

const r2 = `        {/* CENTER PANEL - AI Generated + Human Revised Workspace */}
        <div className={\`shrink-0 border-r border-[#2B3347] flex bg-[#171B26] shadow-sm z-10 relative transition-all duration-300 \${sidebarCollapsed ? 'flex-[1.6]' : 'flex-[1.4]'} \${showHistorySidebar ? 'flex-[2]' : ''} \${showPdfPreviewOverlay ? 'hidden' : ''}\`}>`;

content = content.replace(t1, r1);
content = content.replace(t2, r2);

fs.writeFileSync('./components/ContractStudio.tsx', content);
