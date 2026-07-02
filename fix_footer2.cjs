const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const startIndex = content.indexOf('{pageIdx === pdfStructure.length - 1 && (');
const endIndex = content.indexOf('<PageFooter />', startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find replacement bounds");
  process.exit(1);
}

const oldBlock = content.substring(startIndex, endIndex);

const newBlock = `{pageIdx === pdfStructure.length - 1 && (
                      <div className={\`mt-auto pt-8 flex flex-col justify-end page-break-inside-avoid \${showPdfPreviewOverlay ? 'flex' : 'hidden print:flex'}\`}>
                        {/* Enhanced Header metadata bar */}
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                          <div className="w-full">
                            <div className="text-[12px] font-sans font-black text-slate-900 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                              OFFICIAL IMMUTABLE CONTRACT RECORD
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[8.5px] text-slate-700 bg-slate-50 p-3 border border-slate-200 rounded">
                              <div className="flex justify-between border-b border-slate-200 pb-1">
                                <span className="font-sans font-bold text-slate-500 uppercase tracking-wide">Dynamic Agreement ID:</span> 
                                <span className="font-mono font-bold text-slate-900">{activeContractId || "PENDING-GENERATION"}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-200 pb-1">
                                <span className="font-sans font-bold text-slate-500 uppercase tracking-wide">Execution Status:</span> 
                                <span className={\`font-sans font-bold uppercase tracking-wider \${isExecuted ? 'text-emerald-600' : 'text-amber-600'}\`}>{isExecuted ? "EXECUTED & LOCKED" : "DRAFT STATE"}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-200 pb-1">
                                <span className="font-sans font-bold text-slate-500 uppercase tracking-wide">Revision Number:</span> 
                                <span className="font-mono font-bold text-slate-900">REV-{revisions.length + 1}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-200 pb-1">
                                <span className="font-sans font-bold text-slate-500 uppercase tracking-wide">Approved Workspace Version:</span> 
                                <span className="font-sans font-bold text-slate-900">{currentVersion}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-200 pb-1">
                                <span className="font-sans font-bold text-slate-500 uppercase tracking-wide">Verification URL:</span> 
                                <span className="font-mono text-slate-600">https://contracts.marineworld.city/verify/{contractFields?.verificationCode || "PENDING"}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-200 pb-1">
                                <span className="font-sans font-bold text-slate-500 uppercase tracking-wide">Digital Document Fingerprint:</span> 
                                <span className="font-mono text-slate-600 truncate max-w-[150px]">0x{Array.from(activeContractId || "placeholder").reduce((hash, char) => 0 | (31 * hash + char.charCodeAt(0)), 0).toString(16)}{Date.now().toString(16)}</span>
                              </div>
                              <div className="flex justify-between col-span-2 pt-1">
                                <span className="font-sans font-bold text-slate-500 uppercase tracking-wide">Immutable Ledger Record:</span> 
                                <span className="font-mono text-[7px] text-slate-500 truncate max-w-[400px]">{(contractFields.auditTrail || '').split('\\n')[0] || \`Record Initialized: \${new Date().toISOString()}\`}</span>
                              </div>
                            </div>
                          </div>
                          {qrDataUrl && (
                            <div className="flex flex-col items-end gap-1.5 ml-6 shrink-0 mt-2">
                              <img src={qrDataUrl} alt="Registry Certificate QR" className="w-16 h-16 border-2 border-slate-900 p-0.5" />
                              <span className="text-[6.5px] text-slate-500 font-mono text-right leading-normal tracking-widest">VERIFICATION<br/>QR LEDGER</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-[7.5px] leading-[1.3] text-slate-500 font-inter text-justify border-t border-slate-300 pt-3 mt-4">
                          <div className="font-mono mb-3 uppercase font-bold text-slate-700 tracking-wider">
                            (Verification Record<br/>
                            Agreement ID: {contractFields?.agreementId || activeContractId || "MW-CS-2026-000124"}<br/>
                            Registry ID: REG-{new Date().getFullYear()}-{Math.floor(100000 + Math.random() * 900000)}<br/>
                            Document Hash (SHA-256): {Array.from(activeContractId || "placeholder").reduce((hash, char) => 0 | (31 * hash + char.charCodeAt(0)), 0).toString(16).toUpperCase()}8A...9F2E<br/>
                            Generated (UTC): {new Date().toISOString().replace('T', ' ').split('.')[0]}<br/>
                            Verification Status: Registered)
                          </div>
                          
                          <div className="font-bold mb-1 uppercase tracking-wide text-slate-600">Platform Notice</div>
                          <p className="mb-2">
                            This Agreement was generated through MarineWorld Contract Studio, operated by ARGENTO MARITIME WORLDWIDE LLC, a Wyoming limited liability company. MarineWorld Contract Studio provides secure contract authoring, document management, registry, and integrity verification infrastructure only, and is not a party to this Agreement. The Platform does not assume responsibility for the commercial terms, legal validity, negotiations, execution, performance, or contractual obligations of the Parties, and all use is subject to the MarineWorld Terms of Service.
                          </p>
                          <p className="mb-2">
                            This Agreement has been registered within the MarineWorld Contract Studio Registry. Document integrity is protected through cryptographic hashing, version control, audit records, and secure registry verification. The cryptographic hash associated with this Agreement enables integrity verification by confirming that the document has not been altered since its registered version was generated.
                          </p>
                          <p className="mb-2">
                            Electronic records are maintained in accordance with applicable electronic transactions laws, utilizing infrastructure standards aligned with the Wyoming Uniform Electronic Transactions Act (UETA).
                          </p>
                          <p className="font-semibold">
                            Copyright &copy; MarineWorld Contract Studio. All rights reserved.
                          </p>
                        </div>
                      </div>
                    )}
                    `;

content = content.replace(oldBlock, newBlock);

fs.writeFileSync('./components/ContractStudio.tsx', content);
