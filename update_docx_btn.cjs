const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const t2 = '<button onClick={handleDownload} className="hover:text-[#00D4FF] transition-colors cursor-pointer" title="Download PDF"><Download size={14} /></button>';
const r2 = '<button onClick={handleDownload} className="hover:text-[#00D4FF] transition-colors cursor-pointer" title="Download PDF"><Download size={14} /></button>\\n                  <button onClick={handleExportDocx} className="hover:text-[#00D4FF] transition-colors cursor-pointer" title="Export DOCX"><Download size={14} /></button>';
content = content.replace(t2, r2);

const regex1 = /<span>Download PDF<\/span>\s*<\/button>/;
const r1 = '<span>Download PDF</span>\\n                    </button>\\n                    <button \\n                      onClick={handleExportDocx}\\n                      className="bg-[#6B7280] hover:bg-[#4B5563] text-white font-manrope font-extrabold uppercase tracking-widest text-[9px] py-1.5 px-3.5 rounded flex items-center gap-1.5 transition-all cursor-pointer border border-[#4B5563]"\\n                    >\\n                      <Download size={11} />\\n                      <span>Export DOCX</span>\\n                    </button>';
content = content.replace(regex1, r1);

const regex3 = /<Download size=\{13\} \/> DOWNLOAD AGREEMENT\s*<\/button>/;
const r3 = '<Download size={13} /> DOWNLOAD AGREEMENT\\n                  </button>\\n                  <button \\n                    onClick={handleExportDocx} \\nclassName="w-full mt-3 bg-[#6B7280]/10 hover:bg-[#6B7280]/25 border border-[#6B7280]/30 text-[#6B7280] hover:text-[#6B7280] shadow-[0_0_15px_rgba(107,114,128,0.1)] font-bold tracking-widest uppercase text-[10px] py-3.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(107,114,128,0.15)] cursor-pointer font-sans"\\n                  >\\n                    <Download size={13} /> EXPORT DOCX\\n                  </button>';
content = content.replace(regex3, r3);

fs.writeFileSync('./components/ContractStudio.tsx', content);
