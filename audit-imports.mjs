import fs from 'fs';
import path from 'path';

function getFiles(dir, files = []) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) getFiles(full, files);
    else if (item.endsWith('.jsx')) files.push(full);
  }
  return files;
}

const IDENTIFIERS = [
  'useAuth',
  'CategoryIcon',
  'useNavigate',
  'useI18n',
  'useEffect',
  'useState',
];

const files = getFiles(path.join(process.cwd(), 'src'));
const problems = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const rel = path.relative(process.cwd(), f);

  for (const id of IDENTIFIERS) {
    // Check if identifier is used in JSX/JS expressions (not just in strings or comments)
    const usedPattern = new RegExp(`\\b${id}\\b`);
    if (!usedPattern.test(content)) continue;

    // Check if there is an import line containing this identifier
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
    const hasImport = importLines.some(line => line.includes(id));
    
    // Some identifiers can be defined locally too (useState, useEffect from react)
    const isLocallyDefined = content.includes(`const ${id}`) || content.includes(`function ${id}`);

    if (!hasImport && !isLocallyDefined) {
      problems.push(`${rel} -> MISSING import for: ${id}`);
    }
  }
}

if (problems.length === 0) {
  console.log('ALL CLEAR - No missing imports found!');
} else {
  console.log(`Found ${problems.length} missing import(s):`);
  problems.forEach(p => console.log('  ' + p));
}
