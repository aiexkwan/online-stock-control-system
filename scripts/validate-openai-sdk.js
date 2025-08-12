#!/usr/bin/env node

/**
 * OpenAI SDK 驗證腳本
 * 檢查 OpenAI SDK v4.104.0 是否正確安裝且 API 結構正確
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 驗證 OpenAI SDK 安裝和 API 結構...\n');

try {
  // 檢查 package.json 中的版本
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const openaiVersion = packageJson.dependencies?.openai || packageJson.devDependencies?.openai;
  
  console.log(`📦 Package.json 中的 OpenAI 版本: ${openaiVersion}`);
  
  // 嘗試導入 OpenAI
  const OpenAI = require('openai');
  console.log('✅ OpenAI 模組成功導入');
  
  // 檢查是否需要 API key 來測試結構
  const hasApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0;
  
  if (!hasApiKey) {
    console.log('⚠️  未找到 OPENAI_API_KEY 環境變數，將進行基本結構檢查');
  }
  
  // 創建 OpenAI 實例進行結構檢查
  let client;
  try {
    client = new OpenAI({ 
      apiKey: hasApiKey ? process.env.OPENAI_API_KEY : 'dummy-key-for-structure-check' 
    });
    console.log('✅ OpenAI 客戶端成功實例化');
  } catch (error) {
    console.error('❌ 無法創建 OpenAI 客戶端:', error.message);
    process.exit(1);
  }
  
  // 檢查 API 結構
  console.log('\n🔍 檢查 API 結構:');
  
  // 檢查 beta namespace
  if (client.beta) {
    console.log('✅ client.beta 存在');
    
    // 檢查 vectorStores
    if (client.beta.vectorStores) {
      console.log('✅ client.beta.vectorStores 存在');
      
      // 檢查 vectorStores 方法
      const vectorStoreMethods = ['create', 'retrieve', 'update', 'list', 'delete'];
      vectorStoreMethods.forEach(method => {
        if (client.beta.vectorStores[method]) {
          console.log(`  ✅ vectorStores.${method} 存在`);
        } else {
          console.log(`  ❌ vectorStores.${method} 不存在`);
        }
      });
      
      // 檢查 vectorStores.files
      if (client.beta.vectorStores.files) {
        console.log('✅ client.beta.vectorStores.files 存在');
        
        const filesMethods = ['create', 'retrieve', 'update', 'list', 'del'];
        filesMethods.forEach(method => {
          if (client.beta.vectorStores.files[method]) {
            console.log(`  ✅ vectorStores.files.${method} 存在`);
          } else {
            console.log(`  ❌ vectorStores.files.${method} 不存在`);
          }
        });
      } else {
        console.log('❌ client.beta.vectorStores.files 不存在');
      }
    } else {
      console.log('❌ client.beta.vectorStores 不存在');
      
      // 檢查是否在其他位置
      if (client.vectorStores) {
        console.log('⚠️  發現 client.vectorStores (非 beta)，這可能是版本差異');
      }
    }
    
    // 檢查 assistants
    if (client.beta.assistants) {
      console.log('✅ client.beta.assistants 存在');
    } else {
      console.log('❌ client.beta.assistants 不存在');
    }
    
    // 檢查 threads
    if (client.beta.threads) {
      console.log('✅ client.beta.threads 存在');
    } else {
      console.log('❌ client.beta.threads 不存在');
    }
  } else {
    console.log('❌ client.beta 不存在');
  }
  
  // 檢查其他重要 API
  console.log('\n🔍 檢查其他 API:');
  
  if (client.files) {
    console.log('✅ client.files 存在');
  } else {
    console.log('❌ client.files 不存在');
  }
  
  if (client.chat) {
    console.log('✅ client.chat 存在');
  } else {
    console.log('❌ client.chat 不存在');
  }
  
  console.log('\n📋 總結:');
  
  // 在 v4.104.0 中，vectorStores 在頂層而不是在 beta 下
  const hasVectorStores = client.vectorStores || (client.beta && client.beta.vectorStores);
  const hasAssistants = client.beta && client.beta.assistants;
  const hasThreads = client.beta && client.beta.threads;
  
  if (hasVectorStores && hasAssistants && hasThreads) {
    console.log('✅ 所有必需的 API 都存在，AssistantService 應該能正常工作');
    
    if (client.vectorStores && !client.beta.vectorStores) {
      console.log('ℹ️  Vector Stores API 在頂層 (v4.104.0+ 版本結構)');
    }
    
    if (hasApiKey) {
      console.log('✅ 有 API key，可以進行實際的 API 調用測試');
    } else {
      console.log('⚠️  沒有 API key，無法測試實際 API 調用');
      console.log('   請設置 OPENAI_API_KEY 環境變數進行完整測試');
    }
  } else {
    console.log('❌ 缺少必需的 API，AssistantService 可能無法正常工作');
    console.log('   缺少的 API:');
    if (!hasVectorStores) console.log('   - Vector Stores API');
    if (!hasAssistants) console.log('   - Assistants API');
    if (!hasThreads) console.log('   - Threads API');
    console.log('   請確保使用 OpenAI SDK v4.0+');
  }
  
} catch (error) {
  console.error('❌ 驗證過程中發生錯誤:', error.message);
  console.error('   請確保已正確安裝 OpenAI SDK');
  process.exit(1);
}