const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// Replace Party A block
const partyAOld = `<div className="pt-4 relative flex flex-col justify-end min-h-\\[90px\\]">
                                          \\{partyASigned \\? \\(
                                            <div className="absolute top-\\[-45px\\] left-2 select-none pointer-events-none w-full flex flex-col">
                                              \\{\\/\\* Verified Badge \\*\\/\\}
                                              <div className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"><\\/span>
                                                <span className="text-\\[7\\.5px\\] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 rounded px-1\\.5 py-0\\.5 shadow-sm">
                                                  ✓ APPROVED & SECURED
                                                <\\/span>
                                              <\\/div>
                                              <span className="text-\\[6\\.5px\\] text-slate-400 font-mono mt-0\\.5">
                                                TIMESTAMP: \\{foundation\\.effectiveDate \\|\\| '2026-06-14'\\} 10:14 UTC \\| IP: 194\\.22\\.81\\.41
                                              <\\/span>
                                            <\\/div>
                                          \\) : \\(
                                            <div className="absolute top-\\[-25px\\] left-0 text-\\[8\\.5px\\] text-slate-400 italic font-mono flex items-center gap-1\\.5">
                                              <span className="w-1\\.5 h-1\\.5 rounded-full bg-amber-450"><\\/span> Pending Signature Execution
                                            <\\/div>
                                          \\)\\}
                                          
                                          <div className="text-\\[10px\\] font-bold uppercase tracking-widest text-slate-900">\\{partyA\\.name\\}<\\/div>
                                          <div className="text-\\[8px\\] text-slate-500 uppercase mt-0\\.5 font-medium">Authorized Signatory \\(\\{partyA\\.role \\|\\| 'Seller'\\}\\)<\\/div>
                                        <\\/div>`;

const partyANew = `<div className="flex flex-col min-h-[70px]">
                                          {partyASigned ? (
                                            <div className="flex flex-col mb-2">
                                              <div className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                <span className="text-[7.5px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 shadow-sm">
                                                  ✓ APPROVED & SECURED
                                                </span>
                                              </div>
                                              <span className="text-[6.5px] text-slate-400 font-mono mt-0.5">
                                                TIMESTAMP: {foundation.effectiveDate || '2026-06-14'} 10:14 UTC | IP: 194.22.81.41
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="text-[8.5px] text-slate-400 italic font-mono flex items-center gap-1.5 mb-2">
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-450"></span> Pending Signature Execution
                                            </div>
                                          )}
                                          
                                          <div className="mt-auto border-t border-slate-200 pt-2">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-900">{partyA.name}</div>
                                            <div className="text-[8px] text-slate-500 uppercase mt-0.5 font-medium">Authorized Signatory ({partyA.role || 'Seller'})</div>
                                          </div>
                                        </div>`;

content = content.replace(new RegExp(partyAOld), partyANew);


// Replace Party B block
const partyBOld = `<div className="pt-4 relative flex flex-col justify-end min-h-\\[90px\\]">
                                          \\{partyBSigned \\? \\(
                                            <div className="absolute top-\\[-45px\\] left-2 select-none pointer-events-none w-full flex flex-col">
                                              \\{\\/\\* Verified Badge \\*\\/\\}
                                              <div className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"><\\/span>
                                                <span className="text-\\[7\\.5px\\] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 rounded px-1\\.5 py-0\\.5 shadow-sm">
                                                  ✓ APPROVED & SECURED
                                                <\\/span>
                                              <\\/div>
                                              <span className="text-\\[6\\.5px\\] text-slate-400 font-mono mt-0\\.5">
                                                TIMESTAMP: \\{foundation\\.effectiveDate \\|\\| '2026-06-14'\\} 10:14 UTC \\| IP: 81\\.109\\.112\\.59
                                              <\\/span>
                                            <\\/div>
                                          \\) : \\(
                                            <div className="absolute top-\\[-25px\\] left-0 text-\\[8\\.5px\\] text-slate-400 italic font-mono flex items-center gap-1\\.5">
                                              <span className="w-1\\.5 h-1\\.5 rounded-full bg-amber-450"><\\/span> Pending Signature Execution
                                            <\\/div>
                                          \\)\\}
                                          
                                          <div className="text-\\[10px\\] font-bold uppercase tracking-widest text-slate-900">\\{partyB\\.name\\}<\\/div>
                                          <div className="text-\\[8px\\] text-slate-500 uppercase mt-0\\.5 font-medium">Authorized Signatory \\(\\{partyB\\.role \\|\\| 'Buyer'\\}\\)<\\/div>
                                        <\\/div>`;
                                        
