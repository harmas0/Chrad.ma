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

// Check: identifier -> what it should be imported from (partial match)
const CHECKS = [
  { id: 'useAuth',      source: 'AuthContext', definedIn: 'AuthContext.jsx' },
  { id: 'CategoryIcon', source: 'CategoryIcon', definedIn: null },
  { id: 'useI18n',      source: 'i18n',         definedIn: 'i18n.jsx' },
  { id: 'useNavigate',  source: 'react-router-dom', definedIn: null },
  { id: 'supabase',     source: 'supabaseClient',   definedIn: null },
];

const files = getFiles(path.join(process.cwd(), 'src'));
const problems = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const rel = path.relative(process.cwd(), f);

  for (const { id, source, definedIn } of CHECKS) {
    // Skip the file that defines the identifier
    if (definedIn && rel.endsWith(definedIn)) continue;

    const usedRegex = new RegExp(`\\b${id}\\b`);
    if (!usedRegex.test(content)) continue;

    // Check if there's an import line that includes both 'import' and the identifier
    const importLines = content.split('\n').filter(l => l.trim().startsWith('import'));
    const hasImport = importLines.some(l => l.includes(id));
    // Also allow: locally defined (e.g. const useAuth = ...)
    const isLocallyDefined = new RegExp(`(export\\s+)?(const|function)\\s+${id}\\b`).test(content);

    if (!hasImport && !isLocallyDefined) {
      problems.push(`${rel} -> MISSING import for: ${id}  (should come from: ${source})`);
    }
  }
}

if (problems.length === 0) {
  console.log('✅ ALL CLEAR - No missing imports found!');
} else {
  console.log(`❌ Found ${problems.length} missing import(s):`);
  problems.forEach(p => console.log('  ' + p));
}
