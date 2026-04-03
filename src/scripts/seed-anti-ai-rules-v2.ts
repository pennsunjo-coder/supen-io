import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Variables manquantes : VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const rules = [
  {
    content: `MOTS ET EXPRESSIONS À NE JAMAIS UTILISER — SIGNES IMMÉDIATS D'ÉCRITURE IA :

NIVEAU ROUGE (les plus détectés) :
delve, delving, pivotal, tapestry (sens abstrait), underscore (verbe), bolstered, bolster, meticulous, meticulously, vibrant, testament, garner, garnered, intricate, intricacies, interplay, showcasing, showcase, fostering, foster, emphasizing, emphasize, enduring, enduring legacy, align with, aligns with, enhance, enhancing, crucial, it is crucial to, landscape (sens abstrait), realm (sens abstrait), beacon, cacophony, illuminate, illuminating, harness, harnessing, facilitate, facilitating.

NIVEAU ORANGE (très fréquents dans l'IA) :
"In today's fast-paced", "In the dynamic world of", "It's important to note that", "It goes without saying", "Without further ado", "Have you ever wondered", "At the end of the day", "In a nutshell", "Cutting-edge", "Game changer", "Thinking outside the box", "Unlock" (titre), "Empower" (titre), "Elevate" (titre), "Navigate the complexities", "Diving deep into", "Embark on a journey", "Seamless", "Robust", "Leverage" (verbe), "In conclusion", "To summarize", "In summary", "Furthermore", "Moreover", "Additionally" (début de phrase), "That being said", "To put it simply", "At its core".

NIVEAU JAUNE (à éviter autant que possible) :
"Certainly!", "Absolutely!", "Of course!", "Needless to say", "It's worth noting", "Remember that", "Don't forget that", "As we can see", "It's clear that", "Obviously", "Evidently".`,
    platform: "Tous",
    format: "Anti-IA",
  },
  {
    content: `STRUCTURES GRAMMATICALES À ÉVITER — TRAHISSENT L'IA :

1. PARALLÉLISMES NÉGATIFS (signe le plus fort) :
Interdit : "It's not just X, it's Y" / "Not only X, but also Y" / "It's not about X, it's about Y" / "No X. No Y. Just Z."
Remplacer par : des affirmations directes et tranchées.

2. RÈGLE DE 3 SYSTÉMATIQUE :
Interdit : toujours 3 éléments dans une liste ("efficacité, productivité et créativité").
Remplacer par : 1, 2 ou 4+ éléments. Jamais systématiquement 3.

3. FAUSSE PLAGE (False Range) :
Interdit : "From beginner to expert" / "From small businesses to large enterprises" / "From X to Y".
Remplacer par : des exemples spécifiques concrets.

4. STRUCTURES DE CONCLUSION RIGIDES :
Interdit : "Despite its [positif], [sujet] faces challenges..." / "In conclusion, while AI has shown..." / "Looking ahead..." / "As we move forward..."
Remplacer par : couper brusquement, laisser le lecteur conclure.

5. PARTICIPIALES EN FIN DE PHRASE :
Interdit : "The system analyzes data, revealing key insights" / "[Fait], [verbe en -ing] [analyse superficielle]".
Remplacer par : deux phrases séparées et directes.

6. ATTRIBUTIONS VAGUES :
Interdit : "Experts say..." / "Studies show..." / "According to industry reports..." / "Observers have noted..."
Remplacer par : une opinion personnelle tranchée OU un chiffre précis avec source.

7. OUVERTURES GÉNÉRIQUES :
Interdit : "In today's fast-paced world..." / "As the world continues to evolve..." / "In an era of unprecedented change..."
Remplacer par : un fait choc, un chiffre, ou une histoire.`,
    platform: "Tous",
    format: "Anti-IA",
  },
  {
    content: `RÈGLES D'ÉCRITURE POUR PARAÎTRE HUMAIN :

1. VARIATION DE LONGUEUR : mélanger phrases très courtes (3-5 mots). Et phrases longues avec des détails concrets. Alterner : longue, courte, courte, longue. Ne jamais garder la même longueur.

2. CHANGER DE PERSONNE : mélanger "je" (expérience perso) + "tu/vous" (interpellation) + "il/ils" (tiers). Exemple : "J'ai testé ce truc. Tu ne vas pas y croire. Les résultats ont explosé."

3. IMPERFECTIONS NATURELLES : opinions tranchées ("C'est nul." "Ça marche point."), hésitations ("Je ne sais pas si c'est la meilleure façon, mais..."), autocorrections ("Enfin, pas exactement."). Éviter le hedging constant (might, could, perhaps, generally).

4. CHIFFRES SPÉCIFIQUES : "47% des créateurs abandonnent après 3 semaines" au lieu de "La majorité des créateurs rencontrent des difficultés". Toujours préférer un chiffre précis à une généralisation.

5. ANECDOTES : inclure des détails précis, inattendus, impossibles à généraliser. Nommer des personnes, lieux, outils spécifiques. Décrire ce qu'on ressent.

6. PONCTUATION HUMAINE : points de suspension... pour créer de la tension. Tirets - pas des em-dashes — sauf rarement. Couper au milieu. Sans finir. Et reprendre. Éviter em-dashes en excès et Oxford comma systématique.

7. HUMOUR ET INATTENDU : jeter une phrase totalement inattendue dans une explication sérieuse. Auto-dérision. Avis contre-intuitif sans justification immédiate. Éviter un ton uniforme.`,
    platform: "Tous",
    format: "Anti-IA",
  },
  {
    content: `HOOKS HUMAINS VS HOOKS IA :

HOOKS QUI FONCTIONNENT (et qui ne sont pas IA) :
- Chiffre précis et surprenant : "340 euros en 11 jours. Sans audience."
- Question qui coupe : "Pourquoi tu postes encore sans être payé ?"
- Affirmation choc sans nuance : "Facebook paye mieux que YouTube. Voilà."
- Histoire en 2 phrases : "J'ai tout arrêté en janvier. Puis j'ai recommencé différemment."
- Paradoxe : "Moins tu postes, plus tu grossis. Voici pourquoi."
- Frustration partagée : "On m'a encore dit que Facebook c'est pour les vieux."

HOOKS À ÉVITER (typiques IA) :
- "In today's digital landscape..."
- "Have you ever wondered..."
- "It's no secret that..."
- "As a content creator, you know..."
- "Are you struggling with..."
- "The truth about [X] might surprise you"
- "Here's what nobody tells you about..."
- Tout hook qui commence par une généralisation sur "le monde" ou "la société"`,
    platform: "Tous",
    format: "Anti-IA",
  },
  {
    content: `APPELS À L'ACTION HUMAINS VS IA :

CTA HUMAINS (directs, tranchés, spécifiques) :
- "Dis-moi en commentaire si tu as déjà essayé ça."
- "Partage ça à quelqu'un qui en a besoin maintenant."
- "Je réponds à chaque commentaire ce soir."
- "Dis-moi juste OUI ou NON en commentaire."
- "Sauvegarde ça. Tu en auras besoin."
- Question ouverte spécifique : "C'est quoi ton plus grand problème avec [sujet précis] ?"

CTA IA (à éviter) :
- "Feel free to share your thoughts in the comments below!"
- "Don't forget to like and subscribe!"
- "What are your thoughts on this topic?"
- "I'd love to hear your perspective!"
- "Let me know if you found this helpful!"
- Tout CTA commençant par "Don't forget" ou "Remember to"`,
    platform: "Tous",
    format: "Anti-IA",
  },
];

async function seed() {
  console.log(`🛡️ Insertion de ${rules.length} règles Anti-IA v2...\n`);
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    const { error } = await supabase.from("viral_references").insert(r);
    const label = r.content.slice(0, 55).replace(/\n/g, " ");
    if (error) console.error(`❌ ${i + 1}. ${error.message}`);
    else console.log(`✅ ${i + 1}. ${label}...`);
  }
  console.log("\n🛡️ Seed Anti-IA v2 terminé !");
}

seed();
