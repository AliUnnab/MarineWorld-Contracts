const fs = require('fs');
let content = fs.readFileSync('./components/ContractStudio.tsx', 'utf8');

// 1. Add import
if (!content.includes('RegistryTransactionService')) {
  content = content.replace("import { CreditService } from '../services/credit-service';", "import { CreditService } from '../services/credit-service';\nimport { RegistryTransactionService } from '../services/registry-transaction-service';");
}

// 2. Replace handleExecute
const startStr = "const handleExecute = async (validationCost: number = 0) => {";
const startIdx = content.indexOf(startStr);

if (startIdx !== -1) {
  // Let's use a regex to replace the function, or write a custom replacement
  // We need to find the matching closing brace.
  let openBraces = 0;
  let endIdx = -1;
  let inString = false;
  let stringChar = '';

  for (let i = startIdx; i < content.length; i++) {
    const char = content[i];
    
    // Ignore braces inside strings
    if (inString) {
      if (char === stringChar && content[i - 1] !== '\\') {
        inString = false;
      }
      continue;
    }
    
    if (char === "'" || char === '"' || char === '`') {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === '{') openBraces++;
    if (char === '}') {
      openBraces--;
      if (openBraces === 0) {
        endIdx = i;
        break;
      }
    }
  }
  
  if (endIdx !== -1) {
    const newHandleExecute = `const handleExecute = async (validationCost: number = 0) => {
    if (!isPaymentMethodValid) {
      console.error("Hata: Firmanın ödeme yöntemi geçerli değil veya yetkilendirilmemiş!");
      return;
    }

    const cost = validationCost;
    if (company?.id) {
      const hasCredits = await CreditService.checkBalance(company.id, cost);
      if (!hasCredits) {
        setShowBillingWallModal(true);
        return;
      }
    }

    setSaveStatus('saving');

    const result = await RegistryTransactionService.executeDeployment({
      companyId: company?.id,
      activeContractId,
      cost,
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
      fullySignedAdditional: additionalParties.reduce((acc, p, idx) => ({ ...acc, [p.id || idx]: true }), {}),
      userId: auth.currentUser?.uid || 'anonymous',
      userEmail: auth.currentUser?.email || ''
    });

    if (!result.success) {
      if (result.error === 'Insufficient credits.') {
        setShowBillingWallModal(true);
      } else {
        console.error("Deployment failed:", result.error);
        alert("Deployment failed: " + result.error);
      }
      setSaveStatus('saved');
      return;
    }

    // Success -> Update local UI State
    if (cost > 0) {
      setCreditsBalance(prev => prev - cost);
    }
    
    setDocumentHash(result.hash);
    setPartyASigned(true);
    setPartyBSigned(true);
    setAdditionalSigned(additionalParties.reduce((acc, p, idx) => ({ ...acc, [p.id || idx]: true }), {}));
    setIsExecuted(true);
    
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);

    // Refresh UI
    handleRefresh();
  };`;
    
    content = content.substring(0, startIdx) + newHandleExecute + content.substring(endIdx + 1);
    fs.writeFileSync('./components/ContractStudio.tsx', content);
    console.log("Replaced handleExecute successfully");
  } else {
    console.log("Could not find matching closing brace");
  }
} else {
  console.log("Could not find handleExecute");
}
