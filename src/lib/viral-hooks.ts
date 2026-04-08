/**
 * Viral hooks library — 100+ proven hooks organized by niche and type.
 * Used as instant suggestions in the Studio + Tools, before/instead of
 * waiting for Claude to generate fresh ones.
 */

export type HookType =
  | "question"
  | "stat"
  | "contrarian"
  | "story"
  | "fomo"
  | "confession"
  | "promise"
  | "provocateur";

export type Niche =
  | "business"
  | "marketing"
  | "tech"
  | "finance"
  | "fitness"
  | "education"
  | "lifestyle"
  | "general";

export interface Hook {
  text: string;
  type: HookType;
  niche: Niche;
  platform?: string;
}

export const VIRAL_HOOKS: Hook[] = [
  // ═══ BUSINESS & ENTREPRENEURIAT ═══
  { text: "Tu travailles 60h/semaine pour quelqu'un d'autre depuis combien d'annees ?", type: "question", niche: "business" },
  { text: "Combien d'idees de business as-tu abandonnees par peur ?", type: "question", niche: "business" },
  { text: "T'as deja calcule ce que tu gagnes vraiment a l'heure ?", type: "question", niche: "business" },
  { text: "Pourquoi les riches ne travaillent pas plus dur que toi ?", type: "question", niche: "business" },
  { text: "95% des entrepreneurs abandonnent avant 2 ans. Voici pourquoi les 5% restants reussissent.", type: "stat", niche: "business" },
  { text: "J'ai fait 0EUR pendant 18 mois. Puis 47 000EUR en un mois.", type: "stat", niche: "business" },
  { text: "Mon premier business a rapporte 12EUR. Le deuxieme, 120 000EUR.", type: "stat", niche: "business" },
  { text: "1 entrepreneur sur 10 reussit. Voici ce que les 9 autres font de travers.", type: "stat", niche: "business" },
  { text: "J'ai economise 3 ans pour lancer mon business. Il a coule en 3 mois.", type: "stat", niche: "business" },
  { text: "Arrete de chercher ta passion. Cherche un probleme.", type: "contrarian", niche: "business" },
  { text: "Le business plan, c'est pour ceux qui ont peur de commencer.", type: "contrarian", niche: "business" },
  { text: "Les diplomes MBA n'ont pas cree les plus grandes entreprises du monde.", type: "contrarian", niche: "business" },
  { text: "La motivation ne sert a rien en business. Voici ce qui compte vraiment.", type: "contrarian", niche: "business" },
  { text: "Ton idee de business n'est pas originale. C'est une bonne nouvelle.", type: "contrarian", niche: "business" },
  { text: "J'avais 200EUR sur mon compte. J'ai quand meme lance.", type: "story", niche: "business" },
  { text: "Mon associe m'a arnaque de 50 000EUR. Voici ce que j'ai appris.", type: "story", niche: "business" },
  { text: "J'ai rate 7 fois avant de reussir. Voici la 8eme tentative.", type: "story", niche: "business" },
  { text: "Mon patron m'a licencie un vendredi. Le lundi, j'etais entrepreneur.", type: "story", niche: "business" },
  { text: "A 35 ans, j'ai tout quitte pour lancer mon premier business.", type: "story", niche: "business" },
  { text: "Dans 5 ans, tu regretteras de ne pas avoir commence aujourd'hui.", type: "fomo", niche: "business" },
  { text: "Pendant que tu hesites, quelqu'un d'autre lance ton idee.", type: "fomo", niche: "business" },
  { text: "Les gens qui ont commence en 2020 sont millionnaires aujourd'hui.", type: "fomo", niche: "business" },

  // ═══ MARKETING DIGITAL ═══
  { text: "Ton contenu est nul ? Non. Tu cibles les mauvaises personnes.", type: "contrarian", niche: "marketing" },
  { text: "J'ai teste 47 accroches. Voici les 3 qui fonctionnent vraiment.", type: "stat", niche: "marketing" },
  { text: "Pourquoi tes posts n'ont aucun engagement (et comment corriger ca).", type: "question", niche: "marketing" },
  { text: "Le secret des createurs a 1M d'abonnes que personne ne dit.", type: "fomo", niche: "marketing" },
  { text: "J'ai analyse 1000 posts viraux. Voici le pattern.", type: "stat", niche: "marketing" },
  { text: "Arrete de faire du contenu pour tout le monde. Tu touches personne.", type: "contrarian", niche: "marketing" },
  { text: "Mon post le plus viral a ete ecrit en 8 minutes.", type: "story", niche: "marketing" },
  { text: "3 mots qui font tripler ton engagement instantanement.", type: "promise", niche: "marketing" },
  { text: "La vraie raison pour laquelle les gens ne likent pas tes posts.", type: "question", niche: "marketing" },
  { text: "Ton concurrent a 10x plus d'abonnes. Voici pourquoi c'est normal.", type: "contrarian", niche: "marketing" },
  { text: "J'ai arrete de poster pendant 30 jours. Voici ce qui s'est passe.", type: "story", niche: "marketing" },
  { text: "L'algorithme ne te deteste pas. Tu fais juste ces 3 erreurs.", type: "contrarian", niche: "marketing" },
  { text: "Comment j'ai multiplie par 10 mon engagement en changeant UN mot.", type: "stat", niche: "marketing" },
  { text: "Personne ne te dit que le marketing, c'est de la psychologie.", type: "contrarian", niche: "marketing" },
  { text: "Combien vaut vraiment ton audience ? La reponse va te surprendre.", type: "question", niche: "marketing" },

  // ═══ TECH & IA ═══
  { text: "L'IA va remplacer ton job. Mais pas de la facon que tu crois.", type: "contrarian", niche: "tech" },
  { text: "J'utilise l'IA 8h par jour. Voici les 5 outils qui changent tout.", type: "stat", niche: "tech" },
  { text: "ChatGPT t'a menti. Voici comment vraiment utiliser l'IA.", type: "contrarian", niche: "tech" },
  { text: "En 2025, ne pas utiliser l'IA, c'est comme ne pas avoir internet en 2000.", type: "fomo", niche: "tech" },
  { text: "J'ai automatise 80% de mon travail avec l'IA. Voici comment.", type: "stat", niche: "tech" },
  { text: "L'IA ne remplace pas les humains. Elle remplace les humains qui n'utilisent pas l'IA.", type: "contrarian", niche: "tech" },
  { text: "Ces 3 prompts IA m'economisent 15h de travail par semaine.", type: "promise", niche: "tech" },
  { text: "Pourquoi les developpeurs les mieux payes utilisent l'IA differemment.", type: "question", niche: "tech" },
  { text: "J'ai utilise l'IA pour creer un produit en 48h. Voici le resultat.", type: "story", niche: "tech" },
  { text: "90% des gens utilisent ChatGPT comme Google. C'est une erreur.", type: "stat", niche: "tech" },
  { text: "L'IA m'a permis de faire le travail d'une equipe de 5 personnes seul.", type: "stat", niche: "tech" },
  { text: "Le prompt parfait n'existe pas. Voici ce qui fonctionne vraiment.", type: "contrarian", niche: "tech" },

  // ═══ FINANCE & INVESTISSEMENT ═══
  { text: "Tu travailles 35 ans pour la retraite. Et si tu pouvais le faire en 10 ?", type: "question", niche: "finance" },
  { text: "J'ai perdu 30 000EUR en bourse. Voici la lecon a 30 000EUR.", type: "story", niche: "finance" },
  { text: "L'ecole ne t'a jamais appris a gerer l'argent. Voici pourquoi.", type: "contrarian", niche: "finance" },
  { text: "Comment j'epargne 40% de mes revenus sans me priver.", type: "promise", niche: "finance" },
  { text: "Le piege des placements 'sans risque' que ta banque ne te dit pas.", type: "contrarian", niche: "finance" },
  { text: "Investir 100EUR/mois pendant 30 ans = ?", type: "question", niche: "finance" },
  { text: "Les riches ne travaillent pas plus dur. Ils font travailler leur argent.", type: "contrarian", niche: "finance" },
  { text: "J'avais 0EUR d'epargne a 28 ans. Voici comment j'ai rattrape le retard.", type: "story", niche: "finance" },
  { text: "3 erreurs financieres que font 95% des gens dans la trentaine.", type: "stat", niche: "finance" },
  { text: "La regle des 50/30/20 que ta banque ne veut pas que tu saches.", type: "contrarian", niche: "finance" },

  // ═══ FITNESS & SANTE ═══
  { text: "J'ai perdu 20kg sans regime strict. Voici ce qui a vraiment marche.", type: "story", niche: "fitness" },
  { text: "Tu fais du sport depuis 6 mois sans resultats ? Voici pourquoi.", type: "question", niche: "fitness" },
  { text: "La salle de sport est le business le plus rentable du monde. Voici pourquoi.", type: "contrarian", niche: "fitness" },
  { text: "Les gens qui font du sport le matin ont un avantage injuste.", type: "fomo", niche: "fitness" },
  { text: "Manger moins ne fait pas maigrir. Voici la vraie explication.", type: "contrarian", niche: "fitness" },
  { text: "20 minutes par jour ont transforme mon corps en 90 jours.", type: "stat", niche: "fitness" },
  { text: "La vraie raison pour laquelle tu abandonnes tes objectifs fitness.", type: "question", niche: "fitness" },
  { text: "J'ai mange McDonald's chaque semaine en perdant 15kg. Explications.", type: "story", niche: "fitness" },
  { text: "95% des gens font leur echauffement de la mauvaise facon.", type: "stat", niche: "fitness" },
  { text: "Le meilleur sport pour perdre du poids n'est pas celui que tu crois.", type: "contrarian", niche: "fitness" },

  // ═══ EDUCATION & FORMATION ═══
  { text: "J'ai appris plus en 6 mois sur YouTube qu'en 5 ans d'etudes.", type: "story", niche: "education" },
  { text: "Le diplome ne te prepare pas au marche du travail actuel.", type: "contrarian", niche: "education" },
  { text: "Comment apprendre n'importe quelle competence en 20h (methode prouvee).", type: "promise", niche: "education" },
  { text: "Les competences qui rapportent le plus en 2025 ne s'enseignent pas a l'ecole.", type: "contrarian", niche: "education" },
  { text: "J'ai investi 5000EUR en formations. Voici ce qui en valait vraiment la peine.", type: "story", niche: "education" },
  { text: "La technique de memorisation que 1% des etudiants connaissent.", type: "stat", niche: "education" },
  { text: "Pourquoi lire un livre par semaine ne te rendra pas plus intelligent.", type: "contrarian", niche: "education" },
  { text: "L'apprentissage en ligne vs les etudes traditionnelles : les chiffres.", type: "stat", niche: "education" },

  // ═══ LIFESTYLE & DEV PERSO ═══
  { text: "J'ai arrete les reseaux sociaux pendant 30 jours. Voici ce qui s'est passe.", type: "story", niche: "lifestyle" },
  { text: "5h du matin : le secret des gens qui reussissent (mythe ou realite).", type: "question", niche: "lifestyle" },
  { text: "Etre occupe ne veut pas dire etre productif. La difference concrete.", type: "contrarian", niche: "lifestyle" },
  { text: "J'ai change 1 habitude. Ma vie a change en 3 mois.", type: "story", niche: "lifestyle" },
  { text: "Les gens qui s'entourent de personnes ambitieuses gagnent 33% de plus.", type: "stat", niche: "lifestyle" },
  { text: "Le probleme n'est pas le temps. C'est ce que tu fais avec.", type: "contrarian", niche: "lifestyle" },
  { text: "Pourquoi les plus productifs travaillent moins que toi.", type: "question", niche: "lifestyle" },
  { text: "J'ai dit non a tout pendant 1 mois. Voici ce qui a change.", type: "story", niche: "lifestyle" },
  { text: "La discipline, c'est surcote. Voici ce qui marche vraiment.", type: "contrarian", niche: "lifestyle" },
  { text: "3 habitudes matinales qui ont tout change (sans se lever a 5h).", type: "promise", niche: "lifestyle" },

  // ═══ GENERAL ═══
  { text: "Ce que personne ne te dit sur [sujet].", type: "contrarian", niche: "general" },
  { text: "J'aurais voulu savoir ca a 20 ans.", type: "confession", niche: "general" },
  { text: "La verite que personne n'ose dire sur [sujet].", type: "provocateur", niche: "general" },
  { text: "Arrete de faire ca. Serieusement.", type: "provocateur", niche: "general" },
  { text: "En 2025, si tu ne fais pas ca, tu vas rater quelque chose d'enorme.", type: "fomo", niche: "general" },
  { text: "J'ai essaye pendant 1 an. Voici mon bilan honnete.", type: "story", niche: "general" },
  { text: "La seule chose qui m'a vraiment aide a changer.", type: "confession", niche: "general" },
  { text: "Tout le monde te ment sur [sujet]. Voici la verite.", type: "contrarian", niche: "general" },
  { text: "Je ne suis pas d'accord avec 90% des experts sur ce sujet.", type: "provocateur", niche: "general" },
  { text: "Voici ce que j'aurais dit a ma version d'il y a 5 ans.", type: "confession", niche: "general" },
  { text: "Le conseil que tout le monde donne et qui ne marche pas.", type: "contrarian", niche: "general" },
  { text: "J'ai fait l'erreur que tout le monde fait. Ne la repete pas.", type: "confession", niche: "general" },
  { text: "Pourquoi les gens qui travaillent le plus dur ne reussissent pas le plus.", type: "question", niche: "general" },
  { text: "Le truc que les gens qui reussissent font differemment.", type: "fomo", niche: "general" },
  { text: "Ca fait 3 ans que j'observe. Voici ce que j'ai appris.", type: "story", niche: "general" },
];

