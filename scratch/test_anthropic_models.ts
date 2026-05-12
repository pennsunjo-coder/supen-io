import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testModel(modelId: string) {
  console.log(`Testing model: ${modelId}`);
  try {
    const message = await anthropic.messages.create({
      model: modelId,
      max_tokens: 10,
      messages: [{ role: "user", content: "Hello" }],
    });
    console.log(`Success with ${modelId}:`, message.content[0].text);
    return true;
  } catch (err: any) {
    console.error(`Error with ${modelId}:`, err.message);
    if (err.response) {
        console.error("Response body:", await err.response.text());
    }
    return false;
  }
}

async function main() {
  await testModel("claude-3-5-sonnet-20240620");
  await testModel("claude-3-5-sonnet-20241022");
  await testModel("claude-3-sonnet-20240229");
  await testModel("claude-3-haiku-20240307");
}

main();