const partyBNew = `<div className="flex flex-col min-h-[70px]">
                                          {partyBSigned ? (
                                            <div className="flex flex-col mb-2">
                                              <div className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                <span className="text-[7.5px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 shadow-sm">
                                                  ✓ APPROVED & SECURED
                                                </span>
                                              </div>
                                              <span className="text-[6.5px] text-slate-400 font-mono mt-0.5">
                                                TIMESTAMP: {foundation.effectiveDate || '2026-06-14'} 10:14 UTC | IP: 81.109.112.59
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="text-[8.5px] text-slate-400 italic font-mono flex items-center gap-1.5 mb-2">
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-450"></span> Pending Signature Execution
                                            </div>
                                          )}
                                          
                                          <div className="mt-auto border-t border-slate-200 pt-2">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-900">{partyB.name}</div>
                                            <div className="text-[8px] text-slate-500 uppercase mt-0.5 font-medium">Authorized Signatory ({partyB.role || 'Buyer'})</div>
                                          </div>
                                        </div>`;

content = content.replace(new RegExp(partyBOld), partyBNew);


// Replace Additional Signatories
const addOld = `<div key=\\{idx\\} className="pt-4 relative flex flex-col justify-end min-h-\\[90px\\]">
                                              \\{isPartySigned \\? \\(
                                                <div className="absolute top-\\[-45px\\] left-2 select-none pointer-events-none w-full flex flex-col">
                                                  \\{\\/\\* Verified Badge \\*\\/\\}
                                                  <div className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"><\\/span>
                                                    <span className="text-\\[7\\.5px\\] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 rounded px-1\\.5 py-0\\.5 shadow-sm">
                                                      ✓ APPROVED & SECURED
                                                    <\\/span>
                                                  <\\/div>
                                                  <span className="text-\\[6\\.5px\\] text-slate-400 font-mono mt-0\\.5">
                                                    TIMESTAMP: \\{foundation\\.effectiveDate \\|\\| '2026-06-14'\\} 10:14 UTC \\| IP: 104\\.18\\.23\\.95
                                                  <\\/span>
                                                <\\/div>
                                              \\) : \\(
                                                <div className="absolute top-\\[-25px\\] left-0 text-\\[8\\.5px\\] text-slate-400 italic font-mono flex items-center gap-1\\.5">
                                                  <span className="w-1\\.5 h-1\\.5 rounded-full bg-amber-450"><\\/span> Pending Signature Execution
                                                <\\/div>
                                              \\)\\}
                                              
                                              <div className="text-\\[10px\\] font-bold uppercase tracking-widest text-slate-900">\\{p\\.name\\}<\\/div>
                                              <div className="text-\\[8px\\] text-slate-500 uppercase mt-0\\.5 font-medium">Authorized Signatory \\(\\{p\\.role \\|\\| 'Additional Party'\\}\\)<\\/div>
                                            <\\/div>`;
                                            
const addNew = `<div key={idx} className="flex flex-col min-h-[70px]">
                                              {isPartySigned ? (
                                                <div className="flex flex-col mb-2">
                                                  <div className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    <span className="text-[7.5px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 shadow-sm">
                                                      ✓ APPROVED & SECURED
                                                    </span>
                                                  </div>
                                                  <span className="text-[6.5px] text-slate-400 font-mono mt-0.5">
                                                    TIMESTAMP: {foundation.effectiveDate || '2026-06-14'} 10:14 UTC | IP: 104.18.23.95
                                                  </span>
                                                </div>
                                              ) : (
                                                <div className="text-[8.5px] text-slate-400 italic font-mono flex items-center gap-1.5 mb-2">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-450"></span> Pending Signature Execution
                                                </div>
                                              )}
                                              
                                              <div className="mt-auto border-t border-slate-200 pt-2">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-900">{p.name}</div>
                                                <div className="text-[8px] text-slate-500 uppercase mt-0.5 font-medium">Authorized Signatory ({p.role || 'Additional Party'})</div>
                                              </div>
                                            </div>`;
                                            
content = content.replace(new RegExp(addOld), addNew);

fs.writeFileSync('./components/ContractStudio.tsx', content);
