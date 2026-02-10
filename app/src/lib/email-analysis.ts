import OpenAI from 'openai';
import { query } from './db';
import type { FAQ, ReplyPattern } from './types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AnalysisResult {
  summary_sk: string | null;
  category: string;
  faq_matched_id: string | null;
  auto_reply_sk: string | null;
}

export async function analyzeEmail(
  clientId: string,
  subject: string,
  from_address: string,
  body: string
): Promise<AnalysisResult> {
  let summary_sk: string | null = null;
  let category = 'NORMAL';
  let faq_matched_id: string | null = null;
  let auto_reply_sk: string | null = null;

  // Load client's FAQ patterns
  const faqs = await query<FAQ>(
    'SELECT * FROM faqs WHERE client_id = $1',
    [clientId]
  );

  const faqContext = faqs.length > 0
    ? `\n\nDostupné FAQ šablóny (ID | Vzor otázky):
${faqs.map(f => `- ${f.id} | ${f.question_pattern}`).join('\n')}

DÔLEŽITÉ pravidlá pre FAQ matching:
- Matchuj FAQ ak sa email pýta na tú istú TÉMU/ZÁMER ako FAQ vzor — nemusí používať rovnaké slová, ale VÝZNAM musí byť rovnaký.
- Príklad SPRÁVNEHO matchu: "kedy otvárate?" alebo "aké máte hodiny?" → FAQ o otváracích hodinách (rovnaký zámer).
- Príklad NESPRÁVNEHO matchu: "koľko účtujete za hodinu?" → to je otázka o CENE, NIE o otváracích hodinách! Podobné slová, ale iný zámer.
- Porovnávaj vždy ZÁMER emailu s TÉMOU FAQ, nie jednotlivé slová.
- Ak zámer emailu nesedí s témou žiadnej FAQ, nastav category na NORMAL.`
    : '';

  try {
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: `Si asistent na analýzu emailov. Vráť JSON objekt s týmito poľami:

1. "summary_sk" - KRÁTKE zhrnutie v slovenčine (1 veta, max 15 slov). Neprepisuj email, ale vysvetli čo odosielateľ chce alebo o čom informuje.

2. "category" - jedna z: URGENT, TIME_SENSITIVE, FAQ, NORMAL, SPAM
   - URGENT: slová ako "súrne", "okamžite", "hneď", "kritické", alebo hrozba/problém
   - TIME_SENSITIVE: faktúry, termíny, splatnosti, stretnutia, deadliny
   - FAQ: email sa pýta na niečo, na čo existuje FAQ šablóna (pozri nižšie)
   - NORMAL: bežná komunikácia bez naliehavosti
   - SPAM: reklama, newsletter, nevyžiadaná pošta

3. "faq_id" - ak category je "FAQ", vráť ID zodpovedajúcej FAQ šablóny. Inak null.

4. "email_type" - krátky popis typu emailu v slovenčine (napr. "cenová ponuka", "reklamácia", "žiadosť o informácie", "newsletter"). Max 3-4 slová.
${faqContext}

Odpovedz IBA platným JSON, nič iné.

Predmet: ${subject}
Od: ${from_address}
Telo: ${body.substring(0, 2000)}`,
      temperature: 0.2,
    });

    const text = response.output_text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let emailType = 'bežný email';
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      summary_sk = parsed.summary_sk || null;
      category = parsed.category || 'NORMAL';
      faq_matched_id = parsed.faq_id || null;
      emailType = parsed.email_type || 'bežný email';
    }

    const validCategories = ['URGENT', 'TIME_SENSITIVE', 'FAQ', 'NORMAL', 'SPAM'];
    if (!validCategories.includes(category)) {
      category = 'NORMAL';
    }

    // Validate faq_matched_id exists
    if (faq_matched_id) {
      const matchedFaq = faqs.find(f => f.id === faq_matched_id);
      if (!matchedFaq) {
        faq_matched_id = null;
        if (category === 'FAQ') category = 'NORMAL';
      }
    }

    // Generate auto-reply for ALL emails (not just FAQ)
    if (category !== 'SPAM') {
      if (faq_matched_id && category === 'FAQ') {
        // FAQ match — use FAQ template as base
        const matchedFaq = faqs.find(f => f.id === faq_matched_id)!;
        auto_reply_sk = await generateAutoReply(
          clientId, subject, from_address, body, matchedFaq.response_template_sk
        );
        await query(
          'UPDATE faqs SET usage_count = usage_count + 1 WHERE id = $1',
          [faq_matched_id]
        );
      } else {
        // Non-FAQ — generate smart reply using patterns + history
        auto_reply_sk = await generateSmartReply(
          clientId, subject, from_address, body, emailType
        );
      }
    }
  } catch (error) {
    console.error('OpenAI analysis error:', error);
  }

  return { summary_sk, category, faq_matched_id, auto_reply_sk };
}

