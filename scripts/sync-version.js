'use strict';
// Keeps every version field in step with package.json. Run by `npm version` (see the
// "version" script), so a bump cannot leave the plugin or marketplace behind.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const { version } = require(path.join(root, 'package.json'));
const FIELD = /("version":\s*")[^"]+(")/g;

for (const file of ['build/manifest.json', '.claude-plugin/marketplace.json']) {
  const p = path.join(root, file);
  const text = fs.readFileSync(p, 'utf8');
  if ((text.match(FIELD) || []).length !== 1) {
    console.error(`sync-version: expected exactly one "version" field in ${file}`);
    process.exit(1);
  }
  fs.writeFileSync(p, text.replace(FIELD, `$1${version}$2`));
  console.log(`  ${file} -> ${version}`);
}
