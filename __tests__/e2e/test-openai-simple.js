#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  console.log('🔑 簡單測試 OpenAI API...\n');
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY 未設置！');
    return;
  }
  
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  
  try {
    // 直接使用 axios 調用 OpenAI API
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Hello'
        }
      ],
      max_tokens: 5
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API 調用成功！');
    console.log('回應:', response.data.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ API 調用失敗！');
    console.error('狀態碼:', error.response?.status);
    console.error('錯誤信息:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('\n💡 API key 無效或已過期');
    } else if (error.response?.status === 429) {
      console.error('\n💡 API 配額已用完');
    } else if (error.response?.status === 404) {
      console.error('\n💡 API 端點不存在，可能是 API key 格式問題');
    }
  }
}

testOpenAI().catch(console.error);