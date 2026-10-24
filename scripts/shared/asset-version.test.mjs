import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {assetVersion} from './asset-version.mjs';
test('a payload rewritten after an earlier generator was hashed gets its new token', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mado-asset-version-')),file=path.join(dir,'utility-data.js');
  const root=fileURLToPath(new URL('../../',import.meta.url)),relative=path.relative(root,file);
  const token=text=>createHash('sha256').update(text).digest('hex').slice(0,8);
  try {
    fs.writeFileSync(file,'previous routes');assert.equal(assetVersion(relative),token('previous routes'));
    fs.writeFileSync(file,'routes including scenery and drinks');
    assert.equal(assetVersion(relative,true),token('routes including scenery and drinks'));
    assert.equal(assetVersion(relative),token('routes including scenery and drinks'));
  } finally {fs.unlinkSync(file);fs.rmdirSync(dir);}
});
