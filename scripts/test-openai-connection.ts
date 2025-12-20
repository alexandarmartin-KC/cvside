import OpenAI from 'openai';

async function testOpenAIConnection() {
  console.log('Testing OpenAI Connection...\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is not set');
    console.log('\nTo fix this:');
    console.log('1. Create a .env.local file in the project root');
    console.log('2. Add: OPENAI_API_KEY=sk-your-key-here');
    console.log('3. Restart your dev server');
    process.exit(1);
  }
  
  console.log('✅ OPENAI_API_KEY is set');
  console.log('   Key preview:', apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4));
  console.log('   Key length:', apiKey.length, 'characters\n');
  
  const openai = new OpenAI({
    apiKey: apiKey,
  });
  
  try {
    console.log('Testing OpenAI API connection with simple request...\n');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with JSON only.'
        },
        {
          role: 'user',
          content: 'Say "test successful" in JSON format with a key "status".'
        }
      ],
      temperature: 0.1,
      max_tokens: 50,
      response_format: { type: 'json_object' }
    });
    
    const response = completion.choices[0]?.message?.content;
    console.log('✅ OpenAI API connection successful!');
    console.log('   Response:', response);
    console.log('   Model used:', completion.model);
    console.log('   Tokens used:', completion.usage?.total_tokens);
    console.log('\n✅ Your OpenAI integration is working correctly!');
    
  } catch (error: any) {
    console.error('❌ OpenAI API connection failed\n');
    
    if (error?.status === 401) {
      console.error('Error: Invalid API key (401 Unauthorized)');
      console.error('The API key you provided is not valid.');
      console.error('\nTo fix:');
      console.error('1. Get a valid API key from https://platform.openai.com/api-keys');
      console.error('2. Update OPENAI_API_KEY in your .env.local file');
    } else if (error?.status === 429) {
      console.error('Error: Rate limit exceeded (429)');
      console.error('You have exceeded your OpenAI API quota or rate limit.');
      console.error('\nTo fix:');
      console.error('1. Check your usage at https://platform.openai.com/usage');
      console.error('2. Upgrade your plan or wait for quota reset');
    } else if (error?.status === 404) {
      console.error('Error: Model not found (404)');
      console.error('The model "gpt-4" may not be available for your account.');
      console.error('\nTo fix:');
      console.error('1. Try using "gpt-3.5-turbo" instead');
      console.error('2. Check your model access at https://platform.openai.com/account/limits');
    } else if (error?.code === 'ENOTFOUND' || error?.code === 'ETIMEDOUT') {
      console.error('Error: Network connection failed');
      console.error('Could not connect to OpenAI servers.');
      console.error('\nTo fix:');
      console.error('1. Check your internet connection');
      console.error('2. Check if a firewall is blocking OpenAI API (api.openai.com)');
    } else {
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error status:', error?.status);
      console.error('Error code:', error?.code);
      console.error('\nFull error:');
      console.error(JSON.stringify(error, null, 2));
    }
    
    process.exit(1);
  }
}

testOpenAIConnection();
