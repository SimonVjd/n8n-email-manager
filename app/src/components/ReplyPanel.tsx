'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Email, ReplyTemplate } from '@/lib/types';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import AIDisclaimer from '@/components/AIDisclaimer';
import {
  Reply,
  ChevronDown,
  Send,
  Zap,
  FileText,
  Plus,
  X,
  Star,
  Pencil,
  Trash2,
} from 'lucide-react';

interface ReplyPanelProps {
  email: Email;
  onReplySent: (status: Email['reply_status']) => void;
  gmailConnected: boolean;
}

export default function ReplyPanel({ email, onReplySent, gmailConnected }: ReplyPanelProps) {
  const { toast } = useToast();
  const [replyText, setReplyText] = useState(email.auto_reply_sk || '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [isEdited, setIsEdited] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateBody, setEditTemplateBody] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const templateDropdownRef = useRef<HTMLDivElement>(null);

  // Reset when email changes
  useEffect(() => {
    setReplyText(email.auto_reply_sk || '');
    setIsEdited(false);
    setError('');
    setCollapsed(false);
    setShowTemplates(false);
    setShowNewTemplate(false);
  }, [email.id, email.auto_reply_sk]);

  // Auto-resize textarea (capped at 400px)
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 400) + 'px';
    }
  }, [replyText]);

  // Close template dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target as Node)) {
        setShowTemplates(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetchWithTimeout('/api/templates');
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // Apply variable substitutions
  function applyVariables(templateBody: string): string {
    const senderName = email.from_address.split('@')[0].replace(/[._-]/g, ' ');
    return templateBody
      .replace(/\{meno\}/g, senderName)
      .replace(/\{predmet\}/g, email.subject)
      .replace(/\{datum\}/g, new Date(email.received_at).toLocaleDateString('sk-SK'));
  }

  // Insert template
  async function handleInsertTemplate(template: ReplyTemplate) {
    const processed = applyVariables(template.body);
    setReplyText(processed);
    setIsEdited(true);
    setShowTemplates(false);

    // Increment usage
    try {
      await fetchWithTimeout('/api/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: template.id }),
      });
      setTemplates(prev =>
        prev.map(t => t.id === template.id ? { ...t, usage_count: t.usage_count + 1 } : t)
          .sort((a, b) => b.usage_count - a.usage_count)
      );
    } catch { /* silent */ }
  }

  // Save current text as template
  async function handleSaveAsTemplate() {
    if (!newTemplateName.trim() || !replyText.trim()) return;
    setSavingTemplate(true);
    try {
      const res = await fetchWithTimeout('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTemplateName.trim(), body: replyText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => [data.data, ...prev]);
        setNewTemplateName('');
        setShowNewTemplate(false);
        toast.success('Šablóna bola uložená');
      } else {
        toast.error(data.error || 'Nepodarilo sa uložiť šablónu');
      }
    } catch {
      toast.error('Nepodarilo sa uložiť šablónu');
    } finally {
      setSavingTemplate(false);
    }
  }

  // Update template
  async function handleUpdateTemplate(id: string) {
    if (!editTemplateName.trim() || !editTemplateBody.trim()) return;
    try {
      const res = await fetchWithTimeout('/api/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editTemplateName.trim(), body: editTemplateBody.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => prev.map(t => t.id === id ? data.data : t));
        setEditingTemplate(null);
        toast.success('Šablóna bola aktualizovaná');
      } else {
        toast.error(data.error || 'Nepodarilo sa aktualizovať šablónu');
      }
    } catch {
      toast.error('Nepodarilo sa aktualizovať šablónu');
    }
  }

  // Delete template
  async function handleDeleteTemplate(id: string) {
    try {
      const res = await fetchWithTimeout('/api/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => {
          const updated = prev.filter(t => t.id !== id);
          if (updated.length === 0) setShowTemplates(false);
          return updated;
        });
        toast.success('Šablóna bola vymazaná');
      } else {
        toast.error(data.error || 'Nepodarilo sa vymazať šablónu');
      }
    } catch {
      toast.error('Nepodarilo sa vymazať šablónu');
    }
  }

  // Send reply
  async function handleSend(action: 'send' | 'send_and_automate') {
    setSending(true);
    setError('');
    try {
      const res = await fetchWithTimeout(`/api/emails/${email.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          replyText: replyText.trim(),
          isEdited,
        }),
        timeout: 30000,
      });
      const data = await res.json();
      if (data.success) {
        onReplySent(data.data.reply_status as Email['reply_status']);
      } else {
        setError(data.error || 'Chyba pri odosielaní');
      }
    } catch {
      setError('Chyba pri odosielaní odpovede. Server neodpovedá.');
    } finally {
      setSending(false);
    }
  }

  if (email.reply_status === 'sent' || email.reply_status === 'edited_sent' || email.reply_status === 'auto_sent') {
    return null;
  }

  const isOpen = !collapsed;

  return (
    <div className="mt-6">
      {/* Toggle header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between bg-[var(--primary-50)] border border-[var(--primary-200)] px-4 py-2.5 transition-all duration-200 group hover:bg-[var(--primary-100)] ${
          isOpen ? 'rounded-t-[var(--radius-lg)] border-b-0' : 'rounded-[var(--radius-lg)]'
        }`}
      >
        <div className="flex items-center gap-2">
          <Reply size={14} className="text-[var(--primary-500)] shrink-0" />
          <span className="text-xs font-medium text-[var(--primary-700)]">
            AI Navrhovaná odpoveď
            {email.faq_matched_id && ' (FAQ)'}
            {isEdited && <span className="ml-1.5 text-[var(--primary-400)] font-normal">— upravená</span>}
          </span>
        </div>
        <ChevronDown
          size={16}
          className="text-[var(--primary-400)] group-hover:text-[var(--primary-600)] transition-transform duration-300 ease-in-out shrink-0"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Animated content — CSS Grid smooth height */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="bg-[var(--primary-50)] border border-[var(--primary-200)] border-t-0 rounded-b-[var(--radius-lg)] px-4 pb-4 pt-3">
            {/* Template picker */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative" ref={templateDropdownRef}>
                <button
                  onClick={() => setShowTemplates(v => !v)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-[var(--radius-md)] border border-[var(--primary-200)] text-[var(--primary-700)] bg-[var(--bg-primary)] hover:bg-[var(--primary-100)] transition-colors"
                >
                  <FileText size={12} />
                  Šablóny
                  {templates.length > 0 && (
                    <span className="text-[10px] bg-[var(--primary-200)] text-[var(--primary-700)] px-1.5 rounded-full">
                      {templates.length}
                    </span>
                  )}
                  <ChevronDown size={12} />
                </button>

                {showTemplates && (
                  <div className="absolute bottom-full left-0 mb-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] z-50 min-w-[280px] max-h-[320px] overflow-auto">
                    <div className="p-2 border-b border-[var(--border-secondary)]">
                      <p className="text-xs font-medium text-[var(--text-secondary)] px-1">Šablóny odpovedí</p>
                    </div>

                    {templates.length === 0 ? (
                      <div className="p-4 text-center">
                        <FileText size={20} className="mx-auto mb-2 text-[var(--text-tertiary)] opacity-50" />
                        <p className="text-xs text-[var(--text-tertiary)]">Žiadne šablóny</p>
                      </div>
                    ) : (
                      <div className="py-1">
                        {templates.map(t => (
                          <div key={t.id} className="group/tmpl">
                            {editingTemplate === t.id ? (
                              <div className="p-2 space-y-2">
                                <input
                                  type="text"
                                  value={editTemplateName}
                                  onChange={e => setEditTemplateName(e.target.value)}
                                  className="w-full text-xs px-2 py-1.5 border border-[var(--border-primary)] rounded-[var(--radius-sm)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                                  placeholder="Názov..."
                                />
                                <textarea
                                  value={editTemplateBody}
                                  onChange={e => setEditTemplateBody(e.target.value)}
                                  rows={3}
                                  className="w-full text-xs px-2 py-1.5 border border-[var(--border-primary)] rounded-[var(--radius-sm)] bg-[var(--bg-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                                />
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    onClick={() => setEditingTemplate(null)}
                                    className="text-[10px] px-2 py-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                  >
                                    Zrušiť
                                  </button>
                                  <button
                                    onClick={() => handleUpdateTemplate(t.id)}
                                    className="text-[10px] px-2 py-1 bg-[var(--primary-500)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--primary-600)]"
                                  >
                                    Uložiť
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleInsertTemplate(t)}
                                className="w-full text-left px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">{t.name}</span>
                                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/tmpl:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTemplate(t.id);
                                        setEditTemplateName(t.name);
                                        setEditTemplateBody(t.body);
                                      }}
                                      className="p-0.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                                    >
                                      <Pencil size={10} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTemplate(t.id);
                                      }}
                                      className="p-0.5 rounded hover:bg-[var(--danger-50)] text-[var(--text-tertiary)] hover:text-[var(--danger-600)]"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-[10px] text-[var(--text-tertiary)] line-clamp-2 mt-0.5">{t.body}</p>
                                {t.usage_count > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star size={8} className="text-[var(--warning-500)]" />
                                    <span className="text-[9px] text-[var(--text-tertiary)]">{t.usage_count}x použité</span>
                                  </div>
                                )}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-2 border-t border-[var(--border-secondary)]">
                      <button
                        onClick={() => { setShowTemplates(false); setShowNewTemplate(true); }}
                        className="w-full flex items-center gap-1.5 text-xs px-2 py-1.5 text-[var(--primary-600)] hover:bg-[var(--primary-50)] rounded-[var(--radius-sm)] transition-colors"
                      >
                        <Plus size={12} />
                        Nová šablóna
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-[var(--primary-400)]">
                Premenné: <code className="font-mono">{'{meno}'}</code> <code className="font-mono">{'{predmet}'}</code> <code className="font-mono">{'{datum}'}</code>
              </p>
            </div>

            {/* Save as template inline form */}
            {showNewTemplate && (
              <div className="mb-3 p-3 bg-[var(--bg-primary)] border border-[var(--primary-200)] rounded-[var(--radius-md)]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-[var(--text-primary)]">Uložiť ako šablónu</p>
                  <button onClick={() => setShowNewTemplate(false)} className="p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                    <X size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-[var(--border-primary)] rounded-[var(--radius-sm)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] mb-2"
                  placeholder="Názov šablóny (napr. 'Potvrdenie objednávky')"
                  autoFocus
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveAsTemplate}
                    loading={savingTemplate}
                    disabled={!newTemplateName.trim() || !replyText.trim()}
                  >
                    Uložiť šablónu
                  </Button>
                </div>
              </div>
            )}

            {email.auto_reply_sk && !isEdited && (
              <AIDisclaimer variant="banner" />
            )}

            <textarea
              ref={textareaRef}
              value={replyText}
              onChange={(e) => { setReplyText(e.target.value); setIsEdited(true); }}
              className="reply-textarea w-full bg-[var(--bg-primary)] border border-[var(--primary-200)] rounded-[var(--radius-md)] px-3 py-2 text-sm leading-relaxed text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary-300)] min-h-[80px] max-h-[400px] overflow-y-auto"
              rows={4}
            />

            {error && (
              <p className="text-xs text-[var(--danger-600)] mt-2">{error}</p>
            )}

            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                icon={<Send size={12} />}
                onClick={() => handleSend('send')}
                disabled={sending || !gmailConnected || !replyText.trim()}
                loading={sending}
              >
                Odoslať
              </Button>

              <Button
                size="sm"
                variant="secondary"
                icon={<Zap size={12} />}
                onClick={() => handleSend('send_and_automate')}
                disabled={sending || !gmailConnected || !replyText.trim()}
                title="Odošle odpoveď a zapne automatické odosielanie pre tento typ emailu"
              >
                Odoslať + Auto
              </Button>

              {replyText.trim() && !showNewTemplate && (
                <button
                  onClick={() => setShowNewTemplate(true)}
                  className="text-[10px] text-[var(--primary-500)] hover:text-[var(--primary-700)] flex items-center gap-1 ml-auto transition-colors"
                >
                  <FileText size={10} />
                  Uložiť ako šablónu
                </button>
              )}
            </div>

            {!gmailConnected && (
              <p className="text-xs text-[var(--warning-600)] mt-2">Gmail nie je pripojený</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
