import MemoryClient from 'mem0ai';

const apiKey = 'm0-S0JE8FcAYEgnJrCosoLeXZOync7kPcM01kACRN7l';
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