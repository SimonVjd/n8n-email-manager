import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zásady ochrany osobných údajov | Email Manager',
  description: 'Informácie o spracúvaní osobných údajov v službe Email Manager podľa GDPR.',
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
  { id: 'operator', label: '1. Prevádzkovateľ' },
  { id: 'data', label: '2. Aké údaje zbierame' },
  { id: 'third-parties', label: '3. Údaje tretích strán' },
  { id: 'recipients', label: '4. Príjemcovia údajov' },
  { id: 'transfers', label: '5. Medzinárodné prenosy' },
  { id: 'retention', label: '6. Doba uchovávania' },
  { id: 'rights', label: '7. Vaše práva' },
  { id: 'complaint', label: '8. Právo na sťažnosť' },
  { id: 'cookies', label: '9. Cookies' },
  { id: 'google', label: '10. Google API Limited Use' },
  { id: 'ai', label: '11. Automatizované rozhodovanie' },
  { id: 'changes', label: '12. Zmeny zásad' },
];

export default function PrivacyPolicyPage() {
  return (
    <article>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Zásady ochrany osobných údajov</h1>
      <p className="text-sm text-[var(--text-tertiary)] mb-8">Posledná aktualizácia: 10. februára 2026</p>

      {/* Table of Contents */}
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

      {/* 1. Prevádzkovateľ */}
      <Section id="operator" title="1. Prevádzkovateľ">
        <p>
          Prevádzkovateľom osobných údajov je <Placeholder text="Obchodné meno" />,
          so sídlom <Placeholder text="Sídlo" />,
          IČO: <Placeholder text="IČO" />,
          zapísaný v <Placeholder text="Register a číslo" />.
        </p>
        <p>
          Kontakt: <Placeholder text="Email" /> |
          Zodpovedná osoba (DPO): <Placeholder text="Meno a kontakt DPO, ak je ustanovený" />
        </p>
      </Section>

      {/* 2. Aké údaje zbierame */}
      <Section id="data" title="2. Aké údaje zbierame a prečo">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-4 mb-2">2.1 Registračné údaje</h3>
        <p>Meno, emailová adresa a heslo (hashované). Právny základ: plnenie zmluvy — čl. 6 ods. 1 písm. b) GDPR.</p>

        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-4 mb-2">2.2 Emailové údaje z Gmail</h3>
        <p>
          Synchronizácia emailov prostredníctvom Gmail API (OAuth2). Ukladáme: odosielateľ, predmet, telo emailu, dátum prijatia.
          Právny základ: plnenie zmluvy + výslovný súhlas.
        </p>

        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-4 mb-2">2.3 AI spracovanie emailov</h3>
        <div className="bg-[var(--warning-50)] border border-[var(--warning-500)]/30 rounded-[var(--radius-lg)] p-4 my-4">
          <p className="font-semibold text-[var(--warning-700)] mb-2">Dôležité — AI spracovanie vašich emailov</p>
          <p className="text-[var(--text-secondary)]">
            Táto služba používa umelú inteligenciu (OpenAI GPT-4o-mini) na spracovanie vašich emailov.
            AI vykonáva nasledovné operácie:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-[var(--text-secondary)]">
            <li>Sumarizácia obsahu emailu v slovenčine</li>
            <li>Kategorizácia emailov (naliehavé, časovo citlivé, FAQ, bežné, spam)</li>
            <li>Priradenie emailov k FAQ šablónam</li>
            <li>Generovanie návrhov odpovedí</li>
          </ul>
          <div className="mt-3 space-y-1.5 text-[var(--text-secondary)]">
            <p><strong>OpenAI nepoužíva vaše dáta na trénovanie</strong> svojich modelov (API je vylúčené z trénovacích dát).</p>
            <p>Dáta sa v systémoch OpenAI uchovávajú <strong>maximálne 30 dní</strong> na účely detekcie zneužitia.</p>
            <p>Súhlas môžete <strong>kedykoľvek odvolať</strong> v Nastaveniach → Súkromie a AI.</p>
          </div>
          <p className="mt-2 text-[var(--text-secondary)]">
            Právny základ: <strong>výslovný súhlas</strong> — čl. 6 ods. 1 písm. a) GDPR v spojení s čl. 9 ods. 2 písm. a) GDPR.
          </p>
        </div>

        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-4 mb-2">2.4 Technické údaje</h3>
        <p>
          IP adresa, typ prehliadača, operačný systém. Právny základ: oprávnený záujem — čl. 6 ods. 1 písm. f) GDPR
          (zabezpečenie a prevádzka služby).
        </p>

        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-4 mb-2">2.5 Platobné údaje</h3>
        <p>
          Platby spracúva Stripe, Inc. Neukladáme čísla platobných kariet. Stripe je certifikovaný podľa PCI DSS Level 1.
        </p>
      </Section>

      {/* 3. Údaje tretích strán */}
      <Section id="third-parties" title="3. Osobné údaje tretích strán v emailoch">
        <p>
          Emaily, ktoré synchronizujete, môžu obsahovať osobné údaje ich odosielateľov a príjemcov (mená, emailové adresy, obsah komunikácie).
        </p>
        <p>
          Informácia podľa čl. 14 GDPR: Tieto údaje spracúvame v rámci poskytovania služby. Uplatňuje sa výnimka podľa
          čl. 14 ods. 5 písm. b) GDPR — informovanie dotknutých osôb by si vyžadovalo neprimerané úsilie vzhľadom na povahu
          emailovej komunikácie.
        </p>
      </Section>

      {/* 4. Príjemcovia */}
      <Section id="recipients" title="4. Príjemcovia údajov">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>OpenAI Ireland Ltd.</strong> — AI spracovanie emailov (inference only, nie trénovanie)</li>
          <li><strong>Google LLC</strong> — Gmail API (synchronizácia emailov)</li>
          <li><strong>Stripe, Inc.</strong> — spracovanie platieb</li>
          <li><Placeholder text="Hosting provider" /> — hosting aplikácie</li>
        </ul>
      </Section>

      {/* 5. Medzinárodné prenosy */}
      <Section id="transfers" title="5. Medzinárodné prenosy údajov">
        <p>
          Vaše údaje môžu byť prenášané do USA (OpenAI, Google, Stripe). Tieto prenosy sú zabezpečené:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>EU-US Data Privacy Framework (pre certifikované spoločnosti)</li>
          <li>Štandardné zmluvné doložky (SCCs) podľa rozhodnutia Komisie 2021/914</li>
        </ul>
      </Section>

      {/* 6. Doba uchovávania */}
      <Section id="retention" title="6. Doba uchovávania údajov">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="text-left py-2 pr-4 font-medium text-[var(--text-primary)]">Typ údajov</th>
                <th className="text-left py-2 font-medium text-[var(--text-primary)]">Doba</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-secondary)]">
              <tr className="border-b border-[var(--border-primary)]"><td className="py-2 pr-4">Účet a profil</td><td>Trvanie zmluvy + 3 roky</td></tr>
              <tr className="border-b border-[var(--border-primary)]"><td className="py-2 pr-4">Emaily</td><td>Trvanie účtu + 30 dní po zrušení</td></tr>
              <tr className="border-b border-[var(--border-primary)]"><td className="py-2 pr-4">AI spracovanie (OpenAI)</td><td>Max. 30 dní</td></tr>
              <tr className="border-b border-[var(--border-primary)]"><td className="py-2 pr-4">Faktúry</td><td>10 rokov (zákonná povinnosť)</td></tr>
              <tr><td className="py-2 pr-4">Logy</td><td>90 dní</td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* 7. Vaše práva */}
      <Section id="rights" title="7. Vaše práva">
        <p>Podľa GDPR máte nasledovné práva:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Právo na prístup</strong> (čl. 15) — získať kópiu svojich údajov</li>
          <li><strong>Právo na opravu</strong> (čl. 16) — opraviť nesprávne údaje</li>
          <li><strong>Právo na vymazanie</strong> (čl. 17) — požiadať o zmazanie údajov</li>
          <li><strong>Právo na obmedzenie</strong> (čl. 18) — obmedziť spracúvanie</li>
          <li><strong>Právo na prenositeľnosť</strong> (čl. 20) — získať údaje v strojovo čitateľnom formáte</li>
          <li><strong>Právo namietať</strong> (čl. 21) — namietať proti spracúvaniu</li>
          <li><strong>Právo odvolať súhlas</strong> (čl. 7 ods. 3) — kedykoľvek, bez vplyvu na zákonnosť predchádzajúceho spracúvania</li>
        </ul>
        <p>
          Uplatnenie práv: <Placeholder text="Email pre GDPR požiadavky" />.
          Na vašu žiadosť odpovieme do <strong>30 dní</strong>.
        </p>
        <p>
          Export a vymazanie údajov môžete vykonať aj priamo v aplikácii: <strong>Nastavenia → Súkromie a AI → Vaše dáta</strong>.
        </p>
      </Section>

      {/* 8. Sťažnosť */}
      <Section id="complaint" title="8. Právo podať sťažnosť">
        <p>
          Máte právo podať sťažnosť dozornému orgánu:
        </p>
        <p className="font-medium text-[var(--text-primary)]">
          Úrad na ochranu osobných údajov Slovenskej republiky<br />
          Hraničná 12, 820 07 Bratislava 27<br />
          <a href="https://dataprotection.gov.sk" target="_blank" rel="noopener noreferrer" className="text-[var(--primary-600)] hover:underline">
            dataprotection.gov.sk
          </a>
        </p>
      </Section>

      {/* 9. Cookies */}
      <Section id="cookies" title="9. Cookies">
        <p>
          Informácie o používaní cookies nájdete v našej{' '}
          <a href="/cookies" className="text-[var(--primary-600)] hover:underline">Cookie Policy</a>.
        </p>
      </Section>

      {/* 10. Google Limited Use */}
      <Section id="google" title="10. Google API Services — Limited Use Disclosure">
        <div className="bg-[var(--info-50)] border border-[var(--info-500)]/30 rounded-[var(--radius-lg)] p-4 my-4">
          <p className="text-[var(--text-primary)] mb-3">
            Email Manager&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary-600)] hover:underline font-medium"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[var(--text-secondary)]">
            <li>Gmail dáta používame <strong>výlučne</strong> na user-facing features (synchronizácia, zobrazenie, odpovede)</li>
            <li>Gmail dáta <strong>nepredávame</strong> tretím stranám</li>
            <li>Gmail dáta <strong>nepoužívame</strong> na trénovanie AI modelov</li>
            <li>Ľudia <strong>nečítajú</strong> vaše Gmail dáta bez vášho výslovného súhlasu</li>
            <li>Prenos do OpenAI je výlučne na <strong>inference</strong> (jednorazové spracovanie) na základe vášho súhlasu</li>
          </ul>
        </div>
      </Section>

      {/* 11. AI */}
      <Section id="ai" title="11. Automatizované rozhodovanie a AI">
        <p>
          AI funkcie služby Email Manager sú <strong>asistečného charakteru</strong> — pomáhajú vám, ale nerozhodujú za vás.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>AI kategorizácia a sumarizácia sú <strong>informatívne</strong> — pomáhajú s organizáciou emailov</li>
          <li>Navrhované odpovede sú <strong>návrhy</strong> — pred odoslaním ich môžete upraviť alebo odmietnuť</li>
          <li>Auto-reply je <strong>voliteľná funkcia</strong>, predvolene vypnutá, aktivovateľná a deaktivovateľná v Nastaveniach</li>
          <li>AI nie je používaná na profilovanie ani na rozhodnutia s právnymi účinkami</li>
        </ul>
      </Section>

      {/* 12. Zmeny */}
      <Section id="changes" title="12. Zmeny týchto zásad">
        <p>
          O podstatných zmenách vás budeme informovať emailom minimálne <strong>14 dní vopred</strong>.
          Pokračovanie v používaní služby po účinnosti zmien sa považuje za súhlas s novými zásadami.
        </p>
      </Section>
    </article>
  );
}
