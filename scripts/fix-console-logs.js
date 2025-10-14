import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../server/routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace console.error patterns
content = content.replace(
  /console\.error\("([^"]+)",\s*error\);/g,
  'logger.error("$1", { error: error.message });'
);

content = content.replace(
  /console\.error\('([^']+)',\s*([^)]+)\);/g,
  "logger.error('$1', { error: $2.message });"
);

// Write back to file
fs.writeFileSync(filePath, content);
console.log('✅ Replaced console.error statements in routes.ts');