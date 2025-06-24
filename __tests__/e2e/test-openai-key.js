#!/usr/bin/env node

require('dotenv').config();
const OpenAI = require('openai');

// 直接測試 OpenAI API key
async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  console.log('🔑 測試 OpenAI API Key...\n');
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY 環境變數未設置！');
    return;
  }
  
  console.log(`API Key 格式: ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`API Key 長度: ${apiKey.length} 字符\n`);
  
  try {
    const openai = new OpenAI({ apiKey });
    
    console.log('📤 發送測試請求到 OpenAI...\n');
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say 'Hello World' in JSON format"
        }
      ],
      max_tokens: 50,
      temperature: 0
    });
    
    console.log('✅ OpenAI API 連接成功！');
    console.log('回應:', response.choices[0]?.message?.content);
    console.log('\n可用模型測試:');
    
    // 測試 GPT-4o
    try {
      const gpt4oResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1
      });
      console.log('✅ GPT-4o 可用');
    } catch (e) {
      console.log('❌ GPT-4o 不可用:', e.message);
    }
    
    // 測試 GPT-4-turbo
    try {
      const gpt4TurboResponse = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1
      });
      console.log('✅ GPT-4-turbo-preview 可用');
    } catch (e) {
      console.log('❌ GPT-4-turbo-preview 不可用:', e.message);
    }
    
  } catch (error) {
    console.error('❌ OpenAI API 錯誤:', error.message);
    if (error.response) {
      console.error('詳細錯誤:', error.response.data);
    }
    
    if (error.message.includes('401')) {
      console.error('\n💡 建議: API key 無效或格式錯誤。請檢查：');
      console.error('1. API key 是否正確複製（沒有多餘空格）');
      console.error('2. API key 是否已經激活');
      console.error('3. API key 是否有正確的權限');
    }
  }
}

// 運行測試
testOpenAI().catch(console.error);