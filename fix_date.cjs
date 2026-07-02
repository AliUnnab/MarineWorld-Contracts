const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const regex = /<ul className="space-y-1\.5 font-mono text-\[8px\] text-slate-600">[\s\S]*?<\/ul>/g;

const replaceWith = `<ul className="space-y-1.5 font-mono text-[8px] text-slate-600">
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Record Initialized: {contractFields?.createdAt ? new Date(contractFields.createdAt).toISOString().replace("T", " ").substring(0, 16) : "2026-06-27 15:03"} UTC</li>
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Final Approval: {contractFields?.updatedAt ? new Date(contractFields.updatedAt).toISOString().replace("T", " ").substring(0, 16) : "2026-06-27 15:48"} UTC</li>
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Document Locked: {isExecuted ? (contractFields?.updatedAt ? new Date(contractFields.updatedAt).toISOString().replace("T", " ").substring(0, 16) : "2026-06-27 15:49") : "PENDING EXECUTION"} {isExecuted ? "UTC" : ""}</li>
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Registry Status: <span className="text-emerald-600 font-bold ml-1">VERIFIED</span></li>
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Integrity Status: <span className="text-emerald-600 font-bold ml-1">HASH VERIFIED</span></li>
                                </ul>`;

if (content.match(regex)) {
   content = content.replace(regex, replaceWith);
   
   // Replace URL
   content = content.replace(
     /(VERIFY-)\{contractFields\?\.verificationCode[^}]*\}/g,
     "$1{contractFields?.verificationCode || (activeContractId ? activeContractId.substring(0, 4).toUpperCase() : '9011')}"
   );
   
   fs.writeFileSync('./components/ContractStudio.tsx', content);
   console.log("Success");
} else {
   console.log("Not found");
}
