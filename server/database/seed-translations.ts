/**
 * Seed portfolio item descriptions in EN, FR, HE.
 * Run with: npx tsx server/database/seed-translations.ts
 */
import Database from 'better-sqlite3'
import { existsSync } from 'fs'

const DB_PATH = process.env.DATABASE_URL || './data/sqlite.db'
const LOCALES = ['en', 'fr', 'he']

const translations: Record<string, Record<string, string>> = {
  1: {
    en: 'Premium IT consulting — semantic brand architecture with Low-Poly geometry and calligraphic script in monochrome.',
    fr: 'Conseil IT premium — architecture sémantique de marque mêlant géométrie Low-Poly et calligraphie monochrome.',
    he: 'ייעוץ IT פרימיום — ארכיטקטורה סמנטית של מותג המשלבת גאומטריית Low-Poly וקליגרפיה במונוכרום.'
  },
  2: {
    en: 'Knowledge automation platform — comprehensive identity with Renaissance typography and premium color triad.',
    fr: 'Plateforme d\'automatisation des connaissances — identité complète avec typographie Renaissance et triade chromatique premium.',
    he: 'פלטפורמת אוטומציית ידע — זהות חזותית מקיפה עם טיפוגרפיה רנסאנסית ושלישיית צבעים פרימיום.'
  },
  3: {
    en: 'Feedback collection service — emotional branding with an interactive droplet mascot replacing standard scales.',
    fr: 'Service de collecte d\'avis — branding émotionnel avec une mascotte-goutte interactive remplaçant les échelles standards.',
    he: 'שירות איסוף משוב — מיתוג רגשי עם מסכות-טיפה אינטראקטיבית המחליפה סולמות סטנדרטיים.'
  },
  4: {
    en: 'B2B framework — brand system with a puppet master metaphor, modular geometry, anthracite and signal red.',
    fr: 'Framework B2B — système de marque avec métaphore du marionnettiste, géométrie modulaire, anthracite et rouge signal.',
    he: 'מסגרת B2B — מערכת מותג עם מטפורת בובנאי, גאומטריה מודולרית, אנתרציט ואדום אותת.'
  },
  5: {
    en: 'Software development studio — strict minimalism with dynamic horizontal lines, deep blue and orange-gold accent.',
    fr: 'Studio de développement logiciel — minimalisme strict avec lignes horizontales dynamiques, bleu profond et accent orange-or.',
    he: 'סטודיו לפיתוח תוכנה — מינימליזם קפדני עם קווים אופקיים דינמיים, כחול עמוק והדגשה כתום-זהב.'
  },
  6: {
    en: 'Israeli spa service — premium identity with tactile natural aesthetics, sandy hues and deep burgundy accent.',
    fr: 'Service spa israélien — identité premium avec esthétique naturelle tactile, tons sable et accent bordeaux profond.',
    he: 'שירות ספא ישראלי — זהות פרימיום עם אסתטיקה טבעית טקטילית, גווני חול והדגשת בורדו עמוקה.'
  },
  7: {
    en: 'Premium personal assistant — identity with calligraphic monogram, black and gold, leather embossing.',
    fr: 'Assistant personnel premium — identité avec monogramme calligraphique, noir et or, gaufrage sur cuir.',
    he: 'עוזר אישי פרימיום — זהות עם מונוגרמה קליגרפית, שחור וזהב, הטבעה על עור.'
  },
  8: {
    en: 'HoReCa software — identity with curly brackets as a code symbol, black-red scheme, POS adaptation.',
    fr: 'Logiciel HoReCa — identité avec accolades comme symbole de code, schéma noir-rouge, adaptation POS.',
    he: 'תוכנת HoReCa — זהות עם סוגריים מסולסלים כסמל קוד, סכמת שחור-אדום, התאמה ל-POS.'
  },
  9: {
    en: 'Israeli sushi delivery service — branding with mouse mascot, craft packaging, warm orange, home comfort.',
    fr: 'Service de livraison de sushis israélien — branding avec mascotte souris, emballage artisanal, orange chaleureux.',
    he: 'שירות משלוחי סושי ישראלי — מיתוג עם מסכות עכבר, אריזה בעבודת יד, כתום חמים.'
  },
  10: {
    en: 'Cryptocurrency project — tech-driven identity with modular geometry, deep dark tones, green accent.',
    fr: 'Projet cryptomonnaie — identité technologique avec géométrie modulaire, tons foncés profonds, accent vert.',
    he: 'פרויקט מטבעות קריפטו — זהות טכנולוגית עם גאומטריה מודולרית, גוונים כהים עמוקים, הדגשה ירוקה.'
  },
  11: {
    en: 'Keratin smoothing studio — premium identity with purple and gold, minimalist logo, luxury packaging.',
    fr: 'Studio de lissage kératine — identité premium avec violet et or, logo minimaliste, emballage luxueux.',
    he: 'סטודיו להחלקת קרטין — זהות פרימיום עם סגול וזהב, לוגו מינימליסטי, אריזה יוקרתית.'
  },
  12: {
    en: 'Asian fast food chain — visual system with hand-drawn typography in a cloud, wave pattern, vibrant colors.',
    fr: 'Chaîne de fast-food asiatique — système visuel avec typographie manuscrite dans un nuage, motif de vagues, couleurs vives.',
    he: 'רשת מזון מהיר אסייתי — מערכת ויזואלית עם טיפוגרפיה בכתב יד בתוך ענן, תבנית גלים, צבעים עזים.'
  },
  13: {
    en: 'Nail studio in Israel — glamorous brand in Marilyn Monroe style with black-red-purple palette and vintage patterns.',
    fr: 'Studio de manucure en Israël — marque glamour dans le style Marilyn Monroe, palette noir-rouge-violet, motifs vintage.',
    he: 'סטודיו לציפורניים בישראל — מותג זוהר בסגנון מרילין מונרו, פלטת שחור-אדום-סגול, דפוסי וינטג\''
  },
  14: {
    en: 'Crypto project — identity with a rocket in an orbital contour, deep blue and sky blue for the fintech sector.',
    fr: 'Projet crypto — identité avec une fusée dans un contour orbital, bleu profond et bleu ciel pour le secteur fintech.',
    he: 'פרויקט קריפטו — זהות עם רקטה בקו מתאר מסלולי, כחול עמוק ותכלת.'
  },
  15: {
    en: 'Israeli catering — style with a calligraphic mark, warm tactile tones, family tradition atmosphere.',
    fr: 'Traiteur israélien — style avec un signe calligraphique, tons tactiles chaleureux, ambiance de traditions familiales.',
    he: 'קייטרינג ישראלי — סגנון עם סימן קליגרפי, גוונים טקטיליים חמימים, אווירת מסורת משפחתית.'
  },
  16: {
    en: 'Car importer — brand identity with aggressive sports car geometry, racing yellow, tire tread pattern.',
    fr: 'Importateur automobile — identité de marque avec géométrie agressive de voiture de sport, jaune de course, motif de bande de roulement.',
    he: 'יבואן רכב — זהות מותג עם גאומטריה אגרסיבית של מכונית ספורט, צהוב מירוצים, תבנית צמיגים.'
  },
  17: {
    en: 'Content creation software — identity with hand-drawn typography, purple glow, seamless interface.',
    fr: 'Logiciel de création de contenu — identité avec typographie manuscrite, lueur violette, interface fluide.',
    he: 'תוכנת יצירת תוכן — זהות עם טיפוגרפיה בכתב יד, זוהר סגול, ממשק חלק.'
  },
  18: {
    en: 'Luxury jewelry brand — minimalist identity with serif typeface and calligraphy, monogram of mirrored E letters.',
    fr: 'Marque de joaillerie de luxe — identité minimaliste avec police à empattement et calligraphie, monogramme de E en miroir.',
    he: 'מותג תכשיטי יוקרה — זהות מינימליסטית עם טיפוגרפיה סריפית וקליגרפיה, מונוגרמה של שתי אותיות E במראה.'
  },
  19: {
    en: 'Israeli recruitment agency — identity with Hebrew niqqud integrated into the logo, bright yellow, bold typography.',
    fr: 'Agence de recrutement israélienne — identité avec points de vocalisation hébreux intégrés au logo, jaune vif, typographie structurée.',
    he: 'סוכנות כוח אדם ישראלית — זהות עם ניקוד עברי המשולב בלוגו, צהוב בוהק, טיפוגרפיה מבנית.'
  },
  20: {
    en: 'JS framework — identity styling the Hebrew letter Tzadi as a UI element, purple gradient, Modern Heritage.',
    fr: 'Framework JS — identité stylisant la lettre hébraïque Tzadi en élément UI, dégradé violet, Modern Heritage.',
    he: 'מסגרת JS — זהות המעצבת את האות העברית צדי כאלמנט UI, גרדיאנט סגול, מורשת מודרנית.'
  },
  21: {
    en: 'Business automation system — branding with ampersand as a connectivity symbol, coral-red accent on deep dark background.',
    fr: 'Système d\'automatisation d\'entreprise — branding avec esperluette comme symbole de connectivité, accent rouge corail sur fond sombre.',
    he: 'מערכת אוטומציה עסקית — מיתוג עם אמפרסנד כסמל קישוריות, הדגשת אדום-אלמוג על רקע כהה.'
  },
  22: {
    en: 'Card board game — identity with an engraved forest spirit, wood carving imitation, natural mossy tones.',
    fr: 'Jeu de cartes — identité avec un esprit de la forêt gravé, imitation de sculpture sur bois, tons naturels de mousse.',
    he: 'משחק קלפים — זהות עם רוח יער חרוטה, חיקוי גילוף בעץ, גווני אזוב טבעיים.'
  },
  23: {
    en: 'IT company — brand identity with sharp geometric forms, graphite and signal orange, bilingual layout.',
    fr: 'Entreprise IT — identité de marque avec formes géométriques angulaires, graphite et orange signal, mise en page bilingue.',
    he: 'חברת IT — זהות מותג עם צורות גאומטריות חדות, גרפיט וכתום אותת, מערך דו-לשוני.'
  },
  24: {
    en: 'Spa salon in Israel — identity with an oriental lamp logo, turquoise and sandy hues, Mediterranean style.',
    fr: 'Salon spa en Israël — identité avec un logo de lampe orientale, tons turquoise et sable, style méditerranéen.',
    he: 'ספא בישראל — זהות עם מנורה מזרחית בלוגו, גווני טורקיז וחול, סגנון ים-תיכוני.'
  },
  25: {
    en: 'Web3 studio — identity with a circular arrow structure, gold on dark, blockchain validation symbolism.',
    fr: 'Studio Web3 — identité avec une structure de flèches circulaires, or sur fond sombre, symbolique de validation blockchain.',
    he: 'סטודיו Web3 — זהות עם מבנה חצים מעגלי, זהב על רקע כהה, סימבוליקה של אימות בלוקצ\'יין.'
  },
  26: {
    en: 'Financial analytics software — identity with a fusion of letter P and code symbols, graphite with gold accent.',
    fr: 'Logiciel d\'analyse financière — identité fusionnant la lettre P avec des symboles de code, graphite avec accent doré.',
    he: 'תוכנת אנליטיקה פיננסית — זהות הממזגת את האות P עם סמלי קוד, גרפיט עם הדגשת זהב.'
  },
  27: {
    en: 'Language teacher — personal brand with custom Britney lettering, lilac accent on the letter E, strict type pair.',
    fr: 'Professeur de langues — marque personnelle avec lettrage Britney sur mesure, accent lilas sur la lettre E, paire typographique stricte.',
    he: 'מורה לשפות — מותג אישי עם אותיות Britney מותאמות אישית, הדגשת לילך על האות E, זוג טיפוגרפי קפדני.'
  },
  28: {
    en: 'Collaboration platform — identity with modified Nord-Star Deco glyphs, orange and deep dark.',
    fr: 'Plateforme de collaboration — identité avec glyphes Nord-Star Deco modifiés, orange et noir profond.',
    he: 'פלטפורמת שיתוף פעולה — זהות עם גליפים Nord-Star Deco מותאמים, כתום וכהה עמוק.'
  },
  29: {
    en: 'Martial arts club — brand with anthropomorphic capybara in boxing gloves, yellow-black contrast, Ruslan Display font.',
    fr: 'Club d\'arts martiaux — marque avec capybara anthropomorphique en gants de boxe, contraste jaune-noir, police Ruslan Display.',
    he: 'מועדון אמנויות לחימה — מותג עם קפיבארה אנתרופומורפית בכפפות אגרוף, קונטרסט צהוב-שחור, גופן Ruslan Display.'
  },
  30: {
    en: 'Designer Nikita T. — rebranding fusing Cyrillic vyaz with Chinese zhuanke seal carving, cinnabar and parchment.',
    fr: 'Designer Nikita T. — rebranding fusionnant la vyaz cyrillique avec la gravure de sceau chinoise zhuanke, cinabre et parchemin.',
    he: 'המעצב ניקיטה ט. — מיתוג מחדש הממזג ויאז קירילית עם חותמת סינית zhuanke, צינבר וקלף.'
  },
  31: {
    en: 'Travel YouTube channel — identity with a cowboy hat symbol, warm earthy tones, animated elements.',
    fr: 'Chaîne YouTube de voyages — identité avec un chapeau de cowboy comme symbole, tons terreux chaleureux, éléments animés.',
    he: 'ערוץ יוטיוב טיולים — זהות עם כובע קאובוי כסמל, גוונים אדמתיים חמימים, אלמנטים מונפשים.'
  },
  32: {
    en: 'Crypto ecosystem — brand with minimalist geometric mark combining a blockchain node and shield, neon purple-pink palette.',
    fr: 'Écosystème crypto — marque avec signe géométrique minimaliste combinant nœud blockchain et bouclier, palette néon violet-rose.',
    he: 'מערכת אקולוגית קריפטו — מותג עם סימן גאומטרי מינימליסטי המשלב צומת בלוקצ\'יין ומגן, פלטת ניאון סגול-ורוד.'
  },
  33: {
    en: 'Technology standard — identity with a feather wing and nC acronym, signal orange, engineering discipline.',
    fr: 'Standard technologique — identité avec une aile de plume et l\'acronyme nC, orange signal, discipline d\'ingénierie.',
    he: 'תקן טכנולוגי — זהות עם כנף נוצה וראשי תיבות nC, כתום אותת, משמעת הנדסית.'
  },
  34: {
    en: 'Jewelry brand in Israel — identity with a heart silhouette and integrated letter A, purple-pink gradient, heart pattern.',
    fr: 'Marque de bijoux en Israël — identité avec un cœur et une lettre A intégrée, dégradé violet-rose, motif cœur.',
    he: 'מותג תכשיטים בישראל — זהות עם צורת לב ואות A משולבת, גרדיאנט סגול-ורוד, דפוס לב.'
  },
  35: {
    en: 'Hebrew learning app — identity with a constructive copybook grid, calligraphic plasticity, educational guide lines.',
    fr: 'Application d\'apprentissage de l\'hébreu — identité avec une grille constructive d\'écriture, plasticité calligraphique, lignes directrices pédagogiques.',
    he: 'אפליקציית לימוד עברית — זהות עם רשת כתיבה קונסטרוקטיבית, פלסטיות קליגרפית, קווי הדרכה לימודיים.'
  },
  36: {
    en: 'Israeli export company — branding with bold typography, a diagonal through-line symbolizing flow and customs clearance.',
    fr: 'Entreprise d\'exportation israélienne — branding avec typographie audacieuse, une ligne diagonale symbolisant le flux et le dédouanement.',
    he: 'חברת יצוא ישראלית — מיתוג עם טיפוגרפיה בולדית, קו אלכסוני המסמל זרימה ושחרור ממכס.'
  }
}

const db = new Database(DB_PATH)
const insert = db.prepare('INSERT OR IGNORE INTO translations (locale, key, value, updated_at) VALUES (?, ?, ?, ?)')
const insertMany = db.transaction((rows: Array<[string, string, string]>) => {
  for (const [locale, key, value] of rows) {
    insert.run(locale, key, value, Date.now())
  }
})

let total = 0
for (const [itemId, locales] of Object.entries(translations)) {
  const rows: Array<[string, string, string]> = []
  for (const [locale, text] of Object.entries(locales)) {
    const key = `portfolio_item.${itemId}.description`
    rows.push([locale, key, text])
  }
  insertMany(rows)
  total += rows.length
}

console.log(`✅ Inserted ${total} translation rows for ${Object.keys(translations).length} items`)
