// Test Vite setup
import { setupVite } from '../server/vite.ts';
import express from 'express';
import { createServer } from 'http';
import path from 'path';

console.log('🧪 Testing Vite Setup...\n');

const app = express();
const server = createServer(app);

try {
  console.log('1. Testing Vite server creation...');
  await setupVite(app, server);
  console.log('✅ Vite setup completed successfully!');
  
  console.log('\n2. Testing file paths...');
  const clientTemplate = path.resolve(process.cwd(), 'client', 'index.html');
  console.log('Client template path:', clientTemplate);
  
  const fs = await import('fs');
  const exists = fs.existsSync(clientTemplate);
  console.log('Client template exists:', exists);
  
  if (exists) {
    const content = fs.readFileSync(clientTemplate, 'utf-8');
    console.log('Template has React script:', content.includes('main.tsx'));
  }
  
  console.log('\n✅ Vite setup test completed!');
  
} catch (error) {
  console.error('❌ Vite setup failed:', error.message);
  console.error('Stack:', error.stack);
}