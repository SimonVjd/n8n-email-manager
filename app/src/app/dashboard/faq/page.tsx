'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FAQ } from '@/lib/types';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import { Plus, Pencil, Trash2, HelpCircle, RefreshCw, Zap } from 'lucide-react';

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFaqs = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchWithTimeout('/api/faqs');
      const data = await res.json();
      if (data.success) setFaqs(data.data);
      else setError('Nepodarilo sa načítať FAQ');
    } catch {
      setError('Server neodpovedá. Skúste obnoviť stránku.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetchWithTimeout('/api/faqs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) fetchFaqs();
      else setError(data.error || 'Chyba pri mazaní FAQ');
    } catch {
      setError('Chyba pri mazaní FAQ');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  async function handleToggleAutoSend(faq: FAQ) {
    try {
      const res = await fetchWithTimeout('/api/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: faq.id, auto_send: !faq.auto_send }),
      });
      const data = await res.json();
      if (data.success) {
        setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, auto_send: !f.auto_send } : f));
      }
    } catch {
      setError('Chyba pri zmene automatického odosielania');
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">FAQ šablóny</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Definujte vzory otázok a šablóny odpovedí. AI ich použije na automatické odpovede.
          </p>
        </div>
        <Button
          icon={<Plus size={14} />}
          onClick={() => { setEditing(null); setShowForm(true); }}
        >
          Pridať FAQ
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 space-y-3 fade-in-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
            >
              <Skeleton width="60%" height={14} />
              <Skeleton width="80%" height={12} />
              <Skeleton width="40%" height={12} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)]">
          <HelpCircle size={32} className="mx-auto mb-3 text-[var(--text-tertiary)] opacity-30" />
          <p className="text-sm text-[var(--danger-600)] mb-3">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => { setLoading(true); fetchFaqs(); }}
          >
            Skúsiť znova
          </Button>
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)]">
          <HelpCircle size={32} className="mx-auto mb-3 text-[var(--text-tertiary)] opacity-30" />
          <p className="text-sm text-[var(--text-tertiary)] mb-3">Žiadne FAQ šablóny</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setEditing(null); setShowForm(true); }}
          >
            Vytvorte prvú FAQ šablónu
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)] p-5 group card-hover"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Vzor otázky</p>
                    {faq.auto_send && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Zap size={10} />
                        AUTO
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-primary)] mb-3">{faq.question_pattern}</p>
                  <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Šablóna odpovede</p>
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{faq.response_template_sk}</p>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border-primary)]">
                    <span className="text-xs text-[var(--text-tertiary)]">
                      Použité: <span className="font-medium text-[var(--text-secondary)]">{faq.usage_count}x</span>
                    </span>
                    {faq.times_edited > 0 && (
                      <span className="text-xs text-[var(--text-tertiary)]">
                        Upravené: <span className="font-medium text-amber-600">{faq.times_edited}x</span>
                      </span>
                    )}
                    {faq.times_rejected > 0 && (
                      <span className="text-xs text-[var(--text-tertiary)]">
                        Odmietnuté: <span className="font-medium text-[var(--danger-600)]">{faq.times_rejected}x</span>
                      </span>
                    )}

                    {/* Auto-send toggle */}
                    <button
                      onClick={() => handleToggleAutoSend(faq)}
                      className="ml-auto flex items-center gap-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      <span>Auto-odoslať</span>
                      <div className={`relative w-8 h-[18px] rounded-full transition-colors ${faq.auto_send ? 'bg-emerald-500' : 'bg-[var(--bg-tertiary)]'}`}>
                        <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${faq.auto_send ? 'left-[16px]' : 'left-[2px]'}`} />
                      </div>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Pencil size={13} />}
                    onClick={() => { setEditing(faq); setShowForm(true); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Upraviť
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={13} />}
                    onClick={() => setDeleteId(faq.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--danger-600)] hover:text-[var(--danger-600)] hover:bg-[var(--danger-50)]"
                  >
                    Zmazať
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Odstrániť FAQ"
        width="max-w-sm"
      >
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Naozaj chcete odstrániť túto FAQ šablónu? Táto akcia sa nedá vrátiť.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)} disabled={deleting}>
            Zrušiť
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteId && handleDelete(deleteId)}
            loading={deleting}
          >
            {deleting ? 'Mazanie...' : 'Odstrániť'}
          </Button>
        </div>
      </Modal>

      {/* FAQ Form Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? 'Upraviť FAQ' : 'Nová FAQ šablóna'}
        width="max-w-lg"
      >
        <FAQForm
          faq={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); fetchFaqs(); }}
        />
      </Modal>
    </div>
  );
}

function FAQForm({
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

      const res = await fetchWithTimeout('/api/faqs', {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Vzor otázky
        </label>
        <textarea
          value={questionPattern}
          onChange={(e) => setQuestionPattern(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
          placeholder="Napr.: Aké sú vaše otváracie hodiny? / Kedy máte otvorené?"
          required
        />
        <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
          Popíšte typ otázky, na ktorú sa má FAQ zhodovať.
        </p>
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Šablóna odpovede (slovensky)
        </label>
        <textarea
          value={responseTemplate}
          onChange={(e) => setResponseTemplate(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-[var(--radius-md)] text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
          placeholder="Napr.: Naše otváracie hodiny sú Po-Pi 8:00-16:00. V sobotu a nedeľu máme zatvorené."
          required
        />
        <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
          AI použije túto šablónu ako základ pre personalizovanú odpoveď.
        </p>
      </div>
      {error && (
        <div className="text-sm text-[var(--danger-600)] bg-[var(--danger-50)] px-3 py-2 rounded-[var(--radius-md)]">{error}</div>
      )}
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="secondary" size="sm" type="button" onClick={onClose}>
          Zrušiť
        </Button>
        <Button type="submit" size="sm" loading={saving}>
          {saving ? 'Ukladanie...' : faq ? 'Uložiť zmeny' : 'Vytvoriť FAQ'}
        </Button>
      </div>
    </form>
  );
}
