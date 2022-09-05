const fs = require('fs');

var templateFile = fs.readFileSync(
  './staticFiles/resetPasswordTemplate.html',
  'utf-8'
);

exports.fill = (message) => {
  return templateFile.replace('PLACEHOLDER', message);
};
