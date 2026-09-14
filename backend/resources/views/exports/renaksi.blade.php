<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Rencana Aksi</title>
    <style>
        /* dompdf-compatible: font DejaVu Sans (default) mendukung UTF-8 */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 8.5pt; color: #1e293b; }

        .kop { border-bottom: 2.5pt solid #047857; padding-bottom: 8pt; margin-bottom: 12pt; }
        .kop-table { width: 100%; border-collapse: collapse; }
        .kop-table td { border: none; vertical-align: middle; }
        .kop-logo { width: 52pt; }
        .kop-logo img { width: 44pt; height: 44pt; }
        .kop-title { font-size: 13pt; font-weight: bold; color: #065f46; }
        .kop-sub { font-size: 9pt; color: #475569; margin-top: 2pt; }

        .meta { font-size: 8pt; color: #475569; margin-bottom: 10pt; }
        .meta span { margin-right: 14pt; }

        .summary { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
        .summary td {
            border: 0.5pt solid #cbd5e1; padding: 5pt 6pt; text-align: center; width: 20%;
        }
        .summary .num { font-size: 12pt; font-weight: bold; }
        .summary .lbl { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.4pt; color: #64748b; }
        .c-green { color: #047857; } .c-yellow { color: #b45309; }
        .c-red { color: #b91c1c; } .c-gray { color: #64748b; } .c-blue { color: #0369a1; }

        table.data { width: 100%; border-collapse: collapse; }
        table.data th {
            background-color: #065f46; color: #ffffff; font-size: 7.5pt;
            text-transform: uppercase; letter-spacing: 0.3pt;
            padding: 5pt 4pt; border: 0.5pt solid #065f46; text-align: left;
        }
        table.data td {
            border: 0.5pt solid #cbd5e1; padding: 4pt; vertical-align: top; font-size: 8pt;
        }
        table.data tr.alt td { background-color: #f1f5f9; }

        .badge { font-weight: bold; font-size: 7.5pt; }
        .b-tercapai { color: #047857; } .b-hampir { color: #b45309; }
        .b-tidak { color: #b91c1c; } .b-belum { color: #64748b; }

        .footer { margin-top: 14pt; font-size: 8pt; color: #475569; }
        .footer-table { width: 100%; border-collapse: collapse; }
        .footer-table td { border: none; }
        .ttd { text-align: center; width: 220pt; }
        .ttd .nama { margin-top: 48pt; font-weight: bold; text-decoration: underline; }
    </style>
</head>
<body>
    {{-- Kop laporan --}}
    <div class="kop">
        <table class="kop-table">
            <tr>
                @php $logoPath = public_path('../frontend/public/logo-sidoarjo.webp'); @endphp
                @if (file_exists($logoPath))
                    <td class="kop-logo"><img src="{{ $logoPath }}" alt="Logo"></td>
                @endif
                <td>
                    <div class="kop-title">Laporan Pelaksanaan Rencana Aksi</div>
                    <div class="kop-sub">Dashboard PJPK — Pembangunan Kependudukan Kabupaten Sidoarjo</div>
                </td>
            </tr>
        </table>
    </div>

    {{-- Meta: filter aktif & waktu cetak --}}
    <div class="meta">
        @forelse ($filters as $label => $value)
            <span><strong>{{ $label }}:</strong> {{ $value }}</span>
        @empty
            <span><strong>Filter:</strong> Semua data</span>
        @endforelse
        <span><strong>Dicetak:</strong> {{ $printedAt }} WIB oleh {{ $printedBy }}</span>
    </div>

    {{-- Ringkasan status --}}
    <table class="summary">
        <tr>
            <td><div class="num c-blue">{{ $summary['total'] }}</div><div class="lbl">Total Renaksi</div></td>
            <td><div class="num c-green">{{ $summary['tercapai'] }}</div><div class="lbl">Tercapai</div></td>
            <td><div class="num c-yellow">{{ $summary['hampir_tercapai'] }}</div><div class="lbl">Hampir Tercapai</div></td>
            <td><div class="num c-red">{{ $summary['tidak_tercapai'] }}</div><div class="lbl">Tidak Tercapai</div></td>
            <td><div class="num c-gray">{{ $summary['belum_diisi'] }}</div><div class="lbl">Belum Diisi</div></td>
        </tr>
    </table>

    {{-- Tabel data --}}
    <table class="data">
        <thead>
            <tr>
                <th style="width: 22pt;">No</th>
                <th style="width: 88pt;">Dinas</th>
                <th style="width: 110pt;">Program</th>
                <th>Rencana Aksi</th>
                <th style="width: 32pt;">Tahun</th>
                <th style="width: 72pt;">Target</th>
                <th style="width: 72pt;">Realisasi</th>
                <th style="width: 100pt;">Indikator</th>
                <th style="width: 62pt;">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $i => $r)
                @php
                    $fmt = function ($row, $field) {
                        if ($row->jenis_target === 'kuantitatif') {
                            $nilai = $field === 'target' ? $row->target_nilai : $row->realisasi_nilai;
                            if ($nilai === null) return '-';
                            $formatted = fmod((float) $nilai, 1.0) === 0.0
                                ? number_format((float) $nilai, 0, ',', '.')
                                : number_format((float) $nilai, 2, ',', '.');
                            return $row->target_satuan ? $formatted . ' ' . $row->target_satuan : $formatted;
                        }
                        $teks = $field === 'target' ? $row->target : $row->realisasi;
                        return $teks && $teks !== '-' ? $teks : '-';
                    };
                    $statusClass = match ($r->status) {
                        'Tercapai' => 'b-tercapai',
                        'Hampir Tercapai' => 'b-hampir',
                        'Tidak Tercapai' => 'b-tidak',
                        default => 'b-belum',
                    };
                @endphp
                <tr class="{{ $i % 2 === 1 ? 'alt' : '' }}">
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $r->dinas_text ?? '-' }}</td>
                    <td>{{ $r->program ?? '-' }}</td>
                    <td>{{ $r->rencana_aksi }}</td>
                    <td>{{ $r->tahun }}</td>
                    <td>{{ $fmt($r, 'target') }}</td>
                    <td>{{ $fmt($r, 'realisasi') }}</td>
                    <td>{{ implode('; ', $r->indikator_list) ?: '-' }}</td>
                    <td><span class="badge {{ $statusClass }}">{{ $r->status }}</span></td>
                </tr>
            @empty
                <tr>
                    <td colspan="9" style="text-align: center; padding: 16pt; color: #64748b;">
                        Tidak ada data yang sesuai dengan filter
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- Tanda tangan --}}
    <div class="footer">
        <table class="footer-table">
            <tr>
                <td></td>
                <td class="ttd">
                    Sidoarjo, {{ $printedAt }}<br>
                    Dicetak oleh,<br>
                    <div class="nama">{{ $printedBy }}</div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
