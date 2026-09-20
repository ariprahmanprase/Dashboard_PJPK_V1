<?php

namespace App\Services;

use App\Models\Indikator;
use App\Models\Opd;
use App\Models\RenaksiProgram;
use App\Models\TargetCapaian;
use Illuminate\Database\Eloquent\Builder;

class DashboardService
{
    /**
     * Parse filter opd_id — mendukung multi-id dipisah koma ("105,116,117")
     * agar filter per dinas induk mencakup semua bidangnya. Selalu array.
     */
    private function opdIds(array $filters): array
    {
        $raw = $filters['opd_id'] ?? null;
        if (empty($raw)) return [];
        return collect(explode(',', (string) $raw))
            ->map(fn($v) => (int) trim($v))
            ->filter(fn($v) => $v > 0)
            ->values()
            ->all();
    }
    /**
     * Hitung status_tl berdasarkan arah target indikator:
     * - Higher Better : HIJAU capaian ≥ target, KUNING ≥ 90% target, MERAH < 90%
     * - Lower Better  : HIJAU capaian ≤ target, KUNING ≤ 110% target, MERAH > 110%
     * - Maintain / Stable & Proportional:
     *             HIJAU capaian = target persis, selain itu MERAH (tanpa KUNING)
     * - arah_target null (data lama): fallback ke logika Higher Better
     * - In Between (target rentang, mis. I-16 TPT 6,43–6,48; batas EKSKLUSIF):
     *             HIJAU di dalam rentang, KUNING tepat di batas, MERAH di luar rentang.
     *             Batas atas diambil dari $targetMax (kolom target_max); bila kosong,
     *             target diperlakukan sebagai target tunggal biasa (logika Maintain).
     */
    public function calcStatusTL($target, $capaian, ?string $arahTarget = null, $targetMax = null): array
    {
        if ($capaian === null || $target === null || $target == 0) {
            return ['status_tl' => 'Belum Diisi', 'warna_tl' => 'Abu'];
        }

        if ($arahTarget === 'In Between' && $targetMax !== null) {
            $lo = min((float) $target, (float) $targetMax);
            $hi = max((float) $target, (float) $targetMax);
            $c = (float) $capaian;

            if (abs($c - $lo) < 1e-9 || abs($c - $hi) < 1e-9) {
                return ['status_tl' => 'Warning', 'warna_tl' => 'Kuning'];
            }
            if ($c > $lo && $c < $hi) {
                return ['status_tl' => 'On Track', 'warna_tl' => 'Hijau'];
            }
            return ['status_tl' => 'Alert', 'warna_tl' => 'Merah'];
        }

        if (in_array($arahTarget, ['Maintain / Stable', 'Proportional', 'In Between'], true)) {
            return abs($capaian - $target) < 1e-9
                ? ['status_tl' => 'On Track', 'warna_tl' => 'Hijau']
                : ['status_tl' => 'Alert', 'warna_tl' => 'Merah'];
        }

        if ($arahTarget === 'Lower Better') {
            if ($capaian <= $target) {
                return ['status_tl' => 'On Track', 'warna_tl' => 'Hijau'];
            }
            if ($capaian <= $target * 1.1) {
                return ['status_tl' => 'Warning', 'warna_tl' => 'Kuning'];
            }
            return ['status_tl' => 'Alert', 'warna_tl' => 'Merah'];
        }

        // Default: arah target Higher Better
        if ($capaian >= $target) {
            return ['status_tl' => 'On Track', 'warna_tl' => 'Hijau'];
        }
        if ($capaian >= $target * 0.9) {
            return ['status_tl' => 'Warning', 'warna_tl' => 'Kuning'];
        }
        return ['status_tl' => 'Alert', 'warna_tl' => 'Merah'];
    }

    /**
     * Get indicator IDs filtered by COMPUTED status (not DB column).
     * Fetches semua target_capaian, hitung ulang status, return IDs yang cocok.
     */
    private function getIndicatorIdsByComputedStatus(Builder $indikatorQuery, string $statusTl, ?string $tahun): array
    {
        $tahun = $tahun ?? '2025';
        $arahMap = (clone $indikatorQuery)->pluck('arah_target', 'id');

        $tcs = TargetCapaian::whereIn('indikator_id', $arahMap->keys())
            ->where('tahun', $tahun)
            ->select('indikator_id', 'target', 'target_max', 'capaian')
            ->get()
            ->keyBy('indikator_id');

        // Iterasi per indikator: yang tanpa baris TC tahun ini dihitung
        // dengan target/capaian null → sama dengan definisi getTableData().
        $matching = [];
        foreach ($arahMap as $indikatorId => $arah) {
            $tc = $tcs->get($indikatorId);
            $s = $this->calcStatusTL($tc->target ?? null, $tc->capaian ?? null, $arah, $tc->target_max ?? null);
            if ($s['status_tl'] === $statusTl) {
                $matching[] = $indikatorId;
            }
        }

        return $matching;
    }

