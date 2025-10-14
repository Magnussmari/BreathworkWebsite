import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyIndexes() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });

  try {
    console.log('🔍 Reading index SQL file...');
    const sqlContent = fs.readFileSync(
      path.join(__dirname, 'add-performance-indexes.sql'), 
      'utf8'
    );

    console.log('📊 Applying database indexes...');
    await pool.query(sqlContent);
    
    console.log('✅ Database indexes applied successfully!');
    console.log('📈 Performance should be significantly improved.');
    
  } catch (error) {
    console.error('❌ Error applying indexes:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyIndexes();