import MemoryClient from 'mem0ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const apiKey = process.env.MEM0_API_KEY;
if (!apiKey) {
  throw new Error('MEM0_API_KEY is not set in environment variables');
}

const client = new MemoryClient({ apiKey: apiKey });

// 使用例子：
// const messages = [
//   { role: "user", content: "我叫 Alice" },
//   { role: "assistant", content: "好高興認識你，Alice！" }
// ];
//
// await client.add(messages, { user_id: "alice" });
//
// const searchResult = await client.search("關於 Alice 嘅資料", { user_id: "alice" });
// console.log(searchResult);
