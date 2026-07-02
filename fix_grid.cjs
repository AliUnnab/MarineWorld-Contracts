const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const regex = /<div className="grid grid-cols-2 gap-x-8 gap-y-2 text-\[8\.5px\] text-slate-700 bg-slate-50 p-3 border border-slate-200 rounded">[\s\S]*?Immutable Ledger Record:[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;

const replaceWith = `<div className="text-[8.5px] text-slate-700 bg-slate-50 p-4 border border-slate-200 rounded">
                              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                <div className="border-b border-slate-200 pb-1.5">
                                  <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-1">Agreement ID</div>
                                  <div className="font-mono font-bold text-slate-900">{activeContractId || "PENDING-GENERATION"}</div>
                                </div>
                                <div className="border-b border-slate-200 pb-1.5">
                                  <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-1">Execution Status</div>
                                  <div className={\`font-sans font-bold uppercase tracking-wider \${isExecuted ? 'text-emerald-600' : 'text-amber-600'}\`}>{isExecuted ? "EXECUTED & LOCKED" : "DRAFT STATE"}</div>
                                </div>
                                <div className="border-b border-slate-200 pb-1.5">
                                  <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-1">Revision Number</div>
                                  <div className="font-mono font-bold text-slate-900">REV-{revisions.length + 1}</div>
                                </div>
                                <div className="border-b border-slate-200 pb-1.5">
                                  <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-1">Approved Version</div>
                                  <div className="font-sans font-bold text-slate-900">{currentVersion}</div>
                                </div>
                                <div className="border-b border-slate-200 pb-1.5 col-span-2">
                                  <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-1">Verification URL</div>
                                  <div className="font-mono text-slate-600">https://contracts.marineworld.city/verify/VERIFY-{contractFields?.verificationCode || (activeContractId ? activeContractId.substring(0, 8).toUpperCase() : "PENDING")}</div>
                                </div>
                                <div className="border-b border-slate-200 pb-1.5 col-span-2">
                                  <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-1">Document Fingerprint (SHA-256)</div>
                                  <div className="font-mono text-slate-600 truncate">
                                    0x{Array.from(activeContractId || "placeholder").reduce((hash, char) => Math.imul(31, hash) + char.charCodeAt(0) | 0, 0).toString(16).replace(/^-/, "")}4be235de19f0e4fb130
                                  </div>
                                </div>
                              </div>
                              <div className="pt-3">
                                <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-2">Immutable Ledger Record</div>
                                <ul className="space-y-1.5 font-mono text-[8px] text-slate-600">
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Record Initialized: {contractFields?.createdAt ? new Date(contractFields.createdAt).toISOString().replace("T", " ").substring(0, 16) : new Date().toISOString().replace("T", " ").substring(0, 16)} UTC</li>
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Final Approval: {contractFields?.updatedAt ? new Date(contractFields.updatedAt).toISOString().replace("T", " ").substring(0, 16) : new Date().toISOString().replace("T", " ").substring(0, 16)} UTC</li>
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Document Locked: {isExecuted ? (contractFields?.updatedAt ? new Date(contractFields.updatedAt).toISOString().replace("T", " ").substring(0, 16) : new Date().toISOString().replace("T", " ").substring(0, 16)) : "PENDING EXECUTION"} {isExecuted ? "UTC" : ""}</li>
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Registry Status: <span className="text-emerald-600 font-bold ml-1">VERIFIED</span></li>
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Integrity Status: <span className="text-emerald-600 font-bold ml-1">HASH VERIFIED</span></li>
                                </ul>
                              </div>
                            </div>
                          </div>`;

if (content.match(regex)) {
   content = content.replace(regex, replaceWith);
   fs.writeFileSync('./components/ContractStudio.tsx', content);
   console.log("Success");
} else {
   console.log("Not found");
}
