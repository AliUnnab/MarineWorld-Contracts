const fs = require('fs');
let content = fs.readFileSync('./src/App.tsx', 'utf8');

content = content.replace(
  `const path = window.location.pathname as RoutePath;`,
  `let path = window.location.pathname as string;\n      if (path.startsWith('/verify')) path = '/verify';`
);

content = content.replace(
  `const currentPath = window.location.pathname;\n          if (!['/', '/login', '/register', '/forgot-password', '/verify-email', '/2fa', '/verify'].includes(currentPath)) {`,
  `const currentPath = window.location.pathname;\n          if (!['/', '/login', '/register', '/forgot-password', '/verify-email', '/2fa'].includes(currentPath) && !currentPath.startsWith('/verify')) {`
);

content = content.replace(
  `const isVerificationRoute = currentRoute === '/verify';`,
  `const isVerificationRoute = currentRoute === '/verify' || window.location.pathname.startsWith('/verify');`
);

fs.writeFileSync('./src/App.tsx', content);
