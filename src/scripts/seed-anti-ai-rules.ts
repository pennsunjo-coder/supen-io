import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Variables manquantes : VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * Règles Anti-IA compilées à partir de recherches sur la détection
 * de texte généré par IA. Ces règles sont injectées dans le system
 * prompt pour que le contenu généré par Supenli.io soit indétectable.
 */
const antiAiRules = [
  // Règles injectées dans CHAQUE génération via le format de la plateforme
  {
    content: `PROTOCOLE ANTI-IA — MOTS ET EXPRESSIONS INTERDITS
Ne JAMAIS utiliser ces mots/expressions dans le contenu généré :
- delve, underscore, harness, illuminate, bolster, foster, garner, showcase, pivotal, tapestry, beacon, realm, cacophony, intricate, meticulous, vibrant, enduring, testament, landscape (sens figuré)
- "it's important to note", "it's worth noting", "generally speaking", "from a broader perspective"
- "not only X but also Y" (parallelisme négatif répétitif)
- "In today's fast-paced", "In the dynamic world of", "In the ever-evolving landscape"
- "at the end of the day", "without further ado", "game changer", "cutting-edge"
- "serves as", "stands as", "boasts a", "nestled in"
- "Additionally" en début de phrase, "Furthermore" en début de phrase
- "In conclusion", "In summary", "Overall"
REMPLACER PAR : des mots simples du quotidien. "important" au lieu de "crucial". "montre" au lieu de "showcases". "aide" au lieu de "fosters".`,
    platform: "LinkedIn",
    format: "Post",
  },
  {
    content: `PROTOCOLE ANTI-IA — MOTS ET EXPRESSIONS INTERDITS
Ne JAMAIS utiliser ces mots/expressions dans le contenu généré :
- delve, underscore, harness, illuminate, bolster, foster, garner, showcase, pivotal, tapestry, beacon, realm, cacophony, intricate, meticulous, vibrant, enduring, testament, landscape (sens figuré)
- "it's important to note", "it's worth noting", "generally speaking", "from a broader perspective"
- "not only X but also Y" (parallelisme négatif répétitif)
- "In today's fast-paced", "In the dynamic world of", "In the ever-evolving landscape"
- "at the end of the day", "without further ado", "game changer", "cutting-edge"
- "serves as", "stands as", "boasts a", "nestled in"
- "Additionally" en début de phrase, "Furthermore" en début de phrase
- "In conclusion", "In summary", "Overall"
REMPLACER PAR : des mots simples du quotidien. "important" au lieu de "crucial". "montre" au lieu de "showcases". "aide" au lieu de "fosters".`,
    platform: "YouTube",
    format: "Script vidéo",
  },
  {
    content: `PROTOCOLE ANTI-IA — STRUCTURE ET STYLE HUMAIN
VARIER LA LONGUEUR DES PHRASES : alterner phrases courtes (3-5 mots) et longues (15-20 mots). Comme ça. Puis une phrase un peu plus développée pour donner du rythme. Ne JAMAIS garder la même longueur de phrase sur tout le texte.
VARIER LA VOIX : mélanger 1re personne ("j'ai testé"), 2e personne ("tu vas voir"), et 3e personne ("les créateurs font ça") dans le même texte. Les humains changent naturellement de voix.
PAS DE RULE OF THREE SYSTÉMATIQUE : ne pas mettre 3 adjectifs, 3 exemples, 3 points partout. Parfois 2 suffit. Parfois 4 c'est mieux. L'IA abuse du pattern "X, Y, and Z" — les humains ne font pas ça systématiquement.
PAS DE EM DASH EXCESSIF : utiliser 1-2 tirets longs max par texte. Préférer les virgules, les points, ou les parenthèses. L'abus de — est le signe n1 de texte IA.
PAS DE HEDGING EXCESSIF : ne pas écrire "might", "could", "perhaps", "generally" partout. Affirmer. Avoir une opinion. Les humains s'engagent.`,
    platform: "LinkedIn",
    format: "Post",
  },
  {
    content: `PROTOCOLE ANTI-IA — STRUCTURE ET STYLE HUMAIN
VARIER LA LONGUEUR DES PHRASES : alterner phrases courtes (3-5 mots) et longues (15-20 mots). Comme ça. Puis une phrase un peu plus développée pour donner du rythme. Ne JAMAIS garder la même longueur de phrase sur tout le texte.
VARIER LA VOIX : mélanger 1re personne ("j'ai testé"), 2e personne ("tu vas voir"), et 3e personne ("les créateurs font ça") dans le même texte. Les humains changent naturellement de voix.
PAS DE RULE OF THREE SYSTÉMATIQUE : ne pas mettre 3 adjectifs, 3 exemples, 3 points partout. Parfois 2 suffit. Parfois 4 c'est mieux. L'IA abuse du pattern "X, Y, and Z" — les humains ne font pas ça systématiquement.
PAS DE EM DASH EXCESSIF : utiliser 1-2 tirets longs max par texte. Préférer les virgules, les points, ou les parenthèses. L'abus de — est le signe n1 de texte IA.
PAS DE HEDGING EXCESSIF : ne pas écrire "might", "could", "perhaps", "generally" partout. Affirmer. Avoir une opinion. Les humains s'engagent.`,
    platform: "Instagram",
    format: "Post",
  },
  {
    content: `PROTOCOLE ANTI-IA — STRUCTURE ET STYLE HUMAIN
VARIER LA LONGUEUR DES PHRASES : alterner phrases courtes (3-5 mots) et longues (15-20 mots). Comme ça. Puis une phrase un peu plus développée pour donner du rythme. Ne JAMAIS garder la même longueur de phrase sur tout le texte.
VARIER LA VOIX : mélanger 1re personne ("j'ai testé"), 2e personne ("tu vas voir"), et 3e personne ("les créateurs font ça") dans le même texte. Les humains changent naturellement de voix.
PAS DE RULE OF THREE SYSTÉMATIQUE : ne pas mettre 3 adjectifs, 3 exemples, 3 points partout. Parfois 2 suffit. Parfois 4 c'est mieux. L'IA abuse du pattern "X, Y, and Z" — les humains ne font pas ça systématiquement.
PAS DE EM DASH EXCESSIF : utiliser 1-2 tirets longs max par texte. Préférer les virgules, les points, ou les parenthèses. L'abus de — est le signe n1 de texte IA.
PAS DE HEDGING EXCESSIF : ne pas écrire "might", "could", "perhaps", "generally" partout. Affirmer. Avoir une opinion. Les humains s'engagent.`,
    platform: "YouTube",
    format: "Script vidéo",
  },
  {
    content: `PROTOCOLE ANTI-IA — STRUCTURE ET STYLE HUMAIN
VARIER LA LONGUEUR DES PHRASES : alterner phrases courtes (3-5 mots) et longues (15-20 mots). Comme ça. Puis une phrase un peu plus développée pour donner du rythme. Ne JAMAIS garder la même longueur de phrase sur tout le texte.
VARIER LA VOIX : mélanger 1re personne ("j'ai testé"), 2e personne ("tu vas voir"), et 3e personne ("les créateurs font ça") dans le même texte. Les humains changent naturellement de voix.
PAS DE RULE OF THREE SYSTÉMATIQUE : ne pas mettre 3 adjectifs, 3 exemples, 3 points partout. Parfois 2 suffit. Parfois 4 c'est mieux. L'IA abuse du pattern "X, Y, and Z" — les humains ne font pas ça systématiquement.
PAS DE EM DASH EXCESSIF : utiliser 1-2 tirets longs max par texte. Préférer les virgules, les points, ou les parenthèses. L'abus de — est le signe n1 de texte IA.
PAS DE HEDGING EXCESSIF : ne pas écrire "might", "could", "perhaps", "generally" partout. Affirmer. Avoir une opinion. Les humains s'engagent.`,
    platform: "TikTok",
    format: "Script vidéo",
  },
  {
    content: `PROTOCOLE ANTI-IA — CE QUI REND UN TEXTE HUMAIN
IMPERFECTIONS NATURELLES : inclure des tournures légèrement imparfaites. "Et genre, c'est fou." Les humains ne sont pas parfaits grammaticalement et c'est OK.
OPINIONS TRANCHÉES : les humains s'engagent. "C'est le meilleur outil. Point." Pas "c'est possiblement un des outils les plus intéressants dans certains cas."
ANECDOTES PERSONNELLES : "J'ai testé pendant 2 semaines." "La première fois que j'ai vu ça, j'ai halluciné." Ancrer dans le vécu.
SPÉCIFICITÉ : citer des chiffres précis, des noms, des dates. "347 abonnés en 12 jours" est plus humain que "des centaines d'abonnés en quelques jours".
HUMOUR ET PERSONNALITÉ : glisser une vanne, un commentaire sarcastique, une observation décalée. Les robots ne font pas ça naturellement.
COUPES BRUSQUES : ne pas toujours finir proprement. Parfois couper au milieu d'une idée. Parfois changer de sujet sans transition parfaite.`,
    platform: "X (Twitter)",
    format: "Tweet",
  },
  {
    content: `PROTOCOLE ANTI-IA — CE QUI REND UN TEXTE HUMAIN
IMPERFECTIONS NATURELLES : inclure des tournures légèrement imparfaites. "Et genre, c'est fou." Les humains ne sont pas parfaits grammaticalement et c'est OK.
OPINIONS TRANCHÉES : les humains s'engagent. "C'est le meilleur outil. Point." Pas "c'est possiblement un des outils les plus intéressants dans certains cas."
ANECDOTES PERSONNELLES : "J'ai testé pendant 2 semaines." "La première fois que j'ai vu ça, j'ai halluciné." Ancrer dans le vécu.
SPÉCIFICITÉ : citer des chiffres précis, des noms, des dates. "347 abonnés en 12 jours" est plus humain que "des centaines d'abonnés en quelques jours".
HUMOUR ET PERSONNALITÉ : glisser une vanne, un commentaire sarcastique, une observation décalée. Les robots ne font pas ça naturellement.
COUPES BRUSQUES : ne pas toujours finir proprement. Parfois couper au milieu d'une idée. Parfois changer de sujet sans transition parfaite.`,
    platform: "Facebook",
    format: "Post",
  },
];

async function seed() {
  console.log(`🛡️ Insertion de ${antiAiRules.length} règles Anti-IA...\n`);
  for (let i = 0; i < antiAiRules.length; i++) {
    const rule = antiAiRules[i];
    const { error } = await supabase.from("viral_references").insert(rule);
    const label = rule.content.match(/PROTOCOLE (.+)/)?.[1]?.slice(0, 45) || "Règle";
    if (error) console.error(`❌ ${i + 1}. [${rule.platform}/${rule.format}] — ${error.message}`);
    else console.log(`✅ ${i + 1}. [${rule.platform}/${rule.format}] — ${label}`);
  }
  console.log("\n🛡️ Seed Anti-IA terminé !");
}

seed();
