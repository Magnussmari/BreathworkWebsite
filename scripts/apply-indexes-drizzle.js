import { db } from '../server/db.ts';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyIndexes() {
  try {
    console.log('🔍 Reading index SQL file...');
    const sqlContent = fs.readFileSync(
      path.join(__dirname, 'add-performance-indexes.sql'), 
      'utf8'
    );

    console.log('📊 Applying database indexes...');
    
    // Split SQL content by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await db.execute(statement);
      }
    }
    
    console.log('✅ Database indexes applied successfully!');
    console.log('📈 Performance should be significantly improved.');
    
  } catch (error) {
    console.error('❌ Error applying indexes:', error.message);
    process.exit(1);
  }
}

applyIndexes();