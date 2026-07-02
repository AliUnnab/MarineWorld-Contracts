const fs = require('fs');
let css = fs.readFileSync('./src/index.css', 'utf8');

const target = `.pdf-generating .contract-page-sheet {
  margin: 0 !important;
  box-shadow: none !important;
  border: none !important;
  border-radius: 0 !important;
  transform: none !important;
  page-break-after: auto !important;
  break-after: auto !important;
}`;

const replacement = `.pdf-generating .contract-page-sheet {
  margin: 0 !important;
  padding: 24px !important; /* To match p-6 */
  box-shadow: none !important;
  border: none !important;
  border-radius: 0 !important;
  transform: none !important;
  page-break-after: always !important;
  break-after: page !important;
  height: 1122px !important;
  max-height: 1122px !important;
  overflow: hidden !important;
}

.pdf-generating .contract-page-sheet:last-child {
  page-break-after: auto !important;
  break-after: auto !important;
}

/* Hide the wrapper padding to prevent any offsets */
.pdf-generating > div {
  padding: 0 !important;
  margin: 0 !important;
}
`;

css = css.replace(target, replacement);

fs.writeFileSync('./src/index.css', css);
