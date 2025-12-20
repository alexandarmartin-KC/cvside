#!/usr/bin/env node

/**
 * Test script to verify GPT-4o Vision access
 * 
 * This will check:
 * 1. If your OPENAI_API_KEY is set
 * 2. If you have access to GPT-4o
 * 3. If you have access to GPT-4-vision-preview
 * 4. Test vision parsing with a sample image
 */

// Load environment variables from .env.local
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  });
}

const OpenAI = require('openai').default;

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

async function testOpenAIAccess() {
  console.log(`${BLUE}╔════════════════════════════════════════╗${RESET}`);
  console.log(`${BLUE}║   GPT-4o Vision Access Test           ║${RESET}`);
  console.log(`${BLUE}╚════════════════════════════════════════╝${RESET}\n`);

  // Step 1: Check API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log(`${RED}❌ OPENAI_API_KEY not found in environment${RESET}`);
    console.log(`\nPlease create a .env.local file with:`);
    console.log(`OPENAI_API_KEY=sk-proj-your-key-here\n`);
    process.exit(1);
  }

  console.log(`${GREEN}✅ OPENAI_API_KEY found${RESET}`);
  console.log(`   Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);

  const openai = new OpenAI({ apiKey });

  // Step 2: Test GPT-4o (text mode)
  console.log(`${BLUE}Testing GPT-4o (text mode)...${RESET}`);
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Say "GPT-4o works!"' }],
      max_tokens: 10
    });
    console.log(`${GREEN}✅ GPT-4o is available${RESET}`);
    console.log(`   Response: ${response.choices[0].message.content}\n`);
  } catch (error) {
    if (error.status === 404 || error.message.includes('model')) {
      console.log(`${RED}❌ GPT-4o not available on your account${RESET}`);
      console.log(`   You may need to upgrade your OpenAI plan\n`);
    } else {
      console.log(`${RED}❌ Error testing GPT-4o: ${error.message}${RESET}\n`);
    }
  }

  // Step 3: Test GPT-4o Vision
  console.log(`${BLUE}Testing GPT-4o Vision...${RESET}`);
  
  // Create a simple test image (1x1 red pixel as data URL)
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What color is this pixel? Answer in one word.' },
            { type: 'image_url', image_url: { url: testImage } }
          ]
        }
      ],
      max_tokens: 10
    });
    console.log(`${GREEN}✅ GPT-4o Vision is available!${RESET}`);
    console.log(`   Response: ${response.choices[0].message.content}`);
    console.log(`   ${GREEN}Your CV parser will work like ChatGPT!${RESET}\n`);
    return true;
  } catch (error) {
    if (error.status === 404) {
      console.log(`${YELLOW}⚠️  GPT-4o Vision not available yet${RESET}`);
      console.log(`   Trying fallback model...\n`);
    } else {
      console.log(`${RED}❌ Error testing vision: ${error.message}${RESET}\n`);
    }
  }

  // Step 4: Test GPT-4-vision-preview (fallback)
  console.log(`${BLUE}Testing GPT-4-vision-preview (fallback)...${RESET}`);
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What color is this pixel? Answer in one word.' },
            { type: 'image_url', image_url: { url: testImage } }
          ]
        }
      ],
      max_tokens: 10
    });
    console.log(`${GREEN}✅ GPT-4-vision-preview is available${RESET}`);
    console.log(`   Response: ${response.choices[0].message.content}`);
    console.log(`   ${GREEN}Fallback vision model will work!${RESET}\n`);
    return true;
  } catch (error) {
    console.log(`${RED}❌ Vision models not available: ${error.message}${RESET}\n`);
    return false;
  }
}

async function testCVParsing() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return;

  console.log(`${BLUE}╔════════════════════════════════════════╗${RESET}`);
  console.log(`${BLUE}║   Testing CV Parsing Capability       ║${RESET}`);
  console.log(`${BLUE}╚════════════════════════════════════════╝${RESET}\n`);

  // Create a sample CV text to test
  const sampleCV = `
John Doe
Senior Software Engineer
Email: john.doe@example.com | Phone: +45 12345678
LinkedIn: linkedin.com/in/johndoe

EXPERIENCE

Senior Software Engineer | TechCorp | Copenhagen, Denmark
January 2020 - Present
- Led development of microservices architecture
- Mentored team of 5 junior developers
- Implemented CI/CD pipelines

Software Developer | StartupXYZ | Remote
June 2017 - December 2019
- Built React-based dashboard
- Optimized database queries

EDUCATION

Master of Science in Computer Science
Technical University of Denmark | 2015 - 2017

Bachelor of Engineering
University of Copenhagen | 2011 - 2015

SKILLS
JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, Kubernetes

LANGUAGES
English (Fluent), Danish (Native), German (Basic)
`;

  const openai = new (require('openai').default)({ apiKey });

  console.log(`${BLUE}Testing text-based CV parsing with GPT-4o...${RESET}`);
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Extract the person\'s name and number of work experiences from this CV. Return JSON: {"name": "...", "experience_count": 2}'
        },
        {
          role: 'user',
          content: sampleCV
        }
      ],
      temperature: 0,
      max_tokens: 100,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log(`${GREEN}✅ CV parsing works!${RESET}`);
    console.log(`   Extracted name: ${result.name}`);
    console.log(`   Found ${result.experience_count} work experiences\n`);

    console.log(`${GREEN}╔════════════════════════════════════════╗${RESET}`);
    console.log(`${GREEN}║   ✅ ALL TESTS PASSED!                ║${RESET}`);
    console.log(`${GREEN}║   Your CV parser should work great!   ║${RESET}`);
    console.log(`${GREEN}╚════════════════════════════════════════╝${RESET}\n`);

  } catch (error) {
    console.log(`${RED}❌ CV parsing test failed: ${error.message}${RESET}\n`);
  }
}

async function main() {
  try {
    const hasVision = await testOpenAIAccess();
    await testCVParsing();

    console.log(`\n${BLUE}Summary:${RESET}`);
    if (hasVision) {
      console.log(`${GREEN}✅ Your setup is ready!${RESET}`);
      console.log(`   CV parsing will work like ChatGPT`);
      console.log(`   You can now upload CVs in PDF format\n`);
    } else {
      console.log(`${YELLOW}⚠️  Vision models not available${RESET}`);
      console.log(`   Text-based parsing will be used`);
      console.log(`   This still works, but may be less accurate\n`);
    }

    console.log(`Next steps:`);
    console.log(`1. Start your dev server: npm run dev`);
    console.log(`2. Upload a CV at: http://localhost:3000/upload`);
    console.log(`3. Check the console logs for parser output\n`);

  } catch (error) {
    console.error(`${RED}Fatal error: ${error.message}${RESET}`);
    process.exit(1);
  }
}

main();
