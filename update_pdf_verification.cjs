const fs = require('fs');

let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// 1. Add 'verification' to pdfStructure
const returnStructureIndex = content.indexOf('return structure;\n  }, [');
if (returnStructureIndex !== -1) {
  const codeToInsert = `
    if (dbStatus === 'executed') {
      structure.push({ title: "Official Immutable Contract Record", id: "VerificationRecord", type: "verification" });
    }
    `;
  content = content.substring(0, returnStructureIndex) + codeToInsert + content.substring(returnStructureIndex);
} else {
  console.log("Could not find return structure;");
}

// 2. Extract the Enhanced Header metadata bar
const headerStart = content.indexOf('{/* Enhanced Header metadata bar */}');
const headerEnd = content.indexOf('{/* Centered Document Title */}');

if (headerStart !== -1 && headerEnd !== -1) {
  let headerBlock = content.substring(headerStart, headerEnd);
  
  // Replace the URL as requested
  headerBlock = headerBlock.replace('https://contracts.marineworld.ai/verify/', 'https://contract.marineworld.city/verify/');
  
  // Remove it from the title page
  content = content.substring(0, headerStart) + content.substring(headerEnd);
  
  // Wrap it in the verification page
  const verificationPageStr = `
                    {page.type === 'verification' && (
                      <div className="flex-1 flex flex-col justify-center">
                        ${headerBlock}
                        <div className="mt-8 text-center text-[10px] text-slate-500 max-w-lg mx-auto leading-relaxed">
                          This page serves as the official immutable ledger record. All cryptographic proofs and network states are securely anchored to the provided Verification URL.
                        </div>
                      </div>
                    )}
  `;
  
  const footerIndex = content.indexOf('<PageFooter />');
  if (footerIndex !== -1) {
    content = content.substring(0, footerIndex) + verificationPageStr + content.substring(footerIndex);
  } else {
    console.log("Could not find <PageFooter />");
  }
} else {
  console.log("Could not find Enhanced Header metadata bar");
}

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Successfully updated ContractStudio.tsx for verification page.");
