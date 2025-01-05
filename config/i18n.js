const i18n = require('i18n');
const path = require('path');

i18n.configure({
  locales: ['it', 'en'],
  defaultLocale: 'it',
  directory: path.join(__dirname, '../locales'),
  objectNotation: true,
  updateFiles: false,
  syncFiles: false,
  cookie: 'lang'
});

module.exports = i18n;