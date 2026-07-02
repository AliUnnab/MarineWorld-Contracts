const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

const injectionPoint = `        // 3) Create or update record in contracts collection so it shows up in RepositoryView`;

const newLogic = `        // 3) Generate Canonical Document Fingerprint (SHA-256)
        const dataForHash = {
          title: foundation.title,
          agreementType: foundation.type || 'Service Agreement',
          seller: partyA.name,
          buyer: partyB.name,
          contractValue: foundation.value,
          currency: foundation.currency || 'USD',
          applicableLaw: jurisdiction.law,
          jurisdictionSeat: jurisdiction.seat,
          foundation,
          jurisdiction,
          partyA,
          partyB,
          contractFields,
          participants,
          clauses,
          revisions,
          identityDocs,
          additionalParties,
        };

        const canonicalString = JSON.stringify(dataForHash);
        const msgUint8 = new TextEncoder().encode(canonicalString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const documentHashValue = "0x" + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        setDocumentHash(documentHashValue);

        // 4) Create or update record in contracts collection so it shows up in RepositoryView`;

content = content.replace(injectionPoint, newLogic);

// Add documentHash to the updateDoc payload
content = content.replace(`            additionalSigned: fullySignedAdditional\n          });\n        } else {`, `            additionalSigned: fullySignedAdditional,\n            documentHash: documentHashValue\n          });\n        } else {`);

// Add documentHash to the addDoc payload
content = content.replace(`            additionalSigned: fullySignedAdditional\n          });\n        }\n\n        if (activeContractId) {`, `            additionalSigned: fullySignedAdditional,\n            documentHash: documentHashValue\n          });\n        }\n\n        if (activeContractId) {`);

fs.writeFileSync('./components/ContractStudio.tsx', content);
console.log("Success");
