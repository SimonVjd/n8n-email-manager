import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | Email Manager',
  description: 'Informácie o používaní cookies v službe Email Manager.',
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3 mt-10">{title}</h2>
      <div className="text-sm leading-relaxed text-[var(--text-secondary)] space-y-3">{children}</div>
    </section>
  );
}

export default function CookiesPage() {
  return (
    <article>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Cookie Policy</h1>
      <p className="text-sm text-[var(--text-tertiary)] mb-8">Posledná aktualizácia: 10. februára 2026</p>

      <Section id="what" title="1. Čo sú cookies">
        <p>
          Cookies sú malé textové súbory, ktoré sa ukladajú vo vašom prehliadači pri návšteve webovej stránky.
          Pomáhajú nám zabezpečiť správne fungovanie stránky, zapamätať si vaše preferencie a zlepšiť váš zážitok.
        </p>
      </Section>

      <Section id="necessary" title="2. Nevyhnutné cookies (vždy aktívne)">
        <p>
          Tieto cookies sú potrebné na fungovanie stránky. Bez nich by ste sa nemohli prihlásiť ani používať základné funkcie.
          Nepotrebujú váš súhlas.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="text-left py-2 pr-4 font-medium text-[var(--text-primary)]">Cookie</th>
                <th className="text-left py-2 pr-4 font-medium text-[var(--text-primary)]">Účel</th>
                <th className="text-left py-2 font-medium text-[var(--text-primary)]">Expirácia</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-secondary)]">
              <tr className="border-b border-[var(--border-primary)]">
                <td className="py-2 pr-4 font-mono text-xs">session</td>
                <td className="py-2 pr-4">Autentifikácia používateľa (JWT)</td>
                <td className="py-2">7 dní</td>
              </tr>
              <tr className="border-b border-[var(--border-primary)]">
                <td className="py-2 pr-4 font-mono text-xs">cookie_consent</td>
                <td className="py-2 pr-4">Uloženie vašich preferencií cookies</td>
                <td className="py-2">12 mesiacov</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="analytics" title="3. Analytické cookies (len so súhlasom)">
        <p>
          Tieto cookies nám pomáhajú pochopiť, ako používate stránku, čo nám umožňuje ju zlepšovať.
          Ukladajú sa len ak im udelíte súhlas.
        </p>
        <p className="text-[var(--text-tertiary)] italic">
          Momentálne nepoužívame žiadne analytické cookies. Ak ich v budúcnosti zavedieme, budeme vás informovať
          a vyžadovať váš súhlas.
        </p>
      </Section>

      <Section id="marketing" title="4. Marketingové cookies (len so súhlasom)">
        <p>
          Marketingové cookies sa používajú na sledovanie návštevníkov naprieč webovými stránkami za účelom
          zobrazovania relevantnej reklamy.
        </p>
        <p className="text-[var(--text-tertiary)] italic">
          Momentálne nepoužívame žiadne marketingové cookies. Ak ich v budúcnosti zavedieme, budeme vás informovať
          a vyžadovať váš súhlas.
        </p>
      </Section>

      <Section id="manage" title="5. Ako spravovať cookies">
        <p>Cookies môžete spravovať nasledovnými spôsobmi:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Cookie banner</strong> — pri prvej návšteve sa zobrazí banner, kde si zvolíte preferencie.
            Nastavenia môžete kedykoľvek zmeniť kliknutím na &ldquo;Nastavenia cookies&rdquo; v päte stránky.
          </li>
          <li>
            <strong>Nastavenia prehliadača</strong> — väčšina prehliadačov umožňuje blokovať alebo mazať cookies.
            Upozorňujeme, že blokovanie nevyhnutných cookies môže ovplyvniť funkčnosť stránky.
          </li>
        </ul>
      </Section>

      <Section id="legal" title="6. Právny základ">
        <p>
          Používanie cookies sa riadi § 109 ods. 8 zákona č. 452/2021 Z.z. o elektronických komunikáciách:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Nevyhnutné cookies:</strong> oprávnený záujem — výnimka z povinnosti súhlasu (nevyhnutné na poskytnutie služby)</li>
          <li><strong>Analytické/marketingové cookies:</strong> súhlas používateľa (opt-in)</li>
        </ul>
      </Section>
    </article>
  );
}
