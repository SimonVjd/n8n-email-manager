'use client';

export default function PrintButton() {
  return (
    <div className="mt-4 flex gap-3">
      <button
        onClick={() => window.print()}
        className="text-sm px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        Vytlačiť formulár
      </button>
    </div>
  );
}
