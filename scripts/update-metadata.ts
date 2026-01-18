import fs from 'fs';
import path from 'path';

const packagesDir = 'packages';
const packages = fs.readdirSync(packagesDir);

for (const pkg of packages) {
  const pkgPath = path.join(packagesDir, pkg, 'package.json');
  if (fs.existsSync(pkgPath)) {
    console.log(`Updating ${pkgPath}...`);
    const content = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    content.repository = {
      type: 'git',
      url: 'git+https://github.com/PaulJPhilp/EffectTalk.git',
      directory: `packages/${pkg}`
    };
    content.bugs = {
      url: 'https://github.com/PaulJPhilp/EffectTalk/issues'
    };
    content.homepage = 'https://github.com/PaulJPhilp/EffectTalk';

    fs.writeFileSync(pkgPath, JSON.stringify(content, null, 2) + '\n');
  }
}
