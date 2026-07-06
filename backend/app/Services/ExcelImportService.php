<?php

namespace App\Services;

use App\Models\Indikator;
use App\Models\Opd;
use App\Models\Pilar;
use App\Models\Renaksi;
use App\Models\TargetCapaian;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ExcelImportService
{
    private array $pilarMap = [];
    private array $opdMap = [];
    private array $indikatorMap = [];

    public function import(string $filePath): array
    {
        // Clear existing data
        Renaksi::query()->delete();
        TargetCapaian::query()->delete();
        Indikator::query()->delete();
        Opd::query()->delete();
        Pilar::query()->delete();

        $spreadsheet = IOFactory::load($filePath);

        $this->importPilar();
        $this->importOpd($spreadsheet);
        $this->importIndikator($spreadsheet);
        $this->importTargetCapaian($spreadsheet);
        $this->importRenaksi($spreadsheet);

        return [
            'pilar' => Pilar::count(),
            'opd' => Opd::count(),
            'indikator' => Indikator::count(),
            'target_capaian' => TargetCapaian::count(),
            'renaksi' => Renaksi::count(),
        ];
    }

    private function importPilar(): void
    {
        $data = [
            1 => 'Pilar 1: Kuantitas Penduduk',
            2 => 'Pilar 2: Kualitas Penduduk',
            3 => 'Pilar 3: Pembangunan Keluarga',
            4 => 'Pilar 4: Persebaran Penduduk',
            5 => 'Pilar 5: Administrasi Kependudukan',
        ];

        foreach ($data as $no => $nama) {
            $pilar = Pilar::create(['no_pilar' => $no, 'nama_pilar' => $nama]);
            $this->pilarMap[$no] = $pilar->id;
        }
    }

    private function importOpd($spreadsheet): void
    {
        $ws = $spreadsheet->getSheetByName('DATA_OPD');
        $seen = [];

        foreach ($ws->getRowIterator(4) as $row) {
            $cell = $row->getCellIterator();
            $cell->setIterateOnlyExistingCells(false);
            $values = [];
            foreach ($cell as $c) $values[] = trim((string) $c->getValue());

            $namaOpd = $values[1] ?? '';
            if (empty($namaOpd) || str_starts_with($namaOpd, '💡')) break;
            if (in_array($namaOpd, $seen)) continue;
            $seen[] = $namaOpd;

            $opd = Opd::create(['kode_opd' => $namaOpd, 'nama_opd' => $namaOpd]);
            $this->opdMap[$namaOpd] = $opd->id;
        }
    }

    private array $lowerBetterMap = [];

    private function importIndikator($spreadsheet): void
    {
        $ws = $spreadsheet->getSheetByName('DATA_OPD');
        $master = $spreadsheet->getSheetByName('LOOKER_MASTER');

        // Build satuan lookup from LOOKER_MASTER
        $satuanLookup = [];
        foreach ($master->getRowIterator(4) as $row) {
            $cell = $row->getCellIterator();
            $cell->setIterateOnlyExistingCells(false);
            $vals = [];
            foreach ($cell as $c) $vals[] = trim((string) $c->getValue());
            if (empty($vals[0])) continue;
            $satuanLookup[$vals[0]] = $vals[4] ?? '';
        }

        $noUrut = 0;
        foreach ($ws->getRowIterator(4) as $row) {
            $cell = $row->getCellIterator();
            $cell->setIterateOnlyExistingCells(false);
            $values = [];
            foreach ($cell as $c) $values[] = trim((string) $c->getValue());

            $kode = $values[4] ?? '';
            if (empty($kode)) break;
            if (str_starts_with($kode, '💡')) break;

            $noUrut++;
            $namaOpd = $values[1];
            $noPilar = (int) $values[2];
            $namaIndikator = $values[3];
            $lb = in_array(strtolower($values[6] ?? ''), ['ya']) ? 'Ya' : 'Tidak';
            $satuan = $satuanLookup[$kode] ?? '';

            $indikator = Indikator::create([
                'kode' => $kode,
                'no_urut' => $noUrut,
                'pilar_id' => $this->pilarMap[$noPilar],
                'opd_id' => $this->opdMap[$namaOpd],
                'nama_indikator' => $namaIndikator,
                'satuan' => $satuan,
                'lower_better' => $lb,
            ]);
            $this->indikatorMap[$kode] = $indikator->id;
            $this->lowerBetterMap[$kode] = $lb;
        }
    }

    private function importTargetCapaian($spreadsheet): void
    {
        $ws = $spreadsheet->getSheetByName('LOOKER_MASTER');
        $count = 0;

        foreach ($ws->getRowIterator(4) as $row) {
            $cell = $row->getCellIterator();
            $cell->setIterateOnlyExistingCells(false);
            $values = [];
            foreach ($cell as $c) $values[] = trim((string) $c->getValue());

            $kode = $values[0] ?? '';
            if (empty($kode)) continue;
            if (!isset($this->indikatorMap[$kode])) continue;

            $tahun = (int) $values[6];
            $target = is_numeric($values[7]) ? (float) $values[7] : null;
            $capaian = is_numeric($values[8]) ? (float) $values[8] : null;

            // Calculate gap & pct_gap
            $gap = null;
            $pctGap = null;
            if ($target !== null && $capaian !== null) {
                $gap = round($capaian - $target, 2);
                if ($target != 0) {
                    $pctGap = round(($capaian - $target) / abs($target), 6);
                }
            }

            // Calculate status_tl & warna_tl (Excel formulas are not evaluated)
            $lb = $this->lowerBetterMap[$kode] ?? 'Tidak';
            $statusTl = $this->calcStatusTL($target, $capaian, $lb);
            $warnaTl = $this->statusToWarna($statusTl);

            // Get keterangan - skip if it's a formula
            $rawKet = trim((string) ($values[14] ?? ''));
            $keterangan = (empty($rawKet) || str_starts_with($rawKet, '=')) ? null : $rawKet;

            TargetCapaian::create([
                'indikator_id' => $this->indikatorMap[$kode],
                'tahun' => $tahun,
                'target' => $target,
                'capaian' => $capaian,
                'gap' => $gap,
                'pct_gap' => $pctGap,
                'status_tl' => $statusTl,
                'warna_tl' => $warnaTl,
                'keterangan' => $keterangan,
            ]);
            $count++;
        }
    }

    private function importRenaksi($spreadsheet): void
    {
        $ws = $spreadsheet->getSheetByName('DATA_RENAKSI');

        foreach ($ws->getRowIterator(4) as $row) {
            $cell = $row->getCellIterator();
            $cell->setIterateOnlyExistingCells(false);
            $values = [];
            foreach ($cell as $c) $values[] = trim((string) $c->getValue());

            $kode = $values[4] ?? '';
            $namaOpd = $values[1] ?? '';
            $namaKegiatan = $values[6] ?? '';

            if (empty($kode) || empty($namaKegiatan)) continue;
            if (!isset($this->indikatorMap[$kode])) continue;
            if (!isset($this->opdMap[$namaOpd])) continue;

            $tahun = (int) $values[5];
            $status = in_array($values[7] ?? '', ['Terlaksana', 'Tidak Terlaksana']) ? $values[7] : 'Terlaksana';
            $keterangan = !empty($values[8]) ? $values[8] : null;
            $kolaborasi = !empty($values[9]) && $values[9] !== '—' ? $values[9] : null;

            Renaksi::create([
                'indikator_id' => $this->indikatorMap[$kode],
                'tahun' => $tahun,
                'opd_id' => $this->opdMap[$namaOpd],
                'nama_kegiatan' => $namaKegiatan,
                'status' => $status,
                'keterangan' => $keterangan,
                'kolaborasi_opd' => $kolaborasi,
            ]);
        }
    }

    private function safeValue($val): ?string
    {
        return $val !== null && $val !== '' ? trim((string) $val) : null;
    }

    private function calcStatusTL($target, $capaian, string $lowerBetter): string
    {
        if ($capaian === null) return 'Belum Diisi';
        if ($target === null) return 'Belum Diisi';

        if ($lowerBetter === 'Ya') {
            // Lower is better: capaian <= target = On Track
            if ($capaian <= $target) return 'On Track';
            if ($capaian <= $target * 1.1) return 'Warning';
            return 'Alert';
        } else {
            // Higher is better: capaian >= target = On Track
            if ($capaian >= $target) return 'On Track';
            if ($capaian >= $target * 0.9) return 'Warning';
            return 'Alert';
        }
    }

    private function statusToWarna(string $status): string
    {
        return match ($status) {
            'On Track' => 'Hijau',
            'Warning' => 'Kuning',
            'Alert' => 'Merah',
            default => 'Abu',
        };
    }
}
