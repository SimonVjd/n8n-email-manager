import OpenAI from 'openai';
import { query } from './db';
import type { FAQ } from './types';

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

Ak email zodpovedá niektorej FAQ, nastav "category" na "FAQ" a "faq_id" na ID danej FAQ.`
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
${faqContext}

Odpovedz IBA platným JSON, nič iné.

Predmet: ${subject}
Od: ${from_address}
Telo: ${body.substring(0, 2000)}`,
      temperature: 0.2,
    });

    const text = response.output_text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      summary_sk = parsed.summary_sk || null;
      category = parsed.category || 'NORMAL';
      faq_matched_id = parsed.faq_id || null;
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

    // Generate auto-reply if FAQ matched
    if (faq_matched_id && category === 'FAQ') {
      const matchedFaq = faqs.find(f => f.id === faq_matched_id)!;
      auto_reply_sk = await generateAutoReply(
        subject,
        from_address,
        body,
        matchedFaq.response_template_sk
      );

      // Increment FAQ usage count
      await query(
        'UPDATE faqs SET usage_count = usage_count + 1 WHERE id = $1',
        [faq_matched_id]
      );
    }
  } catch (error) {
    console.error('OpenAI analysis error:', error);
  }

  return { summary_sk, category, faq_matched_id, auto_reply_sk };
}

async function generateAutoReply(
  subject: string,
  from_address: string,
  body: string,
  faqTemplate: string
): Promise<string | null> {
  try {
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: `Na základe FAQ šablóny vytvor personalizovanú odpoveď v slovenčine.

FAQ šablóna odpovede:
${faqTemplate}

Pôvodný email:
Predmet: ${subject}
Od: ${from_address}
Telo: ${body.substring(0, 1000)}

Pravidlá:
- Odpoveď musí byť zdvorilá a profesionálna
- Použi informácie z FAQ šablóny
- Prispôsob odpoveď kontextu pôvodného emailu
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
