const fs = require('fs');
let css = fs.readFileSync('./src/index.css', 'utf8');

const additionalCss = `

/* OVERRIDES FOR HTML2PDF CAPTURE */
.pdf-generating {
  background: white !important;
  background-color: white !important;
  padding: 0 !important;
  margin: 0 !important;
  gap: 0 !important;
}

.pdf-generating .contract-page-sheet {
  margin: 0 !important;
  box-shadow: none !important;
  border: none !important;
  border-radius: 0 !important;
  transform: none !important;
  break-after: auto !important;
  page-break-after: auto !important;
}

/* Force page break for html2pdf css mode inside sheets if needed, but not on the sheet itself to avoid empty pages */
`;

css += additionalCss;
fs.writeFileSync('./src/index.css', css);
