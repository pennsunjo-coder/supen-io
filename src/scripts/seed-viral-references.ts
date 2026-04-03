import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌ Variables manquantes : VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies dans .env"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const viralPosts = [
  {
    content:
      "You love Claude, so you are prompting it every day. But Claude Skills is the way to (actually) use it...",
    platform: "LinkedIn",
    format: "Post",
  },
  {
    content:
      "You don't need to learn to code anymore. Here's how to prompt Claude Code (zero coding)...",
    platform: "LinkedIn",
    format: "Post",
  },
  {
    content:
      "840 out of 1,000 people have never used AI. Here's the 7-day plan so you're not one of them...",
    platform: "LinkedIn",
    format: "Post",
  },
  {
    content:
      "Half of what experts say about LinkedIn is wrong. Here's the reality of LinkedIn in 2026...",
    platform: "LinkedIn",
    format: "Post",
  },
  {
    content:
      "My AI infographics generated 7.5M+ impressions. Here are the 7 elements behind everyone...",
    platform: "LinkedIn",
    format: "Post",
  },
];

async function seed() {
  console.log("🚀 Insertion des modèles viraux LinkedIn...\n");

  for (const post of viralPosts) {
    const { error } = await supabase.from("viral_references").insert(post);

    if (error) {
      console.error(`❌ Échec : "${post.content.slice(0, 60)}..."`);
      console.error(`   Erreur : ${error.message}\n`);
    } else {
      console.log(`✅ Inséré : "${post.content.slice(0, 60)}..."`);
    }
  }

  console.log("\n🎉 Seed terminé !");
}

seed();
