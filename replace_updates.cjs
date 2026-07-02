const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

content = content.replaceAll(
  `const contractRef = doc(db, "contracts", activeContractId);\n          await updateDoc(contractRef,`,
  `await RegistryTransactionService.autoSaveDraft(activeContractId,`
);

content = content.replaceAll(
  `const contractRef = doc(db, "contracts", activeContractId);\n        await updateDoc(contractRef,`,
  `await RegistryTransactionService.autoSaveDraft(activeContractId,`
);

fs.writeFileSync('./components/ContractStudio.tsx', content);
