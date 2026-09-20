import React from 'react';

/**
 * Renderer markdown ringan untuk hasil AI:
 * heading (# .. ####), **bold**, *italic* / _italic_, kode inline,
 * bullet - / * / •, numbered 1., sub-label "Label: nilai", tabel pipa | a | b |.
 * Bukan pengganti markdown penuh — cukup untuk output prompt PJPK.
 * Output berupa elemen React (aman dari XSS — tidak pakai dangerouslySetInnerHTML).
 */

/** Parse inline **bold**, *italic* / _italic_, dan kode inline menjadi elemen React. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Pola: **bold** (boleh bersarang *italic* di dalamnya), *italic*, _italic_, 'kode'
  const pola = /(\*\*[^*]*(?:\*(?!\*)[^*]*)*\*\*|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`)/g;
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
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded px-1 py-0.5 font-mono text-[0.92em]"
          style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = pola.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Baris pemisah tabel: | --- | :---: | ---: | */
const GARIS_TABEL = /^\|?[\s:|-]+\|[\s:|-]*$/;

/** Pecah baris tabel "| a | b |" menjadi sel (tanpa inline-parse). */
function pecahSel(baris: string): string[] {
  return baris.replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => s.trim());
}

/** Tabel pipa markdown sederhana. */
function Tabel({ blok }: { blok: string[] }) {
  const kepala = pecahSel(blok[0]);
  const isi = blok.slice(1).filter((b) => !GARIS_TABEL.test(b.trim())).map(pecahSel);
  const tdStyle: React.CSSProperties = {
    border: '1px solid var(--color-border)',
    padding: '0.45rem 0.75rem',
    textAlign: 'left',
    verticalAlign: 'top',
    fontSize: '0.86em',
  };
  return (
    <div className="overflow-x-auto" style={{ margin: '0.9em 0' }}>
      <table className="w-full border-collapse" style={{ borderColor: 'var(--color-border)' }}>
        <thead>
          <tr>
            {kepala.map((h, i) => (
              <th key={i} style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-text)', backgroundColor: 'var(--color-bg)' }}>
                {renderInline(h, `th${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isi.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>
                  {renderInline(c, `td${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Render satu baris (bukan tabel) sesuai polanya. */
function Baris({ baris, kunci }: { baris: string; kunci: number }) {
  const t = baris.trim();
  if (t === '') return <div key={kunci} style={{ height: '0.9em' }} />;

  // Garis pemisah: ---, ***, ___
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
    return <hr key={kunci} style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '1.1em 0' }} />;
  }

  // Heading # / ## / ### / #### (opsional ditutup #)
  const heading = /^(#{1,4})\s+(.+?)\s*#*$/.exec(t);
  if (heading) {
    const level = heading[1].length;
    const ukuran = ['1.15em', '1.08em', '1.03em', '1em'][level - 1];
    return (
      <div
        key={kunci}
        style={{
          fontWeight: 700,
          color: 'var(--color-text)',
          fontSize: ukuran,
          marginTop: kunci === 0 ? 0 : level <= 2 ? '1.5em' : '1.2em',
          marginBottom: '0.5em',
        }}
      >
        {renderInline(heading[2], `h${kunci}`)}
      </div>
    );
  }

  // Heading lama: seluruh baris bold, mis. **Status & Diagnosis:**
  if (/^\*\*[^*]+\*\*:?$/.test(t)) {
    const teks = t.replace(/^\*\*/, '').replace(/\*\*:?$/, '');
    return (
      <div key={kunci} style={{ fontWeight: 700, color: 'var(--color-text)', marginTop: kunci === 0 ? 0 : '1.4em', marginBottom: '0.5em', fontSize: '1.02em' }}>
        {renderInline(teks, `hb${kunci}`)}
      </div>
    );
  }

  // Bullet: -, *, atau • (opsional menjorok)
  const bullet = /^(?:\s{1,6})?[-*•]\s+(.+)/.exec(baris.replace(/\t/g, '  '));
  if (bullet) {
    const menjorok = /^[ \t]/.test(baris);
    return (
      <div
        key={kunci}
        style={{ display: 'flex', gap: '0.6em', paddingLeft: menjorok ? '1.6em' : '0.5em', marginTop: '0.45em', lineHeight: 1.7 }}
      >
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
  const out: React.ReactNode[] = [];

  for (let i = 0; i < baris.length; i++) {
    // Kelompokkan baris tabel: diawali | (dan baris berikutnya juga, min. header)
    if (baris[i].trim().startsWith('|')) {
      const blok: string[] = [];
      while (i < baris.length && baris[i].trim().startsWith('|')) {
        blok.push(baris[i]);
        i++;
      }
      i--;
      out.push(<Tabel key={`t${i}`} blok={blok} />);
      continue;
    }
    out.push(<Baris key={i} baris={baris[i]} kunci={i} />);
  }

  return <>{out}</>;
}
