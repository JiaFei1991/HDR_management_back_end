const fs = require('fs');

const templateFile = fs.readFileSync(
  './staticFiles/returnMessageTemplate.html',
  'utf-8'
);

exports.fill = (message) => templateFile.replace('PLACEHOLDER', message);
