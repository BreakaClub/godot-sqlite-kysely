import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const buildVariants = {
  commonjs: join(__dirname, '../dist/cjs/package.json'),
  module: join(__dirname, '../dist/esm/package.json'),
};

for (const [variant, packagePath] of Object.entries(buildVariants)) {
  writeFileSync(packagePath, `{"type": "${variant}"}`, 'utf-8');
}
