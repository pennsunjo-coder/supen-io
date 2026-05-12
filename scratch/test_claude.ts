import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testClaude() {
  console.log("Testing Claude Edge Function...")
  try {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: {
        system: "You are a helpful assistant.",
        messages: [{ role: "user", content: "Say hello!" }],
        max_tokens: 50
      }
    })

    if (error) {
      console.error("Supabase Function Error:", error)
    } else {
      console.log("Claude Response:", data)
    }
  } catch (err) {
    console.error("Unexpected Error:", err)
  }
}

testClaude()