// ─── Niche detection from text ───

const NICHE_KEYWORDS: Record<Exclude<Niche, "general">, string[]> = {
  business: ["business", "entrepren", "startup", "boite", "boss", "patron", "ceo", "salarie", "freelance", "vente", "client"],
  marketing: ["marketing", "contenu", "audience", "engagement", "viral", "post", "reseau", "instagram", "tiktok", "linkedin", "publicit", "branding"],
  tech: ["ia", "ai", "tech", "code", "developp", "chatgpt", "claude", "logiciel", "app", "digital", "automat"],
  finance: ["argent", "finance", "invest", "bourse", "epargne", "salaire", "revenu", "patrimoine", "richesse", "etf", "crypto"],
  fitness: ["sport", "fitness", "muscle", "salle", "musculation", "corps", "poids", "kg", "regime", "alimentation", "sante", "courir", "yoga"],
  education: ["apprendre", "etude", "ecole", "formation", "cours", "diplome", "enseign", "competence", "skill"],
  lifestyle: ["habitude", "matin", "productivite", "discipline", "vie", "personnel", "developpement", "mindset", "routine"],
};

export function detectNiche(text: string): Niche {
  if (!text || text.length < 3) return "general";
  const lower = text.toLowerCase();
  let bestNiche: Niche = "general";
  let bestScore = 0;

  for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS) as [Niche, string[]][]) {
    const score = keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestNiche = niche;
    }
  }
  return bestNiche;
}