    /**
     * Update semua target_capaians di DB (untuk backward compatibility)
     */
    public function recalculateAllStatus(): int
    {
        $updated = 0;
        $rows = TargetCapaian::all();
        $arahMap = Indikator::pluck('arah_target', 'id');

        foreach ($rows as $tc) {
            $new = $this->calcStatusTL($tc->target, $tc->capaian, $arahMap[$tc->indikator_id] ?? null, $tc->target_max);
            if ($tc->status_tl !== $new['status_tl'] || $tc->warna_tl !== $new['warna_tl']) {
                $tc->status_tl = $new['status_tl'];
                $tc->warna_tl = $new['warna_tl'];
                $tc->save();
                $updated++;
            }
        }

        return $updated;
    }

    // ─────────────────────────────────────────────────────
    //  SCORECARDS
    // ─────────────────────────────────────────────────────
    public function getScorecards(array $filters = []): array
    {
        $tahun = $filters['tahun'] ?? '2025';

        $indikatorQuery = $this->applyFilters(Indikator::query(), $filters);
        $opdQuery = $this->applyFiltersToOpd($filters);

        $totalIndikator = $indikatorQuery->count();
        $totalOpd = $opdQuery->distinct('opds.id')->count();

        // Fetch all target_capaians & compute status dinamis
        $arahMap = (clone $indikatorQuery)->pluck('arah_target', 'id');
        $rows = TargetCapaian::whereIn('indikator_id', $arahMap->keys())
            ->where('tahun', $tahun)
            ->select('indikator_id', 'target', 'target_max', 'capaian')
            ->get()
            ->keyBy('indikator_id');

        $onTrack = 0;
        $warning = 0;
        $alert = 0;
        $belumDiisi = 0;
        $capaianBelum = 0;

        // Iterasi per INDIKATOR (bukan per baris TC) agar indikator tanpa
        // baris target_capaian tahun ini tetap terhitung.
        // "Capaian belum diinput" = status Belum Diisi (target ATAU capaian
        // kosong) — selaras dengan getTableData() dan popup status.
        foreach ($arahMap as $indikatorId => $arah) {
            $tc = $rows->get($indikatorId);

            $s = $this->calcStatusTL($tc->target ?? null, $tc->capaian ?? null, $arah, $tc->target_max ?? null);
            if ($s['status_tl'] === 'Belum Diisi') {
                $capaianBelum++;
            }
            match ($s['status_tl']) {
                'On Track' => $onTrack++,
                'Warning' => $warning++,
                'Alert' => $alert++,
                default => $belumDiisi++,
            };
        }

        return [
            'total_indikator' => $totalIndikator,
            'total_opd' => $totalOpd,
            'on_track' => $onTrack,
            'warning' => $warning,
            'alert' => $alert,
            'capaian_belum_diinput' => $capaianBelum,
        ];
    }

    // ─────────────────────────────────────────────────────
    //  TABLE DATA
    // ─────────────────────────────────────────────────────
    public function getTableData(array $filters = []): array
    {
        $tahun = $filters['tahun'] ?? '2025';
        $indikatorQuery = $this->applyFilters(Indikator::query()->with(['pilar', 'opds']), $filters);

        $results = $indikatorQuery->orderBy('kode')->get();

        return $results->map(function ($indikator) use ($tahun) {
            $tc = $indikator->targetCapaians()
                ->when($tahun, fn($q) => $q->where('tahun', $tahun))
                ->orderBy('tahun', 'desc')
                ->first();

            $target = $tc->target ?? null;
            $capaian = $tc->capaian ?? null;
            $status = $this->calcStatusTL($target, $capaian, $indikator->arah_target, $tc->target_max ?? null);
            $gap = ($capaian !== null && $target !== null) ? round($capaian - $target, 6) : null;

            return [
                'kode'            => $indikator->kode,
                'nama_indikator'  => $indikator->nama_indikator,
                'arah_target'     => $indikator->arah_target,
                'nama_opd'        => $indikator->nama_opd,           // accessor: join dari pivot
                'opd_list'        => $indikator->opds->pluck('nama_opd')->toArray(),
                'pilar_id'        => $indikator->pilar_id,
                'opd_ids'         => $indikator->opds->pluck('id')->toArray(),
                'nama_pilar'      => $indikator->pilar->nama_pilar ?? '-',
                'status_tl'       => $status['status_tl'],
                'warna_tl'        => $status['warna_tl'],
                'target'          => $target,
                'target_max'      => $tc->target_max ?? null,
                'capaian'         => $capaian,
                'gap'             => $gap,
                'pct_gap'         => ($gap !== null && $target != 0) ? round($gap / $target, 6) : null,
                'satuan'          => $indikator->satuan,
                'tahun'           => $tc->tahun ?? null,
                'sumber_data'     => $indikator->sumber_data,
                'baseline_2024'   => $indikator->baseline_2024,
                'dokrenda'        => $indikator->dokrenda,
                'kendala'         => $indikator->kendala,
                'inovasi'         => $indikator->inovasi,
            ];
        })->toArray();
    }

    // ─────────────────────────────────────────────────────
    //  CHART DATA (trend avg target vs capaian)
    // ─────────────────────────────────────────────────────
    public function getChartData(array $filters = []): array
    {
        $indikatorQuery = $this->applyFilters(Indikator::query(), $filters);

        $query = TargetCapaian::whereIn('indikator_id', $indikatorQuery->pluck('id'));

        return $query
            ->selectRaw('tahun, ROUND(AVG(target), 2) as avg_target, ROUND(AVG(capaian), 2) as avg_capaian, COUNT(*) as count')
            ->groupBy('tahun')
            ->orderBy('tahun')
            ->get()
            ->toArray();
    }

