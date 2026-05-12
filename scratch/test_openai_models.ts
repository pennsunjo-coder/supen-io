import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testModel(modelId: string) {
  console.log(`Testing model: ${modelId}`);
  try {
    const message = await openai.chat.completions.create({
      model: modelId,
      max_tokens: 10,
      messages: [{ role: "user", content: "Hello" }],
    });
    console.log(`Success with ${modelId}:`, message.choices[0].message.content);
    return true;
  } catch (err: any) {
    console.error(`Error with ${modelId}:`, err.message);
    return false;
  }
}

async function main() {
  await testModel("gpt-4o");
  await testModel("gpt-4o-mini");
}

main();
