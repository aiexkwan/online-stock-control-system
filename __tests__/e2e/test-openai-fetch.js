#!/usr/bin/env node

require('dotenv').config();

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  console.log('🔑 使用 fetch 測試 OpenAI API...\n');
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY 未設置！');
    return;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 10
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API 調用成功！');
      console.log('回應:', data.choices[0].message.content);
    } else {
      console.error('❌ API 調用失敗！');
      console.error('狀態碼:', response.status);
      console.error('錯誤:', data);
      
      if (response.status === 401) {
        console.error('\n💡 可能的原因：');
        console.error('1. API key 無效');
        console.error('2. API key 已被撤銷');
        console.error('3. 使用了錯誤類型的 key（例如 project key vs user key）');
      }
    }
    
  } catch (error) {
    console.error('❌ 網絡錯誤:', error.message);
  }
}

testOpenAI().catch(console.error);