import type { Metadata } from 'next';
import PrintButton from './PrintButton';

export const metadata: Metadata = {
  title: 'Všeobecné obchodné podmienky | Email Manager',
  description: 'Všeobecné obchodné podmienky služby Email Manager podľa zákona č. 108/2024 Z.z.',
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

const TOC = [
  { id: 'general', label: '1. Základné ustanovenia' },
  { id: 'definitions', label: '2. Definície' },
  { id: 'service', label: '3. Opis služby' },
  { id: 'contract', label: '4. Uzavretie zmluvy' },
  { id: 'price', label: '5. Cena a platba' },
  { id: 'withdrawal', label: '6. Odstúpenie od zmluvy' },
  { id: 'duration', label: '7. Trvanie a ukončenie' },
  { id: 'complaints', label: '8. Reklamácie' },
  { id: 'ai-usage', label: '9. Používanie AI' },
  { id: 'disputes', label: '10. Riešenie sporov' },
  { id: 'final', label: '11. Záverečné ustanovenia' },
  { id: 'appendix', label: 'Príloha č. 1' },
];

export default function TermsPage() {
  return (
    <article>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Všeobecné obchodné podmienky</h1>
      <p className="text-sm text-[var(--text-tertiary)] mb-8">Posledná aktualizácia: 10. februára 2026</p>

      <nav className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 mb-8">
        <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Obsah</p>
        <ol className="columns-2 gap-6 text-sm space-y-1.5">
          {TOC.map(item => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-[var(--primary-600)] hover:text-[var(--primary-700)] transition-colors">
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Section id="general" title="1. Základné ustanovenia">
        <p>
          Tieto Všeobecné obchodné podmienky (ďalej len &ldquo;VOP&rdquo;) upravujú vzťah medzi prevádzkovateľom služby Email Manager
          a spotrebiteľom podľa zákona č. 108/2024 Z.z. o ochrane spotrebiteľa.
        </p>
        <p>
          Prevádzkovateľ: <Placeholder text="Obchodné meno" />,
          sídlo: <Placeholder text="Sídlo" />,
          IČO: <Placeholder text="IČO" />,
          DIČ: <Placeholder text="DIČ" />,
          zapísaný v <Placeholder text="Register a číslo" />.
        </p>
        <p>
          Kontakt: <Placeholder text="Email" />, <Placeholder text="Telefón" />.
        </p>
      </Section>

      <Section id="definitions" title="2. Definície">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Služba</strong> — webová aplikácia Email Manager na správu emailov s podporou umelej inteligencie</li>
          <li><strong>Predplatné</strong> — časovo ohraničené právo používať Službu za dohodnutú cenu</li>
          <li><strong>Používateľ (Spotrebiteľ)</strong> — fyzická osoba, ktorá uzatvára zmluvu mimo rámca svojej podnikateľskej činnosti</li>
          <li><strong>Zmluva na diaľku</strong> — zmluva uzavretá výlučne prostredníctvom prostriedkov komunikácie na diaľku</li>
        </ul>
      </Section>

      <Section id="service" title="3. Opis služby">
        <p>Email Manager poskytuje tieto funkcie:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Synchronizácia emailov z Gmail účtu prostredníctvom Gmail API</li>
          <li>AI analýza emailov — sumarizácia, kategorizácia, FAQ matching (OpenAI GPT-4o-mini)</li>
          <li>Generovanie návrhov odpovedí pomocou AI</li>
          <li>Automatické odpovede na základe FAQ šablón (voliteľné)</li>
          <li>Štatistiky a sledovanie metrík emailovej komunikácie</li>
        </ul>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-4 mb-2">Funkcionálnosť a kompatibilita</h3>
        <p>
          Služba je dostupná cez webový prehliadač (Chrome, Firefox, Safari, Edge — posledné 2 verzie).
          Vyžaduje pripojenie na internet a Gmail účet pre plnú funkcionalitu.
          Služba je poskytovaná v slovenskom jazyku.
        </p>
      </Section>

      <Section id="contract" title="4. Uzavretie zmluvy">
        <p>
          Zmluva sa uzatvára na diaľku podľa § 13 zákona č. 108/2024 Z.z. Proces uzavretia zmluvy:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Používateľ si zvolí cenový plán na stránke Cenník</li>
          <li>Vyplní registračný formulár a odsúhlasí VOP a Zásady ochrany osobných údajov</li>
          <li>Skontroluje zhrnutie objednávky (plán, cena, obdobie)</li>
          <li>Klikne na tlačidlo <strong>&ldquo;Objednávka s povinnosťou platby&rdquo;</strong></li>
          <li>Zmluva je uzavretá momentom dokončenia platby</li>
        </ol>
        <p>
          Potvrdenie uzavretia zmluvy vám bude zaslané emailom bezodkladne po zaplatení.
        </p>
      </Section>

      <Section id="price" title="5. Cena a platobné podmienky">
        <p>
          Aktuálne ceny sú uvedené na stránke <a href="/pricing" className="text-[var(--primary-600)] hover:underline">Cenník</a>.
          Všetky ceny sú uvedené vrátane DPH (23 %).
        </p>
        <p>
          Platba sa realizuje prostredníctvom platobnej brány Stripe. Akceptujeme platobné karty Visa, Mastercard a ďalšie
          metódy podporované Stripe.
        </p>
        <p>
          Predplatné sa účtuje <Placeholder text="mesačne/ročne" /> vopred. Prvá platba je splatná okamžite pri uzavretí zmluvy.
        </p>
      </Section>

      <Section id="withdrawal" title="6. Právo na odstúpenie od zmluvy">
        <div className="bg-[var(--warning-50)] border border-[var(--warning-500)]/30 rounded-[var(--radius-lg)] p-4 my-4">
          <p className="font-semibold text-[var(--warning-700)] mb-2">Právo spotrebiteľa na odstúpenie od zmluvy (14 dní)</p>
          <p className="text-[var(--text-secondary)]">
            Podľa § 19 ods. 1 zákona č. 108/2024 Z.z. máte právo odstúpiť od zmluvy bez uvedenia dôvodu
            v lehote <strong>14 dní</strong> odo dňa uzavretia zmluvy.
          </p>
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-4 mb-2">Postup pri odstúpení:</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Vyplňte vzorový formulár na odstúpenie (<a href="#appendix" className="text-[var(--primary-600)] hover:underline">Príloha č. 1</a>) alebo iné jednoznačné vyhlásenie</li>
          <li>Zašlite ho na: <Placeholder text="Email" /> alebo poštou na: <Placeholder text="Sídlo" /></li>
          <li>Lehota je zachovaná, ak vyhlásenie odošlete pred jej uplynutím</li>
        </ol>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-4 mb-2">Dôsledky odstúpenia:</h3>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Vrátime vám všetky platby do <strong>14 dní</strong> od doručenia vyhlásenia o odstúpení</li>
          <li>Vrátenie platby rovnakým spôsobom platby, aký ste použili, ak sa nedohodneme inak</li>
          <li>Ak ste službu začali používať pred uplynutím lehoty na odstúpenie, zaplatíte <strong>pomernú časť</strong> ceny za poskytnuté služby</li>
        </ul>
      </Section>

      <Section id="duration" title="7. Trvanie a ukončenie zmluvy">
        <p>
          Zmluva sa uzatvára na dobu neurčitú s <Placeholder text="mesačným/ročným" /> fakturačným obdobím.
        </p>
        <p>
          <strong>Automatické predĺženie:</strong> Predplatné sa automaticky predlžuje na ďalšie obdobie, ak neposkytnete
          výslovný súhlas s automatickým predĺžením pri objednávke, predplatné sa nepredlžuje.
        </p>
        <p>
          <strong>Zrušenie:</strong> Predplatné môžete zrušiť kedykoľvek v Nastaveniach → Predplatné. Zrušenie nadobúda účinnosť
          na konci aktuálneho fakturačného obdobia.
        </p>
      </Section>

      <Section id="complaints" title="8. Reklamácie">
        <p>
          Podrobné informácie o reklamačnom konaní nájdete v{' '}
          <a href="/reklamacia" className="text-[var(--primary-600)] hover:underline">Reklamačnom poriadku</a>.
        </p>
        <p>
          Reklamáciu môžete uplatniť emailom na <Placeholder text="Email" /> alebo písomne na adresu sídla.
        </p>
      </Section>

      <Section id="ai-usage" title="9. Používanie AI">
        <p>
          AI funkcie služby Email Manager sú <strong>asistečného charakteru</strong>. Znamená to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>AI návrhy odpovedí sú <strong>nezáväzné</strong> — pred odoslaním ich môžete upraviť alebo odmietnuť</li>
          <li>Za obsah odoslaných odpovedí zodpovedá <strong>používateľ</strong></li>
          <li>Auto-reply funkcia je voliteľná a predvolene vypnutá</li>
          <li>AI môže generovať nepresné alebo neúplné výstupy — odporúčame kontrolu pred odoslaním</li>
        </ul>
      </Section>

      <Section id="disputes" title="10. Mimosúdne riešenie sporov">
        <p>
          Spotrebiteľ má právo obrátiť sa na subjekt alternatívneho riešenia sporov (ARS) podľa zákona č. 391/2015 Z.z.
        </p>
        <p>
          Zoznam subjektov ARS:{' '}
          <a href="https://www.mhsr.sk/obchod/ochrana-spotrebitela/alternativne-riesenie-spotrebitelskych-sporov-1/zoznam-subjektov-alternativneho-riesenia-spotrebitelskych-sporov-1" target="_blank" rel="noopener noreferrer" className="text-[var(--primary-600)] hover:underline break-all">
            mhsr.sk
          </a>
        </p>
        <p>
          Platforma pre riešenie sporov online (ODR):{' '}
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-[var(--primary-600)] hover:underline">
            ec.europa.eu/consumers/odr
          </a>
        </p>
      </Section>

      <Section id="final" title="11. Záverečné ustanovenia">
        <p>
          Tieto VOP sa riadia právnym poriadkom Slovenskej republiky, najmä zákonom č. 108/2024 Z.z., zákonom č. 40/1964 Zb. (Občiansky zákonník)
          a zákonom č. 22/2004 Z.z. (o elektronickom obchode).
        </p>
        <p>
          Akékoľvek zmeny VOP budú oznámené emailom minimálne 14 dní vopred. Ak s novými VOP nesúhlasíte,
          máte právo zmluvu ukončiť pred dňom nadobudnutia ich účinnosti.
        </p>
      </Section>

      {/* Príloha 1 */}
      <section id="appendix" className="scroll-mt-8 mt-12">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Príloha č. 1: Vzorový formulár na odstúpenie od zmluvy</h2>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">(podľa prílohy č. 2 zákona č. 108/2024 Z.z.)</p>

        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-6 space-y-4 text-sm text-[var(--text-secondary)] print:border-black">
          <p>
            Komu: <Placeholder text="Obchodné meno, sídlo, email" />
          </p>
          <p>
            Týmto oznamujem, že odstupujem od zmluvy na poskytovanie nasledovnej služby: <strong>Email Manager</strong>
          </p>
          <div className="space-y-3">
            <p>Dátum uzavretia zmluvy: ___________________________________</p>
            <p>Meno spotrebiteľa: ___________________________________</p>
            <p>Adresa spotrebiteľa: ___________________________________</p>
            <p>Dátum: ___________________________________</p>
            <p>Podpis (len ak sa zasiela v listinnej podobe): ___________________________________</p>
          </div>
        </div>

        <PrintButton />
      </section>
    </article>
  );
}
