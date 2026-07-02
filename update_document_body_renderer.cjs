const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const docBodyRenderer = `
                    {page.type === 'document_body' && (
                      <div className="flex-1 flex flex-col gap-[40px]">
                        {page.sections.map((section, idx) => {
                          const linkedClause = section.clauseId ? clauses.find((c: any) => c.id === section.clauseId) : null;
                          const contentToRender = section.content !== undefined ? section.content : (linkedClause ? linkedClause.content : null);
                          const titleMatch = section.title.match(/Section\\s+(\\d+)/i);
                          const startNum = titleMatch ? parseInt(titleMatch[1], 10) : 1;
                          
                          return (
                            <div key={section.id} className="page-break-inside-avoid">
                              <h2 className="font-manrope font-semibold text-[16pt] uppercase mb-[16px] border-b border-slate-200 pb-2 flex justify-between text-black break-after-avoid page-break-after-avoid">
                                <span>{section.title.toUpperCase()}</span>
                              </h2>
                              
                              <div className="space-y-6">
                                {contentToRender && (
                                  <div className="text-slate-900">
                                    <LegalMarkdown content={contentToRender} startNumber={startNum} />
                                  </div>
                                )}
                                
                                <div className="space-y-4">
                                  {section.id === "Commercial Foundation" && (
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                      <div className="space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Agreement Type</p>
                                        <p className="font-bold text-slate-900">{foundation.type}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Transaction Value</p>
                                        <p className="font-bold text-[#00D4FF]">{foundation.currency} {foundation.value}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Duration</p>
                                        <p className="font-bold text-slate-900">{foundation.duration}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Jurisdiction</p>
                                        <p className="font-bold text-slate-900">{jurisdiction.law}</p>
                                      </div>
                                    </div>
                                  )}

                                  {section.id === "Parties" && (
                                    <div className="space-y-4 my-6">
                                      <div className="p-4 bg-slate-50 rounded border border-slate-200">
                                        <div className="text-[9px] text-slate-400 uppercase font-bold mb-2 tracking-wider">Party A (Seller)</div>
                                        <div className="font-bold text-slate-900">{partyA.name}</div>
                                        <div className="text-[10px] text-slate-600 mt-1">{partyA.address}</div>
                                      </div>
                                      <div className="p-4 bg-slate-50 rounded border border-slate-200">
                                        <div className="text-[9px] text-slate-400 uppercase font-bold mb-2 tracking-wider">Party B (Buyer)</div>
                                        <div className="font-bold text-slate-900">{partyB.name}</div>
                                        <div className="text-[10px] text-slate-600 mt-1">{partyB.address}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
`;

content = content.replace(
  /\{page\.type === 'section' && \(/,
  docBodyRenderer + "\n                    {page.type === 'section' && ("
);

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Updated document body renderer");