    // ─────────────────────────────────────────────────────
    //  PIE RENAKSI (dari renaksi_programs — sumber data aktual)
    // ─────────────────────────────────────────────────────
    public function getRenaksiPieData(array $filters = []): array
    {
        $tahun = $filters['tahun'] ?? '2025';

        $query = RenaksiProgram::query()->where('tahun', $tahun);

        if ($opdIds = $this->opdIds($filters)) {
            $query->whereIn('opd_id', $opdIds);
        }
        if (!empty($filters['pilar_id'])) {
            $pilarId = $filters['pilar_id'];
            $query->where(function ($q) use ($pilarId) {
                foreach (['indikator_1_id', 'indikator_2_id', 'indikator_3_id', 'indikator_4_id'] as $col) {
                    $q->orWhereIn($col, function ($sub) use ($pilarId) {
                        $sub->select('id')->from('indikators')->where('pilar_id', $pilarId);
                    });
                }
            });
        }
        if (!empty($filters['indikator_id'])) {
            $indikatorId = $filters['indikator_id'];
            $query->where(function ($q) use ($indikatorId) {
                $q->where('indikator_1_id', $indikatorId)
                  ->orWhere('indikator_2_id', $indikatorId)
                  ->orWhere('indikator_3_id', $indikatorId)
                  ->orWhere('indikator_4_id', $indikatorId);
            });
        }

        $byStatus = $query
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return [
            'tercapai'        => $byStatus['Tercapai'] ?? 0,
            'hampir_tercapai' => $byStatus['Hampir Tercapai'] ?? 0,
            'tidak_tercapai'  => $byStatus['Tidak Tercapai'] ?? 0,
            'belum_diisi'     => $byStatus['Belum diisi'] ?? 0,
        ];
    }

    public function getRenaksiList(array $filters = []): array
    {
        $indikatorQuery = $this->applyFilters(Indikator::query(), $filters);
        $indikatorIds = $indikatorQuery->pluck('id');

        $query = \App\Models\Renaksi::whereIn('indikator_id', $indikatorIds)
            ->with(['indikator', 'opd'])
            ->orderBy('tahun', 'desc')
            ->orderBy('id');

        if (!empty($filters['status_renaksi'])) {
            $query->where('status', $filters['status_renaksi']);
        }

        return $query->get()
            ->map(fn($r, $i) => [
                'no' => $i + 1,
                'indikator' => $r->indikator->kode . ' — ' . $r->indikator->nama_indikator,
                'rencana_aksi' => $r->nama_kegiatan,
                'tahun' => $r->tahun,
                'status' => $r->status,
                'catatan' => $r->keterangan,
                'opd' => $r->opd->nama_opd ?? '-',
            ])
            ->toArray();
    }

    // ─────────────────────────────────────────────────────
    //  PER PILAR (stacked bar) — computed status
    // ─────────────────────────────────────────────────────
    public function getPerPilar(array $filters = []): array
    {
        $tahun = $filters['tahun'] ?? '2025';
        $indikatorQuery = $this->applyFilters(Indikator::query()->with('pilar'), $filters);
        $indikators = $indikatorQuery->get();

        $tcs = TargetCapaian::whereIn('indikator_id', $indikators->pluck('id'))
            ->where('tahun', $tahun)
            ->select('indikator_id', 'target', 'target_max', 'capaian')
            ->get()
            ->keyBy('indikator_id');

        $grouped = [];
        foreach ($indikators as $ind) {
            $pilar = $ind->pilar->nama_pilar ?? '-';
            $noPilar = $ind->pilar->no_pilar ?? 0;
            $tc = $tcs->get($ind->id);

            $s = $this->calcStatusTL($tc->target ?? null, $tc->capaian ?? null, $ind->arah_target, $tc->target_max ?? null);

            if (!isset($grouped[$pilar])) {
                $grouped[$pilar] = ['pilar' => $pilar, 'no_pilar' => $noPilar, 'on_track' => 0, 'warning' => 0, 'alert' => 0, 'belum_diisi' => 0];
            }
            $key = match ($s['status_tl']) {
                'On Track' => 'on_track',
                'Warning' => 'warning',
                'Alert' => 'alert',
                default => 'belum_diisi',
            };
            $grouped[$pilar][$key]++;
        }

        // Sort by pilar number
        usort($grouped, fn($a, $b) => $a['no_pilar'] <=> $b['no_pilar']);
        return array_map(fn($g) => ['pilar' => $g['pilar'], 'on_track' => $g['on_track'], 'warning' => $g['warning'], 'alert' => $g['alert'], 'belum_diisi' => $g['belum_diisi']], $grouped);
    }

