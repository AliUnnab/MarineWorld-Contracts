const fs = require('fs');
let content = fs.readFileSync('./src/components/VerificationView.tsx', 'utf8');

content = content.replace(
  `import React, { useState } from 'react';`,
  `import React, { useState, useEffect } from 'react';`
);

content = content.replace(
  `const handleVerify = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!searchQuery.trim()) return;`,
  `const handleVerify = async (e?: React.FormEvent, overrideQuery?: string) => {\n    if (e) e.preventDefault();\n    const qry = overrideQuery || searchQuery;\n    if (!qry.trim()) return;`
);

content = content.replace(
  `if (searchQuery.startsWith('0x')) {`,
  `if (qry.startsWith('0x')) {`
);

content = content.replace(
  `q = query(collection(db, 'contracts'), where('documentHash', '==', searchQuery));`,
  `q = query(collection(db, 'contracts'), where('documentHash', '==', qry));`
);

content = content.replace(
  `q = query(collection(db, 'contracts'), where('contractFields.verificationCode', '==', searchQuery));`,
  `q = query(collection(db, 'contracts'), where('contractFields.verificationCode', '==', qry));`
);

content = content.replace(
  `const idQuery = query(collection(db, 'contracts'), where('__name__', '==', searchQuery));`,
  `const idQuery = query(collection(db, 'contracts'), where('__name__', '==', qry));`
);

const effect = `
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/verify/') && path.length > 8) {
      let code = path.substring(8);
      if (code.startsWith('VERIFY-')) {
        code = code.substring(7);
      }
      setSearchQuery(code);
      if (code.length > 3) {
         setTimeout(() => handleVerify(undefined, code), 500);
      }
    }
  }, []);
`;

content = content.replace(
  `export const VerificationView: React.FC = () => {\n  const [searchQuery, setSearchQuery] = useState('');`,
  `export const VerificationView: React.FC = () => {\n  const [searchQuery, setSearchQuery] = useState('');\n${effect}`
);

fs.writeFileSync('./src/components/VerificationView.tsx', content);
