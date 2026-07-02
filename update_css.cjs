const fs = require('fs');
let content = fs.readFileSync('./src/index.css', 'utf8');

const replacement = `
@media print {
  .page-break-inside-avoid {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .page-break-after-avoid {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
  .page-break-before-always {
    page-break-before: always !important;
    break-before: page !important;
  }
}

.pdf-generating .page-break-inside-avoid {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}
.pdf-generating .page-break-after-avoid {
  page-break-after: avoid !important;
  break-after: avoid !important;
}
.pdf-generating .page-break-before-always {
  page-break-before: always !important;
  break-before: page !important;
}
`;

content += replacement;

fs.writeFileSync('./src/index.css', content);