    // ─────────────────────────────────────────────────────
    //  PER OPD (stacked bar) — computed status
    // ─────────────────────────────────────────────────────
    public function getPerOpd(array $filters = []): array
    {
        $tahun = $filters['tahun'] ?? '2025';
        $indikatorQuery = $this->applyFilters(Indikator::query()->with('opds'), $filters);
        $indikators = $indikatorQuery->get();

        $tcs = TargetCapaian::whereIn('indikator_id', $indikators->pluck('id'))
            ->where('tahun', $tahun)
            ->select('indikator_id', 'target', 'target_max', 'capaian')
            ->get()
            ->keyBy('indikator_id');

        $grouped = [];
        foreach ($indikators as $ind) {
            $tc = $tcs->get($ind->id);
            $s = $this->calcStatusTL($tc->target ?? null, $tc->capaian ?? null, $ind->arah_target, $tc->target_max ?? null);

            foreach ($ind->opds as $opd) {
                $opdName = $opd->nama_opd;
                if (!isset($grouped[$opdName])) {
                    $grouped[$opdName] = ['opd' => $opdName, 'singkatan' => $opd->singkatan, 'on_track' => 0, 'warning' => 0, 'alert' => 0, 'belum_diisi' => 0];
                }
                $key = match ($s['status_tl']) {
                    'On Track' => 'on_track',
                    'Warning' => 'warning',
                    'Alert' => 'alert',
                    default => 'belum_diisi',
                };
                $grouped[$opdName][$key]++;
            }
        }

        ksort($grouped);
        return array_values($grouped);
    }

    // ─────────────────────────────────────────────────────
    //  HEATMAP — computed status
    // ─────────────────────────────────────────────────────
    public function getHeatmap(array $filters = []): array
    {
        $indikatorQuery = $this->applyFilters(Indikator::query()->with('pilar'), $filters);
        $indikators = $indikatorQuery->orderBy('kode')->get();

        $allData = \Illuminate\Support\Facades\DB::table('target_capaians')
            ->whereIn('indikator_id', $indikators->pluck('id'))
            ->select('indikator_id', 'tahun', 'target', 'target_max', 'capaian')
            ->get()
            ->groupBy('indikator_id');

        return $indikators->map(function ($ind) use ($allData) {
            $row = [
                'kode' => $ind->kode,
                'nama_indikator' => $ind->nama_indikator,
                'pilar' => $ind->pilar->nama_pilar ?? '-',
                'arah_target' => $ind->arah_target,
            ];
            $tc = $allData->get($ind->id, collect());
            foreach (['2025', '2026', '2027', '2028', '2029'] as $thn) {
                $match = $tc->firstWhere('tahun', $thn);
                $target = $match->target ?? null;
                $capaian = $match->capaian ?? null;
                $s = $this->calcStatusTL($target, $capaian, $ind->arah_target, $match->target_max ?? null);
                $row['status_' . $thn] = $s['status_tl'];
                $row['warna_' . $thn] = $s['warna_tl'];
                $row['target_' . $thn] = $target;
                $row['target_max_' . $thn] = isset($match->target_max) ? $match->target_max : null;
                $row['capaian_' . $thn] = $capaian;
                $row['gap_' . $thn] = ($capaian !== null && $target !== null) ? round($capaian - $target, 4) : null;
            }
            return $row;
        })->toArray();
    }

    // ─────────────────────────────────────────────────────
    //  CHART PER PILAR (small multiples)
    // ─────────────────────────────────────────────────────
    public function getChartPerPilar(array $filters = []): array
    {
        $indikatorQuery = $this->applyFilters(Indikator::query(), $filters);
        $indikators = $indikatorQuery->with('pilar')->get();

        $tcQuery = TargetCapaian::whereIn('indikator_id', $indikators->pluck('id'));

        $allData = $tcQuery
            ->selectRaw('indikator_id, tahun, AVG(target) as avg_target, AVG(capaian) as avg_capaian')
            ->groupBy('indikator_id', 'tahun')
            ->get()
            ->groupBy('indikator_id');

        $result = [];
        foreach ($indikators->groupBy('pilar_id') as $pilarId => $group) {
            $pilarName = $group->first()->pilar->nama_pilar ?? "Pilar $pilarId";
            $byYear = [];
            foreach (['2025', '2026', '2027', '2028', '2029'] as $thn) {
                $targets = [];
                $capaians = [];
                foreach ($group as $ind) {
                    $row = optional($allData->get($ind->id, collect())->firstWhere('tahun', $thn));
                    if ($row->avg_target !== null) $targets[] = (float) $row->avg_target;
                    if ($row->avg_capaian !== null) $capaians[] = (float) $row->avg_capaian;
                }
                $byYear[] = [
                    'tahun' => $thn,
                    'avg_target' => count($targets) ? round(array_sum($targets) / count($targets), 2) : null,
                    'avg_capaian' => count($capaians) ? round(array_sum($capaians) / count($capaians), 2) : null,
                ];
            }
            $result[] = ['pilar' => $pilarName, 'data' => $byYear];
        }

        return $result;
    }

    // ─────────────────────────────────────────────────────
    //  CHART PER INDIKATOR (small multiples)
    // ─────────────────────────────────────────────────────
    public function getChartPerIndikator(array $filters = []): array
    {
        $indikatorQuery = $this->applyFilters(Indikator::query(), $filters);
        $indikators = $indikatorQuery->orderBy('kode')->get();

        $allData = TargetCapaian::whereIn('indikator_id', $indikators->pluck('id'))
            ->selectRaw('indikator_id, tahun, AVG(target) as avg_target, AVG(capaian) as avg_capaian')
            ->groupBy('indikator_id', 'tahun')
            ->get()
            ->groupBy('indikator_id');

        $result = [];
        foreach ($indikators as $ind) {
            $byYear = [];
            foreach (['2025', '2026', '2027', '2028', '2029'] as $thn) {
                $row = optional($allData->get($ind->id, collect())->firstWhere('tahun', $thn));
                $byYear[] = [
                    'tahun'       => $thn,
                    'avg_target'  => $row->avg_target !== null ? round((float) $row->avg_target, 2) : null,
                    'avg_capaian' => $row->avg_capaian !== null ? round((float) $row->avg_capaian, 2) : null,
                ];
            }
            $result[] = ['indikator' => "{$ind->kode} — {$ind->nama_indikator}", 'data' => $byYear];
        }

        return $result;
    }

