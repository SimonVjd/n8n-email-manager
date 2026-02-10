import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reklamačný poriadok | Email Manager',
  description: 'Reklamačný poriadok služby Email Manager podľa zákona č. 108/2024 Z.z.',
};

function Placeholder({ text }: { text: string }) {
  return <span className="text-[var(--danger-600)] font-semibold">[DOPLNIŤ — {text}]</span>;
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3 mt-10">{title}</h2>
      <div className="text-sm leading-relaxed text-[var(--text-secondary)] space-y-3">{children}</div>
    </section>
  );
}

export default function ReklamaciaPage() {
  return (
    <article>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Reklamačný poriadok</h1>
      <p className="text-sm text-[var(--text-tertiary)] mb-8">Posledná aktualizácia: 10. februára 2026</p>

      <Section id="general" title="1. Všeobecné ustanovenia">
        <p>
          Tento Reklamačný poriadok upravuje postup pri uplatňovaní práv spotrebiteľa zo zodpovednosti za vady
          digitálnej služby Email Manager v súlade so zákonom č. 108/2024 Z.z. o ochrane spotrebiteľa.
        </p>
        <p>
          Prevádzkovateľ: <Placeholder text="Obchodné meno" />,
          sídlo: <Placeholder text="Sídlo" />,
          IČO: <Placeholder text="IČO" />.
        </p>
      </Section>

      <Section id="liability" title="2. Zodpovednosť za vady digitálnej služby">
        <p>
          Prevádzkovateľ zodpovedá za to, že digitálna služba:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Zodpovedá opisu, rozsahu a kvalite uvedenej v zmluve a VOP</li>
          <li>Je vhodná na účel, na ktorý sa služby rovnakého druhu bežne používajú</li>
          <li>Je poskytovaná s náležitou odbornou starostlivosťou</li>
          <li>Zodpovedá aktuálnemu stavu techniky v čase poskytovania</li>
        </ul>
      </Section>

      <Section id="claim" title="3. Uplatnenie reklamácie">
        <p>Reklamáciu môžete uplatniť:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Emailom:</strong> <Placeholder text="Reklamačný email" /> — s opisom vady a dátumom jej zistenia
          </li>
          <li>
            <strong>Písomne:</strong> na adresu <Placeholder text="Sídlo" />
          </li>
        </ul>
        <p>
          Reklamácia musí obsahovať:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Identifikáciu spotrebiteľa (meno, email)</li>
          <li>Opis vady a kedy sa prejavila</li>
          <li>Požadovaný spôsob vybavenia</li>
        </ul>
      </Section>

      <Section id="deadlines" title="4. Lehoty">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="text-left py-2 pr-4 font-medium text-[var(--text-primary)]">Úkon</th>
                <th className="text-left py-2 font-medium text-[var(--text-primary)]">Lehota</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-secondary)]">
              <tr className="border-b border-[var(--border-primary)]">
                <td className="py-2 pr-4">Potvrdenie prijatia reklamácie</td>
                <td className="py-2">Ihneď, najneskôr do 2 pracovných dní</td>
              </tr>
              <tr className="border-b border-[var(--border-primary)]">
                <td className="py-2 pr-4">Vybavenie reklamácie</td>
                <td className="py-2">Do 30 dní od uplatnenia</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Uplatnenie reklamácie spotrebiteľom</td>
                <td className="py-2">Bez zbytočného odkladu po zistení vady</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="resolution" title="5. Spôsoby vybavenia reklamácie">
        <p>Spotrebiteľ má podľa povahy vady právo na:</p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li><strong>Bezplatné odstránenie vady</strong> (oprava, aktualizácia) — primárny nápravný prostriedok</li>
          <li><strong>Primeranú zľavu z ceny</strong> — ak oprava nie je možná alebo by bola neprimerane nákladná</li>
          <li><strong>Odstúpenie od zmluvy</strong> — ak:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>vada je závažná (služba je nepoužiteľná)</li>
              <li>vada sa opakovane vyskytuje aj po oprave</li>
              <li>prevádzkovateľ nevybavil reklamáciu v lehote 30 dní</li>
            </ul>
          </li>
        </ol>
      </Section>

      <Section id="costs" title="6. Náklady">
        <p>
          Reklamácia sa vybavuje <strong>bezplatne</strong>. Spotrebiteľ nenesie žiadne náklady spojené s reklamačným konaním.
        </p>
      </Section>
    </article>
  );
}
