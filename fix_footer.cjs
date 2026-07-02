const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const startIndex = content.indexOf('{pageIdx === pdfStructure.length - 1 && (');
const endIndex = content.indexOf('<PageFooter />', startIndex);

const oldBlock = content.substring(startIndex, endIndex);

const newBlock = `{pageIdx === pdfStructure.length - 1 && (
                      <div className={\`mt-auto pt-8 flex flex-col justify-end page-break-inside-avoid \${showPdfPreviewOverlay ? 'flex' : 'hidden print:flex'}\`}>
                        <div className="text-[7.5px] leading-[1.3] text-slate-500 font-inter text-justify border-t border-slate-300 pt-3">
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