    // ─────────────────────────────────────────────────────
    //  FILTERS
    // ─────────────────────────────────────────────────────
    private function applyFilters(Builder $query, array $filters): Builder
    {
        if ($opdIds = $this->opdIds($filters)) {
            $query->whereHas('opds', function ($q) use ($opdIds) {
                $q->whereIn('opds.id', $opdIds);
            });
        }
        if (!empty($filters['pilar_id'])) {
            $query->where('pilar_id', $filters['pilar_id']);
        }
        if (!empty($filters['indikator_id'])) {
            $query->where('id', $filters['indikator_id']);
        }
        if (!empty($filters['status_tl'])) {
            // Compute status dari target & capaian, bukan dari kolom DB
            $tahun = $filters['tahun'] ?? null;
            $matchingIds = $this->getIndicatorIdsByComputedStatus(
                clone $query,
                $filters['status_tl'],
                $tahun
            );
            $query->whereIn('id', $matchingIds ?: [0]);
        }
        return $query;
    }

    private function applyFiltersToOpd(array $filters)
    {
        $query = Opd::query();
        if ($opdIds = $this->opdIds($filters)) {
            $query->whereIn('id', $opdIds);
        }
        if (!empty($filters['pilar_id']) || !empty($filters['indikator_id']) || !empty($filters['status_tl'])) {
            $query->whereHas('indikators', function ($q) use ($filters) {
                if (!empty($filters['pilar_id'])) $q->where('pilar_id', $filters['pilar_id']);
                if (!empty($filters['indikator_id'])) $q->where('id', $filters['indikator_id']);
                if (!empty($filters['status_tl'])) {
                    $tahun = $filters['tahun'] ?? '2025';
                    $matchingIds = $this->getIndicatorIdsByComputedStatus(
                        \App\Models\Indikator::query(),
                        $filters['status_tl'],
                        $tahun
                    );
                    $q->whereIn('id', $matchingIds ?: [0]);
                }
            });
        }
        return $query;
    }

    // ─────────────────────────────────────────────────────
    //  INDIKATOR DETAIL (popup baru)
    // ─────────────────────────────────────────────────────
    public function getIndikatorDetail(string $kode): ?array
    {
        $indikator = Indikator::where('kode', $kode)
            ->with(['pilar', 'opds', 'renaksis.opd'])
            ->first();

        if (!$indikator) return null;

        // Target & capaian per tahun (2025-2029)
        $tcs = TargetCapaian::where('indikator_id', $indikator->id)
            ->orderBy('tahun')
            ->get()
            ->keyBy('tahun');

        $targetCapaians = [];
        foreach (['2025', '2026', '2027', '2028', '2029'] as $thn) {
            $tc = $tcs->get($thn);
            $t = $tc->target ?? null;
            $c = $tc->capaian ?? null;
            $s = $this->calcStatusTL($t, $c, $indikator->arah_target, $tc->target_max ?? null);
            $gap = ($c !== null && $t !== null) ? round($c - $t, 6) : null;
            $pctGap = ($gap !== null && $t != 0) ? round($gap / $t, 6) : null;

            $targetCapaians[] = [
                'tahun'     => $thn,
                'target'    => $t,
                'target_max' => $tc->target_max ?? null,
                'capaian'   => $c,
                'gap'       => $gap,
                'pct_gap'   => $pctGap,
                'status_tl' => $s['status_tl'],
                'warna_tl'  => $s['warna_tl'],
            ];
        }

        // Renaksi program terkait (dari Excel renaksi programs — sumber data aktual)
        $renaksiPrograms = RenaksiProgram::where('indikator_1_id', $indikator->id)
            ->orWhere('indikator_2_id', $indikator->id)
            ->orWhere('indikator_3_id', $indikator->id)
            ->orWhere('indikator_4_id', $indikator->id)
            ->orderBy('tahun')
            ->orderBy('no')
            ->get()
            ->map(fn($r) => [
                'id'           => $r->id,
                'no'           => $r->no,
                'tahun'        => $r->tahun ?? '2025',
                'dinas'        => $r->dinas_text ?? '-',
                'program'      => $r->program ?? '-',
                'rencana_aksi' => $r->rencana_aksi ?? '-',
                'target'       => $this->formatTarget($r),
                'realisasi'    => $this->formatRealisasi($r),
                'status'       => $r->status ?? 'Belum diisi',
                'kendala'      => $r->kendala,
                'catatan'      => $r->catatan,
                'dokumentasi'  => $r->dokumentasi,
            ])
            ->toArray();

        // Renaksi terkait
        $renaksi = $indikator->renaksis->map(fn($r) => [
            'nama_kegiatan' => $r->nama_kegiatan,
            'tahun'         => $r->tahun,
            'status'        => $r->status,
            'keterangan'    => $r->keterangan,
            'opd'           => $r->opd->nama_opd ?? '-',
        ])->values()->toArray();

        return [
            'kode'            => $indikator->kode,
            'nama_indikator'  => $indikator->nama_indikator,
            'pilar'           => $indikator->pilar->nama_pilar ?? '-',
            'opd_list'        => $indikator->opds->pluck('nama_opd')->toArray(),
            'satuan'          => $indikator->satuan,
            'sumber_data'     => $indikator->sumber_data,
            'baseline_2024'   => $indikator->baseline_2024,
            'dokrenda'        => $indikator->dokrenda,
            'kendala'         => $indikator->kendala,
            'inovasi'         => $indikator->inovasi,
            'target_capaians' => $targetCapaians,
            'renaksi'         => $renaksi,
            'renaksi_programs' => $renaksiPrograms,
        ];
    }

