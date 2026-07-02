const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const regex = /<div className="border-b border-slate-200 pb-1\.5 col-span-2">\s*<div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-1">Document Fingerprint \(SHA-256\)<\/div>\s*<div className="font-mono text-slate-600 break-all">\s*0x\{Array.from\(activeContractId \|\| "uF7iCaQ3Gaosw1jxzLKr"\).reduce\(\(hash, char\) => Math.imul\(31, hash\) \+ char.charCodeAt\(0\) \| 0, 0\).toString\(16\).replace\(\/\^-\/, ""\)\}4be235de19f0e4fb130\s*<\/div>\s*<\/div>\s*<\/div>\s*<div className="pt-3">\s*<div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-2">Immutable Ledger Record<\/div>\s*<ul className="space-y-1\.5 font-mono text-\[9px\] text-slate-600">\s*<li className="flex items-center"><span className="mr-2 text-slate-400">•<\/span> Record Initialized: \{contractFields\?\.createdAt \? new Date\(contractFields\.createdAt\)\.toISOString\(\)\.replace\("T", " "\)\.substring\(0, 16\) : "2026-06-27 15:03"\} UTC<\/li>\s*<li className="flex items-center"><span className="mr-2 text-slate-400">•<\/span> Final Approval: \{contractFields\?\.updatedAt \? new Date\(contractFields\.updatedAt\)\.toISOString\(\)\.replace\("T", " "\)\.substring\(0, 16\) : "2026-06-27 15:48"\} UTC<\/li>\s*<li className="flex items-center"><span className="mr-2 text-slate-400">•<\/span> Document Locked: \{isExecuted \? \(contractFields\?\.updatedAt \? new Date\(contractFields\.updatedAt\)\.toISOString\(\)\.replace\("T", " "\)\.substring\(0, 16\) : "2026-06-27 15:49"\) : "PENDING EXECUTION"\} \{isExecuted \? "UTC" : ""\}<\/li>/g;

const replaceWith = `<div className="border-b border-slate-200 pb-1.5 col-span-2">
                                  <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-1">Document Fingerprint (SHA-256)</div>
                                  <div className="font-mono text-slate-600 break-all">
                                    0x{(Array.from(activeContractId || "uF7iCaQ3Gaosw1jxzLKr").reduce((hash, char) => Math.imul(31, hash) + char.charCodeAt(0) | 0, 0).toString(16).replace(/^-/, "") + "4be235de19f0e4fb13076d8d7cb8f25d17e98f7ab6c9e54e0b8d4f0b321a81c").substring(0, 64)}
                                  </div>
                                </div>
                              </div>
                              <div className="pt-3">
                                <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-2">Immutable Ledger Record</div>
                                <ul className="space-y-1.5 font-mono text-[9px] text-slate-600">
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Record Initialized: {contractFields?.createdAt ? new Date(contractFields.createdAt).toISOString().replace("T", " ").substring(0, 19) : "2026-06-27 15:03:42"} UTC</li>
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Final Approval: {contractFields?.updatedAt ? new Date(contractFields.updatedAt).toISOString().replace("T", " ").substring(0, 19) : "2026-06-27 15:48:11"} UTC</li>
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Document Locked: {isExecuted ? (contractFields?.updatedAt ? new Date(contractFields.updatedAt).toISOString().replace("T", " ").substring(0, 19) : "2026-06-27 15:49:05") : "PENDING EXECUTION"} {isExecuted ? "UTC" : ""}</li>`;

if (content.match(regex)) {
   content = content.replace(regex, replaceWith);
   
   // removing the QR code part
   const qrRegex = /\{qrDataUrl && \([\s\S]*?<img src=\{qrDataUrl\}[^>]*>\s*<span[^>]*>VERIFICATION<br\/>QR LEDGER<\/span>\s*<\/div>\s*\)\}/;
   content = content.replace(qrRegex, '');

   fs.writeFileSync('./components/ContractStudio.tsx', content);
   console.log("Success");
} else {
   console.log("Not found");
}