// ─── Filter & retrieve hooks ───

export function getHooks(
  niche?: string,
  type?: HookType,
  limit: number = 10,
): Hook[] {
  let filtered = VIRAL_HOOKS;

  if (niche) {
    const n = niche.toLowerCase();
    const detected = (Object.keys(NICHE_KEYWORDS) as Niche[]).find((k) => n.includes(k)) ||
      (Object.entries(NICHE_KEYWORDS) as [Niche, string[]][]).find(([, kws]) => kws.some((kw) => n.includes(kw)))?.[0];

    if (detected) {
      filtered = VIRAL_HOOKS.filter((h) => h.niche === detected || h.niche === "general");
    }
  }

  if (type) {
    filtered = filtered.filter((h) => h.type === type);
  }

  return filtered
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

// ─── Personalize a hook with user topic ───

export function personalizeHook(hook: string, topic: string): string {
  if (!topic) return hook;
  return hook.replace(/\[sujet\]/g, topic);
}

// ─── Daily hook (deterministic per day + niche) ───

export function getDailyHook(niche?: string): Hook {
  const today = new Date();
  const dayKey = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const pool = niche ? getHooks(niche, undefined, 100) : VIRAL_HOOKS;
  const idx = dayKey % pool.length;
  return pool[idx] || VIRAL_HOOKS[0];
}
