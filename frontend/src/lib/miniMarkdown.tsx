import React from 'react';

/**
 * Renderer markdown sangat ringan untuk hasil AI:
 * **bold**, *italic* / _italic_, heading **Judul:**, bullet -/*, numbered 1.
 * Bukan pengganti markdown penuh — cukup untuk output prompt PJPK.
 * Output berupa elemen React (aman dari XSS — tidak pakai dangerouslySetInnerHTML).
 */

/** Parse inline **bold** dan *italic* / _italic_ menjadi elemen React. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Pola: **bold** dulu, lalu *italic* atau _italic_
  const pola = /(\*\*[^*]+\*\*|\*[^*\n]+\*|_[^_\n]+_)/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = pola.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const token = m[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={key} style={{ color: 'var(--color-text)' }}>
          {renderInline(token.slice(2, -2), `${key}b`)}
        </strong>,
      );
    } else {
      const inner = token.slice(1, -1);
      nodes.push(<em key={key}>{inner}</em>);
    }
    last = pola.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Deteksi baris: heading (**X:**), bullet (- / *), numbered (1.), atau paragraf. */
function Baris({ baris, kunci }: { baris: string; kunci: number }) {
  const t = baris.trim();
  if (t === '') return <div key={kunci} style={{ height: '0.9em' }} />;

  // Heading khusus: seluruh baris bold (mis. **Status & Diagnosis:**)
  const heading = /^\*\*[^*]+\*\*:?$/.test(t);
  if (heading) {
    const teks = t.replace(/^\*\*/, '').replace(/\*\*:?$/, '');
    return (
      <div key={kunci} style={{ fontWeight: 700, color: 'var(--color-text)', marginTop: kunci === 0 ? 0 : '1.4em', marginBottom: '0.5em', fontSize: '1.02em' }}>
        {renderInline(teks, `h${kunci}`)}
      </div>
    );
  }

  // Bullet: - atau *
  const bullet = /^[-*]\s+(.+)/.exec(t);
  if (bullet) {
    return (
      <div key={kunci} style={{ display: 'flex', gap: '0.6em', paddingLeft: '0.5em', marginTop: '0.45em', lineHeight: 1.7 }}>
        <span style={{ flexShrink: 0 }}>•</span>
        <span>{renderInline(bullet[1], `b${kunci}`)}</span>
      </div>
    );
  }

  // Numbered: 1. 2. dst — tiap nomor jadi blok dengan jarak lega
  const numbered = /^(\d+)[.)]\s+(.+)/.exec(t);
  if (numbered) {
    return (
      <div key={kunci} style={{ display: 'flex', gap: '0.6em', marginTop: '1.3em', lineHeight: 1.7 }}>
        <span style={{ flexShrink: 0, fontWeight: 700, color: 'var(--color-text)' }}>{numbered[1]}.</span>
        <span style={{ color: 'var(--color-text)' }}>{renderInline(numbered[2], `n${kunci}`)}</span>
      </div>
    );
  }

  // Sub-label ber-indent (di bawah nomor), pola "Label: nilai" — mis.
  // "Jenis Gap: ...", "Tindakan Konkret: ...". Label ditebalkan, baris di-indent
  // dan diberi jarak supaya tidak menempel ke nomor di atasnya.
  const subLabel = /^([A-Za-z][A-Za-z \/()&-]{1,32}):\s*(.+)$/.exec(t);
  if (subLabel) {
    return (
      <div key={kunci} style={{ marginTop: '0.55em', marginLeft: '1.6em', lineHeight: 1.7, display: 'flex', gap: '0.45em' }}>
        <span style={{ fontWeight: 600, color: 'var(--color-text)', flexShrink: 0 }}>{subLabel[1]}:</span>
        <span>{renderInline(subLabel[2], `s${kunci}`)}</span>
      </div>
    );
  }

  return <div key={kunci} style={{ marginTop: '0.55em', lineHeight: 1.7 }}>{renderInline(t, `p${kunci}`)}</div>;
}

/** Render blok teks multi-baris menjadi elemen React. */
export default function MiniMarkdown({ text }: { text: string }) {
  const baris = (text ?? '').split(/\r?\n/);
  return (
    <>
      {baris.map((b, i) => (
        <Baris key={i} baris={b} kunci={i} />
      ))}
    </>
  );
}