    // ─────────────────────────────────────────────────────
    //  RENCANA AKSI
    // ─────────────────────────────────────────────────────
    public function getRencanaAksiList(array $filters = []): array
    {
        $query = \App\Models\Renaksi::with(['indikator.pilar', 'opd']);

        if (!empty($filters['tahun'])) {
            $query->where('tahun', $filters['tahun']);
        }
        if (!empty($filters['status_renaksi'])) {
            $query->where('status', $filters['status_renaksi']);
        }
        if (!empty($filters['pilar_id'])) {
            $query->whereHas('indikator', fn($q) => $q->where('pilar_id', $filters['pilar_id']));
        }
        if ($opdIds = $this->opdIds($filters)) {
            $query->whereIn('opd_id', $opdIds);
        }
        if (!empty($filters['indikator_id'])) {
            $query->where('indikator_id', $filters['indikator_id']);
        }
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('nama_kegiatan', 'like', "%{$search}%")
                  ->orWhere('keterangan', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('tahun', 'desc')
            ->orderBy('id')
            ->get()
            ->map(fn($r, $i) => [
                'no'          => $i + 1,
                'id'          => $r->id,
                'kode'        => $r->indikator->kode ?? '-',
                'indikator'   => $r->indikator->nama_indikator ?? '-',
                'pilar'       => $r->indikator->pilar->nama_pilar ?? '-',
                'pilar_no'    => $r->indikator->pilar->no_pilar ?? 0,
                'rencana_aksi'=> $r->nama_kegiatan,
                'tahun'       => $r->tahun,
                'status'      => $r->status,
                'opd'         => $r->opd->nama_opd ?? '-',
                'kolaborasi'  => $r->kolaborasi_opd,
                'catatan'     => $r->keterangan,
            ])
            ->toArray();
    }

    public function getRencanaAksiSummary(array $filters = []): array
    {
        $query = \App\Models\Renaksi::query();

        if (!empty($filters['tahun'])) {
            $query->where('tahun', $filters['tahun']);
        }
        if (!empty($filters['pilar_id'])) {
            $query->whereHas('indikator', fn($q) => $q->where('pilar_id', $filters['pilar_id']));
        }
        if ($opdIds = $this->opdIds($filters)) {
            $query->whereIn('opd_id', $opdIds);
        }
        if (!empty($filters['indikator_id'])) {
            $query->where('indikator_id', $filters['indikator_id']);
        }

        $total = $query->count();
        $terlaksana = (clone $query)->where('status', 'Terlaksana')->count();

        return [
            'total'           => $total,
            'terlaksana'      => $terlaksana,
            'tidak_terlaksana'=> $total - $terlaksana,
            'persentase'      => $total > 0 ? round(($terlaksana / $total) * 100, 1) : 0,
        ];
    }

    // ─────────────────────────────────────────────────────
    //  RENCANA AKSI PROGRAM (dari Excel)
    // ─────────────────────────────────────────────────────
    public function getRenaksiProgramList(array $filters = []): array
    {
        $query = RenaksiProgram::with([
            'opd',
            'indikator1.pilar', 'indikator2.pilar', 'indikator3.pilar', 'indikator4.pilar',
        ]);

        // Filter by tahun
        if (!empty($filters['tahun'])) {
            $query->where('tahun', $filters['tahun']);
        }
        // Filter by dinas (text from Excel)
        if (!empty($filters['dinas'])) {
            $query->where('dinas_text', $filters['dinas']);
        }
        // Filter by dinas INDUK (nama dinormalisasi — untuk popup dari halaman Rank):
        // cocokkan dinas_text yang persis sama ATAU yang merupakan turunan (induk + ':' / '(')
        if (!empty($filters['dinas_induk'])) {
            $induk = $filters['dinas_induk'];
            $query->where(function ($q) use ($induk) {
                $q->where('dinas_text', $induk)
                  ->orWhere('dinas_text', 'like', $induk . ':%')
                  ->orWhere('dinas_text', 'like', $induk . ' (%');
            });
        }
        // Filter by OPD id (fallback)
        if ($opdIds = $this->opdIds($filters)) {
            $query->whereIn('opd_id', $opdIds);
        }
        if (!empty($filters['indikator_id'])) {
            $indikatorId = $filters['indikator_id'];
            $query->where(function ($q) use ($indikatorId) {
                $q->where('indikator_1_id', $indikatorId)
                  ->orWhere('indikator_2_id', $indikatorId)
                  ->orWhere('indikator_3_id', $indikatorId)
                  ->orWhere('indikator_4_id', $indikatorId);
            });
        }
        if (!empty($filters['pilar_id'])) {
            $pilarId = $filters['pilar_id'];
            $query->where(function ($q) use ($pilarId) {
                foreach (['indikator_1_id', 'indikator_2_id', 'indikator_3_id', 'indikator_4_id'] as $col) {
                    $q->orWhereIn($col, function ($sub) use ($pilarId) {
                        $sub->select('id')->from('indikators')->where('pilar_id', $pilarId);
                    });
                }
            });
        }
        if (!empty($filters['status_renaksi'])) {
            $query->where('status', $filters['status_renaksi']);
        }
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('rencana_aksi', 'like', "%{$search}%")
                  ->orWhere('kode_program', 'like', "%{$search}%")
                  ->orWhere('program', 'like', "%{$search}%")
                  ->orWhere('catatan', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('no')
            ->get()
            ->map(fn($r, $i) => [
                'no'            => $r->no ?? $i + 1,
                'tahun'         => $r->tahun ?? '2025',
                'dinas'         => $r->dinas_text ?? '-',
                'kode_program'  => $r->kode_program ?? '-',
                'program'       => $r->program ?? '-',
                'rencana_aksi'  => $r->rencana_aksi ?? '-',
                'jenis_target'  => $r->jenis_target ?? 'kualitatif',
                'target'        => $this->formatTarget($r),
                'realisasi'     => $this->formatRealisasi($r),
                'kendala'       => $r->kendala,
                'catatan'       => $r->catatan,
                'dokumentasi'   => $r->dokumentasi,
                'indikator'     => $r->indikator_list,
                'pilar'         => $r->pilar_list,
                'status'        => $r->status,
            ])
            ->toArray();
    }

    /**
     * Format tampilan target: kuantitatif -> "120 Orang", kualitatif -> teks lama.
     */
    private function formatTarget($r): string
    {
        if ($r->jenis_target === 'kuantitatif') {
            if ($r->target_nilai === null) {
                return '-';
            }
            $satuan = $r->target_satuan ? ' ' . $this->formatSatuan($r->target_satuan) : '';
            return $this->formatAngka($r->target_nilai) . $satuan;
        }

        return $r->target ?? '-';
    }

    /**
     * Format tampilan realisasi: kuantitatif -> "100 Orang" (satuan ikut target),
     * kualitatif -> teks lama.
     */
    private function formatRealisasi($r): string
    {
        if ($r->jenis_target === 'kuantitatif') {
            if ($r->realisasi_nilai === null) {
                return '-';
            }
            $satuan = $r->target_satuan ? ' ' . $this->formatSatuan($r->target_satuan) : '';
            return $this->formatAngka($r->realisasi_nilai) . $satuan;
        }

        return $r->realisasi ?? '-';
    }

    /**
     * Kapitalisasi satuan: singkatan umum tetap huruf besar (NIB, RT RW, Ha),
     * selainnya kapital di awal kata.
     */
    private function formatSatuan(string $satuan): string
    {
        $kapital = ['nib' => 'NIB', 'rt rw' => 'RT RW', '%' => '%'];
        $lower = strtolower($satuan);

        return $kapital[$lower] ?? ucwords($lower);
    }

    /**
     * Format angka gaya Indonesia: 29176 -> "29.176", 47.17 -> "47,17".
     */
    private function formatAngka($nilai): string
    {
        $n = (float) $nilai;
        // bulat -> tanpa desimal, desimal -> 2 digit koma
        if (floor($n) == $n) {
            return number_format($n, 0, ',', '.');
        }

        return rtrim(rtrim(number_format($n, 2, ',', '.'), '0'), ',');
    }

    public function getRenaksiProgramSummary(array $filters = []): array
    {
        $query = RenaksiProgram::query();

        if (!empty($filters['tahun'])) {
            $query->where('tahun', $filters['tahun']);
        }
        if (!empty($filters['dinas'])) {
            $query->where('dinas_text', $filters['dinas']);
        }
        if ($opdIds = $this->opdIds($filters)) {
            $query->whereIn('opd_id', $opdIds);
        }

        $total = $query->count();
        // Skema status baru: Tercapai / Hampir Tercapai / Tidak Tercapai / Belum diisi
        $tercapai = (clone $query)->where('status', 'Tercapai')->count();
        $hampir = (clone $query)->where('status', 'Hampir Tercapai')->count();
        $tidakTercapai = (clone $query)->where('status', 'Tidak Tercapai')->count();
        $belumDiisi = (clone $query)->where('status', 'Belum diisi')->count();
        $totalDinas = (clone $query)
            ->whereNotNull('dinas_text')
            ->where('dinas_text', '!=', '')
            ->where('dinas_text', '!=', '-')
            ->distinct()
            ->count('dinas_text');

        return [
            'total'           => $total,
            'total_dinas'     => $totalDinas,
            // Key lama dipertahankan untuk kompatibilitas: 'terlaksana' = Tercapai + Hampir Tercapai
            'terlaksana'      => $tercapai + $hampir,
            'tercapai'        => $tercapai,
            'hampir_tercapai' => $hampir,
            'tidak_tercapai'  => $tidakTercapai,
            'belum_diisi'     => $belumDiisi,
            'tidak_terlaksana'=> $tidakTercapai,
            'persentase'      => $total > 0 ? round((($tercapai + $hampir) / $total) * 100, 1) : 0,
        ];
    }

    public function getRenaksiProgramDinas(): array
    {
        $dinas = RenaksiProgram::select('dinas_text')
            ->whereNotNull('dinas_text')
            ->where('dinas_text', '!=', '')
            ->where('dinas_text', '!=', '-')
            ->distinct()
            ->orderBy('dinas_text')
            ->pluck('dinas_text')
            ->toArray();

        return $dinas;
    }

    /**
     * Daftar indikator yang benar-benar dipakai di renaksi_programs
     * (union dari 4 kolom indikator_N_id).
     */
    public function getRenaksiProgramIndikators(): array
    {
        $ids = collect(['indikator_1_id', 'indikator_2_id', 'indikator_3_id', 'indikator_4_id'])
            ->flatMap(fn($col) => RenaksiProgram::whereNotNull($col)->distinct()->pluck($col))
            ->unique()
            ->values();

        return Indikator::whereIn('id', $ids)
            ->select('id', 'kode', 'nama_indikator', 'pilar_id')
            ->orderBy('no_urut')
            ->get()
            ->toArray();
    }

    /**
     * Semua indikator untuk dropdown form admin.
     * Jika $opdId diisi, hanya indikator yang dipegang OPD tsb (untuk admin OPD).
     */
    public function getAllIndikatorOptions(?int $opdId = null): array
    {
        $query = Indikator::select('id', 'kode', 'nama_indikator', 'pilar_id')->orderBy('no_urut');
        if ($opdId !== null) {
            $query->whereHas('opds', fn($q) => $q->where('opds.id', $opdId));
        }

        return $query->get()->toArray();
    }

    // ─────────────────────────────────────────────────────
    //  RANK OPD — berdasarkan pelaksanaan rencana aksi
    //  Diurutkan dari % renaksi Tercapai tertinggi.
    //  Menampilkan total renaksi & jumlah tercapai per OPD.
    // ─────────────────────────────────────────────────────
    public function getRankOpd(array $filters = []): array
    {
        $tahun = $filters['tahun'] ?? '2025';

        // Pelaksanaan renaksi per dinas (tahun tsb)
        $renaksi = RenaksiProgram::query()
            ->where('tahun', $tahun)
            ->select('dinas_text', 'status')
            ->get();

        $agg = []; // namaInduk => ['tercapai'=>n, 'terlaksana'=>n, 'total'=>n]
        foreach ($renaksi as $r) {
            $name = $this->normalizeOpdName($r->dinas_text);
            if ($name === '-' || $name === '') continue;
            if (!isset($agg[$name])) $agg[$name] = ['tercapai' => 0, 'terlaksana' => 0, 'total' => 0];
            $agg[$name]['total']++;
            if ($r->status === 'Tercapai') $agg[$name]['tercapai']++;
            if (in_array($r->status, ['Tercapai', 'Hampir Tercapai'], true)) $agg[$name]['terlaksana']++;
        }

        $rows = [];
        foreach ($agg as $name => $a) {
            $pct = $a['total'] > 0 ? ($a['tercapai'] / $a['total']) * 100 : 0;
            $rows[] = [
                'opd' => $name,
                'renaksi_total' => $a['total'],
                'renaksi_tercapai' => $a['tercapai'],
                'renaksi_terlaksana' => $a['terlaksana'],
                'pct_tercapai' => round($pct, 1),
                'skor' => round($pct, 1),
            ];
        }

        // Urutkan % tercapai tertinggi → jumlah tercapai terbanyak → total terbanyak → nama
        usort($rows, fn($a, $b) =>
            $b['pct_tercapai'] <=> $a['pct_tercapai']
            ?: $b['renaksi_tercapai'] <=> $a['renaksi_tercapai']
            ?: $b['renaksi_total'] <=> $a['renaksi_total']
            ?: strcmp($a['opd'], $b['opd'])
        );
        foreach ($rows as $i => &$row) $row['peringkat'] = $i + 1;
        unset($row);

        return $rows;
    }

    /**
     * Normalisasi nama OPD/dinas ke dinas induk (port dari frontend lib/opd.ts opdInduk).
     * "Dinas X: Bidang Y" → "Dinas X", "Dinas X (Sesuatu)" → "Dinas X".
     */
    private function normalizeOpdName(?string $nama): string
    {
        if (!$nama) return '-';
        $s = trim((string) $nama);
        if ($s === '') return '-';
        if (preg_match('/^(Cabang|TP\s+PKK|UPTD)/i', $s)) return $s;
        $colon = mb_strpos($s, ':');
        if ($colon > 0) $s = mb_substr($s, 0, $colon);
        $paren = mb_strpos($s, '(');
        if ($paren > 0) $s = mb_substr($s, 0, $paren);
        $s = preg_replace('/[\s,;\-–:]+$/u', '', $s);
        $s = trim($s);
        return $s !== '' ? $s : trim((string) $nama);
    }
}
