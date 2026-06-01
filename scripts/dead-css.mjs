import fs from 'node:fs';
import path from 'node:path';

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir)) {
    const p = path.join(dir, e);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

const files = walk('src');
let deadTotal = 0;
const deadByFile = [];

for (const scss of files.filter((f) => f.endsWith('.module.scss'))) {
  const dir = path.dirname(scss);
  // 같은 디렉토리 안의 모든 .tsx 파일을 합쳐서 사용 검색
  const siblingTsx = fs
    .readdirSync(dir)
    .filter((e) => e.endsWith('.tsx'))
    .map((e) => path.join(dir, e));
  if (siblingTsx.length === 0) continue;

  const scssSrc = fs.readFileSync(scss, 'utf8');
  const combinedTsx = siblingTsx
    .map((f) => fs.readFileSync(f, 'utf8'))
    .join('\n');

  const defined = new Set();
  for (const m of scssSrc.matchAll(/^\.([a-zA-Z_][a-zA-Z0-9_-]*)/gm))
    defined.add(m[1]);
  const used = new Set();
  for (const m of combinedTsx.matchAll(/styles\.([a-zA-Z_][a-zA-Z0-9_-]*)/g))
    used.add(m[1]);
  for (const m of combinedTsx.matchAll(/styles\[['"]([a-zA-Z_][a-zA-Z0-9_-]*)['"]\]/g))
    used.add(m[1]);

  const hasDynamic = /styles\[`/.test(combinedTsx);
  const dead = [...defined].filter((d) => !used.has(d));
  if (dead.length && !hasDynamic) {
    deadByFile.push({ scss, dead });
    deadTotal += dead.length;
  }
}

console.log('총 dead class:', deadTotal, '/', deadByFile.length, '파일');
for (const { scss, dead } of deadByFile) {
  console.log(scss + ':');
  for (const d of dead) console.log('  .' + d);
}
