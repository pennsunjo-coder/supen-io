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

/**
 * Modèles de contenu viral extraits de scripts YouTube performants.
 * Chaque entrée encode un pattern structurel, un style de hook,
 * et des techniques d'engagement réutilisables par l'IA.
 */
const contentPatterns = [
  // ═══════ YOUTUBE — Script vidéo (tutoriels IA) ═══════
  {
    content: `PATTERN: Script YouTube Tutorial IA — Structure "What If"
HOOK: Question hypothétique provocante ("What if you could...") suivie d'une vision du résultat final. Max 2 phrases.
INTRO: Présenter la solution en 1 phrase, puis annoncer le walkthrough step-by-step.
CORPS: Steps numérotés (Step 1, Step 2...) avec action claire à chaque étape. Montrer le process exact: quel outil ouvrir, quel bouton cliquer, quel prompt taper.
ERREURS: Section "Common Mistakes to Avoid" — 3 erreurs avec explication courte.
USE CASE: Un scénario concret et relatable ("Let's say you want to post consistently but...").
CLOSING: Résumer l'avantage principal, CTA like/subscribe/comment.
STYLE: Conversationnel, direct, pas de jargon. Phrases courtes. Pas d'enthousiasme artificiel. Chaque step est actionnable immédiatement.
LONGUEUR: 300-500 mots pour un script de 5-8 minutes.`,
    platform: "YouTube",
    format: "Script vidéo",
  },
  {
    content: `PATTERN: Script YouTube Tutorial — Structure "Step-by-Step Builder"
HOOK: "I'm going to show you how to build [X] without [obstacle courant]." Démystifier immédiatement.
INTRO: Expliquer le problème que les gens rencontrent. Puis annoncer les outils utilisés (max 2-3 outils).
CORPS: Flux linéaire — chaque step produit un résultat visible. Step 1: préparer (ChatGPT pour structurer). Step 2: construire (outil principal). Step 3: tester. Step 4: publier/exporter.
TENSION: Insérer un "Quick question — How long do you think this normally takes?" pour engager.
RÉSULTAT: Montrer le produit final fonctionnel. "This is not a mockup. This is a real working [app/site/tool]."
CLOSING: Élargir la vision — "Once you do this, everything changes. Because now you can [liste de possibilités]."
STYLE: Pratique, pas de promesses exagérées. Disclaimer éducation. Montrer tout à l'écran.`,
    platform: "YouTube",
    format: "Script vidéo",
  },
  {
    content: `PATTERN: Script YouTube — Structure "Listicle d'Outils"
HOOK: Chiffre choc + frustration relatable. "Right now, most creators are paying $20… $40… even $100 every month for AI tools." Puis la promesse de remplacement gratuit.
INTRO: Annoncer le nombre exact d'outils. Teaser le résultat ("you might cancel a few subscriptions").
CORPS: Pour chaque outil — Nom + Problème résolu + Scénario concret avant/après + Comment l'utiliser en 2-3 phrases.
TRANSITIONS: Lier chaque outil au suivant naturellement ("And once you have those clips, you'll probably want to edit them quickly. That brings us to...").
CLOSING: Calculer les économies totales. CTA émotionnel ("You stop waiting on freelancers and start creating whenever you want").
STYLE: Chaque outil = mini-histoire. Pas de liste plate. Toujours montrer le gain de temps concret.`,
    platform: "YouTube",
    format: "Script vidéo",
  },
  {
    content: `PATTERN: Script YouTube — Structure "Compétences à Apprendre"
HOOK: Observation du marché + urgence ("AI is booming in 2026. There's a global gold rush happening.") Puis contraste: ce n'est pas les outils qui comptent, c'est les skills.
INTRO: Anecdote personnelle courte ("I wrapped up a full day's worth of work before lunch"). Puis annonce des X skills.
CORPS: Skill 1 à N — Chaque skill suit le pattern: Définition simple + Exemple débutant vs expert + Framework actionnable + Pourquoi ça compte.
TEASER: "Stay with me, because skill number [X] is the reason I stopped paying freelancers $300 every month."
FRAMEWORKS: Donner des frameworks mémorisables (Context, Constraints, Reasoning, Outcome pour le prompting).
CLOSING: "If you start building even two or three of these skills, you'll already be ahead." Question de positionnement.`,
    platform: "YouTube",
    format: "Script vidéo",
  },
  {
    content: `PATTERN: Script YouTube — Structure "Workflow Combiné"
HOOK: "Most people mess up [Tool] before they even type a single prompt." Attaquer l'erreur commune.
INTRO: Expliquer pourquoi l'outil est différent d'un chatbot classique. Annoncer le workflow complet qui sera montré.
DISCLAIMER: "This video is for education only. Results depend on effort, consistency, and quality."
CORPS: Workflow en chaîne — Tool A produit X, qu'on injecte dans Tool B pour produire Y, puis Tool C pour finaliser. Chaque étape montre le résultat intermédiaire.
ASSETS: Après le produit principal, montrer tous les assets dérivés qu'on peut créer: vidéo, infographie, slides, mind map, quiz, audio.
CLOSING: "Open [Tool] and do this once. Take one [input], generate one [output], and build one [product]. Even if it's not perfect."`,
    platform: "YouTube",
    format: "Script vidéo",
  },
  {
    content: `PATTERN: Script YouTube — Structure "Faceless Channel / Automation"
HOOK: Affirmation audacieuse + preuve personnelle. "You can start a brand new YouTube channel today, never show your face, and still grow it to thousands of subscribers. I know because I did it."
INTRO: Stats personnelles (X subscribers en Y mois). Annoncer qu'on fait tout avec un seul outil.
CORPS: Setup complet — Créer le compte, choisir la niche (avec prompts spécifiques pour Gemini), créer le contenu, éditer, publier, automatiser. Chaque action est filmée/montrée.
NICHE RESEARCH: Prompt exact pour trouver des niches à haut CPM avec faible concurrence.
AUTOMATION: Montrer le bulk scheduling — créer et programmer 30 jours de contenu d'un coup.
CLOSING: "The secret is not magic. The secret is output. Make more videos. Stay in one niche. Improve every week."`,
    platform: "YouTube",
    format: "Script vidéo",
  },
  {
    content: `PATTERN: Script YouTube — Structure "Feature Deep Dive"
HOOK: "Most people still use [Tool] like a simple chat box. That is a mistake." Repositionner l'outil.
INTRO: "[Tool] is now a full software with several types of features." Annoncer le nombre exact de features.
CORPS: Feature 1 à N — Chaque feature: Nom + Ce que ça fait en 1 phrase + Comment y accéder (Settings > X > Y) + Exemple concret d'utilisation + Résultat visible.
ORGANISATION: Grouper par catégorie si beaucoup de features (productivité, création, recherche, collaboration).
STYLE: Pas de filler. Chaque feature = 30-60 secondes. Action > Résultat > Suivant.
CLOSING: "You just went from using [Tool] like a simple chat box to understanding how it really works."`,
    platform: "YouTube",
    format: "Script vidéo",
  },
  {
    content: `PATTERN: Script YouTube — Structure "Business Use Cases"
HOOK: Question directe + situation de départ. "What's the most lucrative business use case for [Tool] if you're starting from zero? No followers, no budget, no plan."
INTRO: Crédibilité ("I've used [Tool] extensively across real projects"). Annoncer les niveaux d'expertise (Level 1 débutant, Level 2 avancé, Level 3 automatisation).
DISCLAIMER: "This video is for educational purposes only. I am not making income guarantees."
CORPS: Use case 1 à N — Chaque use case: Problème client + Comment le résoudre avec l'outil + Prompt exact à utiliser + Où vendre le service (Fiverr, Upwork, LinkedIn, local).
CLOSING: "Pick one idea from this list. Create a few examples. Share them or apply them in a real project."`,
    platform: "YouTube",
    format: "Script vidéo",
  },
  {
    content: `PATTERN: Script YouTube — Structure "Écosystème Complet"
HOOK: Comparaison avec les concurrents payants. "While so many people are still paying for [competitors] every month, [Tool] is a completely different beast. Most of what it offers is free."
INTRO: "If you only open the chat box, you're barely using ten percent." Puis mapper l'écosystème complet: web, mobile, workspace, labs, studio.
CORPS: Feature 1 à 18+ — Format ultra-compact: Nom + Description 1 ligne + Action exacte pour y accéder + Résultat. Enchaîner rapidement.
ORGANISATION: Regrouper par type: Conversion (vidéo/audio vers texte), Création (images, pages, storybooks), Recherche (deep research, NotebookLM), Outils (Gems, Forms, Slides).
CLOSING: "Once you understand how the ecosystem works, [Tool] becomes one of the most useful platforms you can use for free."`,
    platform: "YouTube",
    format: "Script vidéo",
  },

  // ═══════ YOUTUBE — Script Shorts ═══════
  {
    content: `PATTERN: YouTube Shorts / Reels — Structure "Quick Win"
HOOK (1-2 sec): Texte à l'écran + voix: "This AI trick saves me 3 hours every week."
DEMO (15-30 sec): Montrer l'action en accéléré. Pas d'explication longue. Résultat visible.
REVEAL (5 sec): Le résultat final, impressionnant.
CTA (3 sec): "Follow for more AI tips" ou "Save this for later."
STYLE: Vertical 9:16. Sous-titres animés. Musique trending. Max 60 secondes. Pas de intro, pas de logo, pas de "hey guys".`,
    platform: "YouTube",
    format: "Script Shorts",
  },

  // ═══════ LINKEDIN — Post ═══════
  {
    content: `PATTERN: LinkedIn Post Viral — Structure "Contrarian Take"
HOOK: Attaquer une croyance commune. "Half of what experts say about [topic] is wrong." ou "You don't need to [chose populaire] anymore."
DÉVELOPPEMENT: 3-5 paragraphes courts (2-3 lignes max chacun). Chaque paragraphe = un point distinct. Saut de ligne entre chaque.
PREUVE: Chiffres personnels ou observation marché. "I tested this. Here's what happened."
LISTE: Si applicable, lister 3-7 points avec tirets ou numéros. Pas de bullet points fancy.
CTA: Question ouverte pour les commentaires. "What's your experience with this?"
STYLE: Première personne. Pas de hashtags excessifs (max 3). Pas d'émojis en début de ligne. Ton professionnel mais accessible. 150-300 mots.`,
    platform: "LinkedIn",
    format: "Post",
  },
  {
    content: `PATTERN: LinkedIn Post Viral — Structure "Framework Actionnable"
HOOK: Chiffre + résultat. "My AI [X] generated [impressive number]. Here are the [N] elements behind it."
SETUP: 1-2 phrases de contexte. Pourquoi ce framework existe.
FRAMEWORK: Liste numérotée de 5-7 éléments. Chaque élément = Nom + explication en 1 ligne.
RÉSULTAT: Ce que ça change concrètement quand on applique le framework.
CTA: "Save this post. You'll need it." ou "Which element resonates most?"
STYLE: Dense en valeur. Chaque mot compte. Pas de remplissage. Le lecteur doit pouvoir appliquer immédiatement.`,
    platform: "LinkedIn",
    format: "Post",
  },

  // ═══════ LINKEDIN — Thread ═══════
  {
    content: `PATTERN: LinkedIn Thread — Structure "Day-by-Day Plan"
POST 1 (HOOK): "[X] out of 1,000 people have never [done thing]. Here's the [N]-day plan so you're not one of them."
POSTS 2-N: Un jour par post. Jour 1: action simple. Jour 2: action intermédiaire. Progression logique.
DERNIER POST: Résumé + encouragement. "Day [N] is not the end. It's the beginning."
CTA: "Repost this to help someone start."
STYLE: Chaque post = 2-4 lignes max. Action concrète à chaque jour. Pas de théorie. Seulement du "fais ça".`,
    platform: "LinkedIn",
    format: "Thread",
  },

  // ═══════ INSTAGRAM — Post ═══════
  {
    content: `PATTERN: Instagram Post Carrousel — Structure "Listicle Visuel"
SLIDE 1 (COVER): Titre accrocheur en gros. Sous-titre court. Design épuré, fond contrasté.
SLIDES 2-8: Un point par slide. Titre en gros + explication en 2-3 lignes. Icône ou visuel simple.
SLIDE FINALE: CTA — "Save this post" + "Follow @handle for more."
LÉGENDE: Résumer le carrousel en 2-3 phrases. Hashtags pertinents (10-15). Question pour engagement.
STYLE: Design cohérent sur toutes les slides. Même police, mêmes couleurs. Texte lisible en petit format mobile.`,
    platform: "Instagram",
    format: "Carrousel",
  },
  {
    content: `PATTERN: Instagram Post — Structure "Micro-Value"
LÉGENDE: Hook en première ligne (visible avant "voir plus"). Max 5 mots percutants.
CORPS: 3-5 lignes de valeur actionnable. Pas de blabla. Chaque phrase = une info utile.
CTA: Emoji + question simple. "💡 Tu utilises déjà ça?"
HASHTAGS: 10-15 hashtags mix large + niche. Pas dans le corps, en fin de légende ou en commentaire.
STYLE: Ton décontracté, tutoiement. Phrases ultra-courtes. Emojis utilisés avec parcimonie (1-2 par post).`,
    platform: "Instagram",
    format: "Post",
  },

  // ═══════ INSTAGRAM / TIKTOK — Reel/Script vidéo ═══════
  {
    content: `PATTERN: Reel/TikTok — Structure "POV Tutorial"
HOOK (0-2 sec): Texte à l'écran: "POV: you just discovered [tool] can do THIS."
TRANSITION: Swipe/cut vers l'écran avec l'outil ouvert.
DEMO (10-25 sec): Montrer le process en accéléré avec musique trending. Sous-titres auto.
RÉSULTAT (3-5 sec): Le résultat final, satisfaisant visuellement.
CTA (2 sec): "Follow for more" en texte à l'écran.
STYLE: Vertical. Cuts rapides. Pas de voix-off longue. Musique = 50% de l'impact. Max 30-45 sec.`,
    platform: "TikTok",
    format: "Script vidéo",
  },
  {
    content: `PATTERN: TikTok Caption — Structure "Curiosity Gap"
LIGNE 1: Phrase incomplète qui crée la curiosité. "This free tool just replaced my $50/month subscription..."
LIGNE 2: Contexte minimal. "I tested it for 2 weeks."
LIGNE 3: Résultat. "The results were insane."
HASHTAGS: 3-5 max, trending + niche.
STYLE: Court. Mystérieux. Donner envie de regarder la vidéo. Pas de spoiler du résultat dans la caption.`,
    platform: "TikTok",
    format: "Caption",
  },

  // ═══════ X (TWITTER) — Tweet ═══════
  {
    content: `PATTERN: Tweet Viral — Structure "Hot Take + Proof"
LIGNE 1: Opinion tranchée en 10 mots max. "You don't need to learn to code anymore."
LIGNE 2: La preuve ou le context. "Here's how to prompt Claude Code (zero coding):"
LIGNES 3+: Liste de 3-5 steps ultra-courts (1 ligne chacun).
STYLE: Pas de hashtags. Pas d'émojis. Ton assertif. Chaque mot pèse. Max 280 caractères ou thread si besoin.`,
    platform: "X (Twitter)",
    format: "Tweet",
  },

  // ═══════ X (TWITTER) — Thread ═══════
  {
    content: `PATTERN: Twitter/X Thread — Structure "Masterclass Compressée"
TWEET 1 (HOOK): Chiffre impressionnant + promesse. "I built [X] in [timeframe]. Here's the exact playbook (thread):"
TWEETS 2-N: Un concept par tweet. Format: Numéro + Titre en caps + Explication en 1-2 phrases.
TWEET MILIEU: "If you're finding this useful, RT the first tweet so others can benefit too."
TWEET FINAL: Résumé en 3 bullet points + CTA follow.
STYLE: Chaque tweet doit fonctionner seul ET dans le thread. Pas de "continued..." ou "next tweet...".`,
    platform: "X (Twitter)",
    format: "Thread",
  },

  // ═══════ FACEBOOK — Post ═══════
  {
    content: `PATTERN: Facebook Post — Structure "Story + Leçon"
HOOK: Début d'histoire personnelle. "Last week, something happened that changed how I work..."
HISTOIRE: 3-4 paragraphes courts racontant un événement réel ou un test.
LEÇON: "Here's what I learned:" suivi de 3 takeaways numérotés.
CTA: "Has this happened to you? Share your experience below."
STYLE: Conversationnel, comme si tu parlais à un ami. Pas de jargon marketing. Emojis OK mais pas excessifs. 200-400 mots.`,
    platform: "Facebook",
    format: "Post",
  },

  // ═══════ FACEBOOK — Thread ═══════
  {
    content: `PATTERN: Facebook Thread — Structure "Guide Progressif"
POST 1: Hook + annonce du guide. "I'm about to share the complete [X] guide. Bookmark this thread."
POSTS 2-N: Chaque post = une étape du guide. Titre clair + 3-5 lignes d'explication + image si possible.
ENGAGEMENT: Poser une question à mi-chemin. "Are you following so far? Drop a 🔥 if yes."
POST FINAL: Résumé + "Share this thread with someone who needs it."
STYLE: Accessible, pas élitiste. Expliquer comme si l'audience découvrait le sujet pour la première fois.`,
    platform: "Facebook",
    format: "Thread",
  },
];

async function seed() {
  console.log(`🚀 Insertion de ${contentPatterns.length} modèles de contenu viral...\n`);

  for (let i = 0; i < contentPatterns.length; i++) {
    const pattern = contentPatterns[i];
    const { error } = await supabase.from("viral_references").insert(pattern);

    if (error) {
      console.error(`❌ ${i + 1}. [${pattern.platform}/${pattern.format}] — ${error.message}`);
    } else {
      const label = pattern.content.match(/PATTERN: (.+)/)?.[1]?.slice(0, 55) || "Pattern";
      console.log(`✅ ${i + 1}. [${pattern.platform}/${pattern.format}] — ${label}`);
    }
  }

  console.log("\n🎉 Seed content patterns terminé !");
  console.log(`   Total : ${contentPatterns.length} modèles couvrant 6 plateformes et tous les formats.`);
}

seed();
