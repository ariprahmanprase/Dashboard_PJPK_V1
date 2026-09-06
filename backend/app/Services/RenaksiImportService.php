<?php

namespace App\Services;

use App\Models\RenaksiProgram;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

/**
 * Impor renaksi dari Excel untuk admin OPD.
 * Kolom template TIDAK menyertakan indikator — indikator dilengkapi di aplikasi.
 * OPD/dinas ditentukan dari akun yang login (admin OPD), bukan dari file.
 */
class RenaksiImportService
{
    /** Header kolom template (urut). */
    public const HEADERS = [
        'Tahun',
        'Kode Program',
        'Program',
        'Rencana Aksi',
        'Jenis Target',      // Kuantitatif / Kualitatif
        'Target',            // nilai (kuantitatif) / teks (kualitatif)
        'Satuan',            // opsional, khusus kuantitatif
        'Realisasi',         // nilai (kuantitatif) / teks (kualitatif) — opsional
        'Kendala',           // opsional
        'Catatan',           // opsional
        'Dokumentasi',       // opsional (link)
    ];

    /**
     * Generate file template .xlsx dan kembalikan sebagai response download.
     */
    public function downloadTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Template Renaksi');

        // Header
        foreach (self::HEADERS as $i => $header) {
            $col = chr(ord('A') + $i);
            $sheet->setCellValue("{$col}1", $header);
            $sheet->getStyle("{$col}1")->applyFromArray([
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '00A651']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            ]);
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
        $sheet->getRowDimension(1)->setRowHeight(28);

        // Baris contoh
        $contoh = [
            '2025',
            'PRG-001',
            'Program Pelayanan Administrasi Kependudukan',
            'Penyelenggaraan pelayanan adminduk secara daring',
            'Kuantitatif',
            '1000',
            'Dokumen',
            '850',
            'Keterbatasan jaringan di beberapa kecamatan',
            'Perlu sosialisasi tambahan',
            'https://drive.google.com/contoh',
        ];
        foreach ($contoh as $i => $val) {
            $col = chr(ord('A') + $i);
            $sheet->setCellValue("{$col}2", $val);
            $sheet->getStyle("{$col}2")->applyFromArray([
                'font' => ['italic' => true, 'color' => ['rgb' => '94A3B8']],
            ]);
        }

        // Baris petunjuk
        $sheet->setCellValue('A4', 'PETUNJUK:');
        $sheet->getStyle('A4')->getFont()->setBold(true);
        $notes = [
            '1. Hapus baris contoh (baris 2) sebelum mengisi data Anda.',
            '2. Kolom wajib: Tahun, Rencana Aksi, Jenis Target.',
            '3. Jenis Target hanya boleh: "Kuantitatif" atau "Kualitatif".',
            '4. Jika Kuantitatif: isi Target (angka) dan Satuan; Realisasi boleh angka.',
            '5. Jika Kualitatif: Target & Realisasi diisi teks.',
            '6. Kolom Realisasi, Kendala, Catatan, Dokumentasi boleh dikosongkan.',
            '7. Status dihitung otomatis oleh sistem dari Target vs Realisasi.',
            '8. Dinas/OPD otomatis sesuai akun Anda — tidak perlu diisi.',
            '9. Indikator terkait diisi nanti lewat aplikasi setelah data masuk.',
        ];
        foreach ($notes as $i => $note) {
            $sheet->setCellValue('A' . (5 + $i), $note);
            $sheet->getStyle('A' . (5 + $i))->getFont()->setSize(9)->getColor()->setRGB('64748B');
        }

