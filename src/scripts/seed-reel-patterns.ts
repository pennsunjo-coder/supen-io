import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Variables manquantes : VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const reelPatterns = [
  // ═══════ INSTAGRAM REELS ═══════
  {
    content: `PATTERN: Reel Instagram — Structure "Secret Feature"
HOOK (texte+voix, 2s): "This secret [platform] feature will 4x your views!"
BUILD-UP (3s): "And literally a 5 year old could do this in seconds."
VALUE (20-40s): Walkthrough step-by-step ultra rapide. Montrer l'écran. "Head over to [tool], click [X], then [Y]." Pas d'explication longue, juste les actions.
CTA (3s): "As always follow for more value!"
STYLE: Rapide, coupes sèches, sous-titres animés. Chaque phrase = une action. Pas de blabla. Musique trending en fond.
LONGUEUR: 30-60 secondes max.`,
    platform: "Instagram",
    format: "Reel (script)",
  },
  {
    content: `PATTERN: Reel Instagram — Structure "X Outils Essentiels"
HOOK: "These are the only [N] tools you need to [résultat désirable]."
CORPS: Tool 1 — nom + ce qu'il fait en 1 phrase + démo visuelle rapide. Tool 2 — idem. Tool 3 — idem. Enchaîner sans pause.
CTA: "Comment [mot-clé] to get the list, and follow for more value!"
MANYCHAT: Ajouter un trigger de commentaire pour envoyer les liens en DM automatiquement.
STYLE: Rythme ultra rapide. Chaque outil = 5-8 secondes max. Coupes sur chaque transition.`,
    platform: "Instagram",
    format: "Reel (script)",
  },
  {
    content: `PATTERN: Reel Instagram — Structure "Leçons Personnelles"
HOOK: "I grew [X] followers in [Y] days. Here are the key lessons:"
LEÇONS: 3-5 leçons courtes, chacune en 1-2 phrases directes.
EXEMPLES: "Not giving a f about views. Post daily." — "AI is insane; you are just using it without context." — "Value is learning something in an enjoyable way."
CTA: "I recently started to help you achieve similar results. Comment [mot] if you're serious."
STYLE: Face caméra ou voix-off sur B-roll. Ton direct, presque brut. Pas de polish excessif.`,
    platform: "Instagram",
    format: "Reel (script)",
  },
  {
    content: `PATTERN: Reel Instagram — Structure "AI Demo Rapide"
HOOK: "This AI is going to scare you!" ou "These [type] videos are getting millions of views!"
DEMO: Montrer l'outil en action. "Visit [tool], upload [X], click [Y], and in seconds you get [résultat impressionnant]."
RÉSULTAT: Montrer le before/after ou le résultat final. Laisser l'image parler.
CTA: "Comment [mot-clé] and I will send the link in DM."
STYLE: Screen recording accéléré. Sous-titres. Musique. Max 30 secondes.`,
    platform: "Instagram",
    format: "Reel (script)",
  },

  // ═══════ TIKTOK ═══════
  {
    content: `PATTERN: TikTok — Structure "Hook + Tools + CTA"
HOOK (1-2s): Affirmation choc. "You are ruining your productivity if you're not using these 3 AI tools." ou "OpenAI just woke up and killed this billion dollar company."
BUILD-UP (2s): Amplifier. "And did I mention they are completely free?"
CORPS (15-30s): Numéroter chaque outil/point. "Number 1: [Nom] allows you to [action]. Number 2: [Nom] is a game changer because [raison]."
CTA (3s): "Comment [mot] to get the list. Follow for more."
STYLE: Face caméra ou écran. Rythme rapide, pas de temps mort. Chaque point = 5-8 secondes.`,
    platform: "TikTok",
    format: "Script vidéo",
  },
  {
    content: `PATTERN: TikTok — Structure "Product/Money Reveal"
HOOK: "These [type] stores make [montant] a month using only AI. Here is how."
ÉTAPES RAPIDES: "First, visit [Tool]. Describe [X]. In seconds, you get [Y]. Now take that to [Platform]. Pick a product. Slap your design on it. Connect to [Store]."
RÉSULTAT: "In only a couple minutes, we have an online store live without investing a single penny."
CTA: "Comment [mot] to get started."
STYLE: Screen recording + voix-off. Accéléré. Chaque étape = 3-5 secondes. Total 30-45s.`,
    platform: "TikTok",
    format: "Script vidéo",
  },
  {
    content: `PATTERN: TikTok — Structure "Mindset Brut"
HOOK: "Thinking you need the perfect idea is the reason you will never make it."
DÉVELOPPEMENT: Histoire personnelle ultra courte. "I was in the same position. But you know what I did? I just started. With some simple [chose basique]. 50 views and sh*t content. But it was the only entry I needed."
LEÇON: "All the information you need is at your fingertips for free. You just have to seek it out and take action."
CTA: "The simpler the idea, the more likely you are to start. Follow for more value."
STYLE: Face caméra, ton direct, pas de filtre. Authenticité brute. 30-45 secondes.`,
    platform: "TikTok",
    format: "Script vidéo",
  },
  {
    content: `PATTERN: TikTok Caption — Structure "Résultat + Mystère"
LIGNE 1: Résultat impressionnant sans explication. "These accounts make 10k a month through TikTok shop affiliates."
LIGNE 2: Twist. "And this guy, yeah he is an AI!"
LIGNE 3: Promesse. "Here's how to do it!"
HASHTAGS: 3-5 max. Mix trending + niche.
STYLE: Créer un gap de curiosité. Le viewer DOIT regarder la vidéo pour comprendre.`,
    platform: "TikTok",
    format: "Caption",
  },

  // ═══════ FACEBOOK REELS ═══════
  {
    content: `PATTERN: Facebook Reel — Structure "Hack Rapide"
HOOK: "Here's how to [résultat désirable] in seconds using AI."
DÉMO: Screen recording de l'outil. "Go to [URL]. Paste [X]. Press [Y]. And in seconds, you get [résultat]."
AVANT/APRÈS: Montrer la transformation visuelle si applicable.
CTA: "Comment [mot] to try it yourself."
STYLE: Identique à TikTok/Instagram mais légèrement plus long (45-60s OK sur Facebook). Sous-titres obligatoires car beaucoup de viewers en muet.`,
    platform: "Facebook",
    format: "Post",
  },

  // ═══════ MODÈLES DE HOOKS VIRAUX (cross-platform) ═══════
  {
    content: `PATTERNS DE HOOKS VIRAUX — Bibliothèque de formules testées
HOOKS "WHAT IF": "What if you could [résultat] without [obstacle]?" — "What if I told you [fait surprenant]?"
HOOKS "SECRET": "This secret [feature/tool] will [résultat chiffré]!" — "YouTube will hate me for sharing this."
HOOKS "RÉSULTAT": "I grew [chiffre] in [durée]. Here's how." — "This account makes [montant]/month with [méthode]."
HOOKS "ERREUR": "You're ruining [chose] if you don't [action]." — "Most people mess up [tool] before they even start."
HOOKS "CHOC": "[Tool] just woke up and killed [concurrent]." — "This AI is going to scare you!"
HOOKS "LISTE": "Here are [N] AI tools you won't believe are free." — "The only [N] tools you need."
HOOKS "MINDSET": "Thinking you need [X] is the reason you'll never [Y]." — "[Chiffre] out of 1000 people have never [action]."
RÈGLE: Le hook doit créer un gap de curiosité en moins de 3 secondes. Le viewer doit se dire "je dois voir la suite".`,
    platform: "Instagram",
    format: "Reel (script)",
  },
  {
    content: `PATTERNS DE HOOKS VIRAUX — Bibliothèque de formules testées
HOOKS "WHAT IF": "What if you could [résultat] without [obstacle]?" — "What if I told you [fait surprenant]?"
HOOKS "SECRET": "This secret [feature/tool] will [résultat chiffré]!" — "YouTube will hate me for sharing this."
HOOKS "RÉSULTAT": "I grew [chiffre] in [durée]. Here's how." — "This account makes [montant]/month with [méthode]."
HOOKS "ERREUR": "You're ruining [chose] if you don't [action]." — "Most people mess up [tool] before they even start."
HOOKS "CHOC": "[Tool] just woke up and killed [concurrent]." — "This AI is going to scare you!"
HOOKS "LISTE": "Here are [N] AI tools you won't believe are free." — "The only [N] tools you need."
HOOKS "MINDSET": "Thinking you need [X] is the reason you'll never [Y]." — "[Chiffre] out of 1000 people have never [action]."
RÈGLE: Le hook doit créer un gap de curiosité en moins de 3 secondes. Le viewer doit se dire "je dois voir la suite".`,
    platform: "TikTok",
    format: "Script vidéo",
  },
];

async function seed() {
  console.log(`🎬 Insertion de ${reelPatterns.length} modèles Reels/TikTok/Facebook...\n`);
  for (let i = 0; i < reelPatterns.length; i++) {
    const p = reelPatterns[i];
    const { error } = await supabase.from("viral_references").insert(p);
    const label = p.content.match(/PATTERN: (.+)/)?.[1]?.slice(0, 50) || "Hook patterns";
    if (error) console.error(`❌ ${i + 1}. [${p.platform}/${p.format}] — ${error.message}`);
    else console.log(`✅ ${i + 1}. [${p.platform}/${p.format}] — ${label}`);
  }
  console.log("\n🎬 Seed Reels terminé !");
}

seed();
