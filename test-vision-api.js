// Quick test to see if Vision API accepts PDFs
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log('Testing if GPT-4o Vision accepts PDFs...\n');
console.log('According to OpenAI docs, Vision API supports:');
console.log('- PNG, JPEG, WEBP, GIF images');
console.log('- Does NOT support PDF directly\n');
console.log('❌ Our current approach will fail!\n');
console.log('Solutions:');
console.log('1. Convert PDF to images first (complex)');
console.log('2. Use better text extraction + smarter prompt');
console.log('3. Use Assistants API with file upload\n');