        // Output sebagai download
        $filename = 'template-renaksi.xlsx';
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Parse file Excel yang di-upload menjadi array baris + validasi per baris.
     * Mengembalikan ['rows' => [...], 'valid_count' => n, 'error_count' => n].
     * Setiap row: ['no'=>int, 'data'=>[...], 'valid'=>bool, 'errors'=>[...]].
     */
    public function parseAndValidate(string $filePath): array
    {
        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($filePath);
        $sheet = $spreadsheet->getActiveSheet();
        $highestRow = $sheet->getHighestDataRow();

        $rows = [];
        $validCount = 0;
        $errorCount = 0;

        // Data dimulai baris 2 (baris 1 = header)
        for ($r = 2; $r <= $highestRow; $r++) {
            $tahun = $this->cellString($sheet, 'A', $r);
            $kodeProgram = $this->cellString($sheet, 'B', $r);
            $program = $this->cellString($sheet, 'C', $r);
            $rencanaAksi = $this->cellString($sheet, 'D', $r);
            $jenisTargetRaw = $this->cellString($sheet, 'E', $r);
            $targetRaw = $this->cellString($sheet, 'F', $r);
            $satuan = $this->cellString($sheet, 'G', $r);
            $realisasiRaw = $this->cellString($sheet, 'H', $r);
            $kendala = $this->cellString($sheet, 'I', $r);
            $catatan = $this->cellString($sheet, 'J', $r);
            $dokumentasi = $this->cellString($sheet, 'K', $r);

            // Lewati baris yang benar-benar kosong
            $semuaKosong = collect([$tahun, $kodeProgram, $program, $rencanaAksi, $jenisTargetRaw, $targetRaw, $realisasiRaw])
                ->every(fn($v) => $v === '');
            if ($semuaKosong) continue;

            $errors = [];

            // Validasi wajib
            if ($tahun === '' || !preg_match('/^\d{4}$/', $tahun)) {
                $errors[] = 'Tahun wajib diisi (4 digit, misal 2025)';
            }
            if ($rencanaAksi === '') {
                $errors[] = 'Rencana Aksi wajib diisi';
            }

            // Jenis target
            $jenisTarget = null;
            $jt = mb_strtolower(trim($jenisTargetRaw));
            if ($jt === 'kuantitatif') $jenisTarget = 'kuantitatif';
            elseif ($jt === 'kualitatif') $jenisTarget = 'kualitatif';
            else $errors[] = 'Jenis Target harus "Kuantitatif" atau "Kualitatif"';

            // Target & realisasi sesuai jenis
            $targetNilai = null; $targetTeks = null;
            $realisasiNilai = null; $realisasiTeks = null;
            if ($jenisTarget === 'kuantitatif') {
                if ($targetRaw !== '' && !is_numeric(str_replace([',', ' '], ['.', ''], $targetRaw))) {
                    $errors[] = 'Target (kuantitatif) harus berupa angka';
                } elseif ($targetRaw !== '') {
                    $targetNilai = (float) str_replace([',', ' '], ['.', ''], $targetRaw);
                }
                if ($realisasiRaw !== '' && !is_numeric(str_replace([',', ' '], ['.', ''], $realisasiRaw))) {
                    $errors[] = 'Realisasi (kuantitatif) harus berupa angka';
                } elseif ($realisasiRaw !== '') {
                    $realisasiNilai = (float) str_replace([',', ' '], ['.', ''], $realisasiRaw);
                }
            } elseif ($jenisTarget === 'kualitatif') {
                $targetTeks = $targetRaw !== '' ? $targetRaw : null;
                $realisasiTeks = $realisasiRaw !== '' ? $realisasiRaw : null;
            }

            $valid = empty($errors);
            if ($valid) $validCount++; else $errorCount++;

            $rows[] = [
                'no' => $r - 1, // nomor baris data (mulai 1)
                'valid' => $valid,
                'errors' => $errors,
                'data' => [
                    'tahun' => $tahun,
                    'kode_program' => $kodeProgram !== '' ? $kodeProgram : null,
                    'program' => $program !== '' ? $program : null,
                    'rencana_aksi' => $rencanaAksi,
                    'jenis_target' => $jenisTarget,
                    'target' => $targetTeks,
                    'target_nilai' => $targetNilai,
                    'target_satuan' => $satuan !== '' ? $satuan : null,
                    'realisasi' => $realisasiTeks,
                    'realisasi_nilai' => $realisasiNilai,
                    'kendala' => $kendala !== '' ? $kendala : null,
                    'catatan' => $catatan !== '' ? $catatan : null,
                    'dokumentasi' => $dokumentasi !== '' ? $dokumentasi : null,
                ],
            ];
        }

        return [
            'rows' => $rows,
            'valid_count' => $validCount,
            'error_count' => $errorCount,
        ];
    }

    /**
     * Simpan batch baris yang valid ke database untuk satu OPD.
     * $rows adalah array 'data' hasil parseAndValidate (yang valid saja).
     * Mengembalikan jumlah yang berhasil disimpan.
     */
    public function storeBatch(array $rowsData, int $opdId, string $dinasText, int $createdBy): int
    {
        $no = ((int) RenaksiProgram::max('no'));
        $saved = 0;

        foreach ($rowsData as $data) {
            $no++;
            RenaksiProgram::create([
                'no' => $no,
                'tahun' => $data['tahun'],
                'opd_id' => $opdId,
                'dinas_text' => $dinasText,
                'kode_program' => $data['kode_program'],
                'program' => $data['program'],
                'rencana_aksi' => $data['rencana_aksi'],
                'jenis_target' => $data['jenis_target'],
                'target' => $data['target'],
                'target_nilai' => $data['target_nilai'],
                'target_satuan' => $data['target_satuan'],
                'realisasi' => $data['realisasi'],
                'realisasi_nilai' => $data['realisasi_nilai'],
                'kendala' => $data['kendala'],
                'catatan' => $data['catatan'],
                'dokumentasi' => $data['dokumentasi'],
                'status' => $this->calcStatus($data['jenis_target'], $data['target_nilai'], $data['realisasi_nilai']),
                'created_by' => $createdBy,
            ]);
            $saved++;
        }

        return $saved;
    }

    /** Status renaksi kuantitatif dari target vs realisasi; kualitatif -> Belum diisi. */
    private function calcStatus(string $jenisTarget, $targetNilai, $realisasiNilai): string
    {
        if ($jenisTarget !== 'kuantitatif') return 'Belum diisi';
        if ($targetNilai === null || $realisasiNilai === null || (float) $targetNilai <= 0) return 'Belum diisi';
        $t = (float) $targetNilai;
        $r = (float) $realisasiNilai;
        if ($r >= $t) return 'Tercapai';
        if ($r >= $t * 0.9) return 'Hampir Tercapai';
        return 'Tidak Tercapai';
    }

    /** Ambil nilai sel sebagai string yang sudah di-trim. */
    private function cellString($sheet, string $col, int $row): string
    {
        $cell = $sheet->getCell($col . $row);
        $val = $cell->getFormattedValue();
        return trim((string) ($val ?? ''));
    }
}