async function generateAutoReply(
  clientId: string,
  subject: string,
  from_address: string,
  body: string,
  faqTemplate: string
): Promise<string | null> {
  // Load client's reply history for style learning
  const historyContext = await getReplyHistoryContext(clientId);

  try {
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: `Na základe FAQ šablóny vytvor personalizovanú odpoveď v slovenčine.

FAQ šablóna odpovede (AUTORITATÍVNY ZDROJ FAKTOV):
${faqTemplate}

Pôvodný email:
Predmet: ${subject}
Od: ${from_address}
Telo: ${body.substring(0, 1000)}
${historyContext}
Pravidlá:
- KRITICKÉ: Všetky fakty (čísla, hodiny, ceny, adresy, mená, telefónne čísla) musíš prevziať PRESNE z FAQ šablóny. NEMEŇ žiadne údaje!
- Odpoveď musí byť zdvorilá a profesionálna
- Môžeš upraviť pozdrav a formuláciu viet, ale FAKTY musia zostať identické s FAQ šablónou
- Prispôsob oslovenie podľa mena odosielateľa ak je známe
- Začni pozdravom, zakonči podpisom "S pozdravom"
- Maximálne 5-8 viet

Vráť IBA text odpovede, nič iné.`,
      temperature: 0.3,
    });

    return response.output_text.trim();
  } catch (error) {
    console.error('Auto-reply generation error:', error);
    return null;
  }
}

async function generateSmartReply(
  clientId: string,
  subject: string,
  from_address: string,
  body: string,
  emailType: string
): Promise<string | null> {
  // Load reply patterns and history for context
  const patterns = await query<ReplyPattern>(
    `SELECT email_pattern, reply_template, confidence_score
     FROM reply_patterns WHERE client_id = $1 AND confidence_score > 0.3
     ORDER BY confidence_score DESC LIMIT 10`,
    [clientId]
  );

  const historyContext = await getReplyHistoryContext(clientId);

  const patternsContext = patterns.length > 0
    ? `\nNaučené vzory odpovedí klienta:
${patterns.map(p => `- Typ "${p.email_pattern}" → "${p.reply_template.substring(0, 200)}..." (dôvera: ${Math.round(p.confidence_score * 100)}%)`).join('\n')}`
    : '';

  try {
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: `Vytvor profesionálnu odpoveď v slovenčine na tento email.

Pôvodný email:
Predmet: ${subject}
Od: ${from_address}
Typ emailu: ${emailType}
Telo: ${body.substring(0, 1500)}
${patternsContext}${historyContext}
Pravidlá:
- Odpoveď musí byť zdvorilá a profesionálna v slovenčine
- Ak existujú podobné naučené vzory, inšpiruj sa ich štýlom a tónom
- Prispôsob odpoveď konkrétnemu obsahu emailu
- Začni pozdravom, zakonči podpisom "S pozdravom"
- Maximálne 5-8 viet
- Ak je email newsletter/reklama na ktorú sa bežne neodpovedá, vráť prázdny string

Vráť IBA text odpovede, nič iné.`,
      temperature: 0.3,
    });

    const result = response.output_text.trim();
    return result.length > 10 ? result : null;
  } catch (error) {
    console.error('Smart reply generation error:', error);
    return null;
  }
}

async function getReplyHistoryContext(clientId: string): Promise<string> {
  // Get last 10 sent/approved replies for style learning
  const history = await query<{ subject: string; auto_reply_sk: string; reply_edited_text: string | null }>(
    `SELECT subject, auto_reply_sk, reply_edited_text FROM emails
     WHERE client_id = $1 AND reply_status IN ('sent', 'edited_sent', 'auto_sent')
     AND auto_reply_sk IS NOT NULL
     ORDER BY reply_sent_at DESC LIMIT 10`,
    [clientId]
  );

  if (history.length === 0) return '';

  return `\nPredchádzajúce schválené odpovede klienta (použi ich štýl a tón):
${history.map(h => {
    const usedReply = h.reply_edited_text || h.auto_reply_sk;
    return `- Email "${h.subject}" → "${usedReply.substring(0, 150)}..."`;
  }).join('\n')}`;
}
