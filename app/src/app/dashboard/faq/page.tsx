'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FAQ } from '@/lib/types';

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);

  const fetchFaqs = useCallback(async () => {
    try {
      const res = await fetch('/api/faqs');
      const data = await res.json();
      if (data.success) setFaqs(data.data);
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  async function handleDelete(id: string) {
    if (!confirm('Naozaj chcete odstrániť túto FAQ?')) return;
    try {
      const res = await fetch('/api/faqs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) fetchFaqs();
    } catch {
      console.error('Delete failed');
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">FAQ šablóny</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Definujte vzory otázok a šablóny odpovedí. AI ich použije na automatické odpovede.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-opacity"
        >
          + Pridať FAQ
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-[var(--muted)]">Načítavanie...</div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-12 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
          <div className="text-3xl mb-3 opacity-30">❓</div>
          <p className="text-sm text-[var(--muted)] mb-3">Žiadne FAQ šablóny</p>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Vytvorte prvú FAQ šablónu
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">Vzor otázky:</p>
                  <p className="text-sm text-[var(--muted)] mb-3">{faq.question_pattern}</p>
                  <p className="text-sm font-medium mb-1">Šablóna odpovede:</p>
                  <p className="text-sm text-[var(--muted)] whitespace-pre-wrap">{faq.response_template_sk}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[var(--muted)] bg-stone-100 px-2 py-1 rounded-lg">
                    {faq.usage_count}x použité
                  </span>
                  <button
                    onClick={() => { setEditing(faq); setShowForm(true); }}
                    className="text-xs px-2.5 py-1 border border-[var(--border)] rounded-lg hover:bg-stone-50"
                  >
                    Upraviť
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="text-xs px-2.5 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    Zmazať
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <FAQFormModal
          faq={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); fetchFaqs(); }}
        />
      )}
    </div>
  );
}

function FAQFormModal({
  faq,
  onClose,
  onSaved,
}: {
  faq: FAQ | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [questionPattern, setQuestionPattern] = useState(faq?.question_pattern || '');
  const [responseTemplate, setResponseTemplate] = useState(faq?.response_template_sk || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const method = faq ? 'PUT' : 'POST';
      const body = faq
        ? { id: faq.id, question_pattern: questionPattern, response_template_sk: responseTemplate }
        : { question_pattern: questionPattern, response_template_sk: responseTemplate };

      const res = await fetch('/api/faqs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
      } else {
        setError(data.error);
      }
    } catch {
      setError('Chyba pri ukladaní');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--card)] rounded-2xl p-6 w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">
          {faq ? 'Upraviť FAQ' : 'Nová FAQ šablóna'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">
              Vzor otázky
            </label>
            <textarea
              value={questionPattern}
              onChange={(e) => setQuestionPattern(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-sm bg-[var(--background)] resize-none"
              placeholder="Napr.: Aké sú vaše otváracie hodiny? / Kedy máte otvorené?"
              required
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              Popíšte typ otázky, na ktorú sa má FAQ zhodovať.
            </p>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">
              Šablóna odpovede (slovensky)
            </label>
            <textarea
              value={responseTemplate}
              onChange={(e) => setResponseTemplate(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-sm bg-[var(--background)] resize-none"
              placeholder="Napr.: Naše otváracie hodiny sú Po-Pi 8:00-16:00. V sobotu a nedeľu máme zatvorené."
              required
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              AI použije túto šablónu ako základ pre personalizovanú odpoveď.
            </p>
          </div>
          {error && (
            <div className="text-sm text-[var(--danger)] bg-red-50 px-3 py-2 rounded-xl">{error}</div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-[var(--border)] hover:bg-stone-50"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Ukladanie...' : faq ? 'Uložiť zmeny' : 'Vytvoriť FAQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
