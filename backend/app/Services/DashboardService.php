<?php

namespace App\Services;

use App\Models\Indikator;
use App\Models\Opd;
use App\Models\TargetCapaian;
use Illuminate\Database\Eloquent\Builder;

class DashboardService
{
    /**
     * Hitung status_tl seragam: HIJAU ≥ Target, KUNING ≥ 90% Target, MERAH < 90% Target
     */
    private function calcStatusTL($target, $capaian): array
    {
        if ($capaian === null || $target === null || $target == 0) {
            return ['status_tl' => 'Belum Diisi', 'warna_tl' => 'Abu'];
        }

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
        $ids = $indikatorQuery->pluck('id');

        $tcs = TargetCapaian::whereIn('indikator_id', $ids)
            ->where('tahun', $tahun)
            ->select('indikator_id', 'target', 'capaian')
            ->get();

        return $tcs->filter(function ($tc) use ($statusTl) {
            $s = $this->calcStatusTL($tc->target, $tc->capaian);
            return $s['status_tl'] === $statusTl;
        })->pluck('indikator_id')->unique()->values()->toArray();
    }

    /**
     * Update semua target_capaians di DB (untuk backward compatibility)
     */
    public function recalculateAllStatus(): int
    {
        $updated = 0;
        $rows = TargetCapaian::all();

        foreach ($rows as $tc) {
            $new = $this->calcStatusTL($tc->target, $tc->capaian);
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
        $rows = TargetCapaian::whereIn('indikator_id', $indikatorQuery->pluck('id'))
            ->where('tahun', $tahun)
            ->select('target', 'capaian')
            ->get();

        $onTrack = 0;
        $warning = 0;
        $alert = 0;
        $belumDiisi = 0;
        $capaianBelum = 0;

        foreach ($rows as $tc) {
            if ($tc->capaian === null) {
                $capaianBelum++;
            }
            $s = $this->calcStatusTL($tc->target, $tc->capaian);
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
        $indikatorQuery = $this->applyFilters(Indikator::query()->with(['pilar', 'opd']), $filters);

        $results = $indikatorQuery->orderBy('kode')->get();

        return $results->map(function ($indikator) use ($tahun) {
            $tc = $indikator->targetCapaians()
                ->when($tahun, fn($q) => $q->where('tahun', $tahun))
                ->orderBy('tahun', 'desc')
                ->first();

            $target = $tc->target ?? null;
            $capaian = $tc->capaian ?? null;
            $status = $this->calcStatusTL($target, $capaian);
            $gap = ($capaian !== null && $target !== null) ? round($capaian - $target, 6) : null;

            return [
                'kode' => $indikator->kode,
                'nama_indikator' => $indikator->nama_indikator,
                'nama_opd' => $indikator->opd->nama_opd ?? '-',
                'nama_pilar' => $indikator->pilar->nama_pilar ?? '-',
                'status_tl' => $status['status_tl'],
                'warna_tl' => $status['warna_tl'],
                'target' => $target,
                'capaian' => $capaian,
                'gap' => $gap,
                'pct_gap' => ($gap !== null && $target != 0) ? round($gap / $target, 6) : null,
                'satuan' => $indikator->satuan,
                'tahun' => $tc->tahun ?? null,
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
    //  PIE RENAKSI
    // ─────────────────────────────────────────────────────
    public function getRenaksiPieData(array $filters = []): array
    {
        $indikatorQuery = $this->applyFilters(Indikator::query(), $filters);
        $totalIndikator = $indikatorQuery->count();
        $indikatorIds = $indikatorQuery->pluck('id');

        $indikatorDenganRenaksi = \App\Models\Renaksi::whereIn('indikator_id', $indikatorIds)
            ->distinct('indikator_id')
            ->count('indikator_id');

        $byStatus = \App\Models\Renaksi::whereIn('indikator_id', $indikatorIds)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return [
            'terlaksana' => $byStatus['Terlaksana'] ?? 0,
            'tidak_terlaksana' => $byStatus['Tidak Terlaksana'] ?? 0,
            'belum_input' => $totalIndikator - $indikatorDenganRenaksi,
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
            ->select('indikator_id', 'target', 'capaian')
            ->get()
            ->keyBy('indikator_id');

        $grouped = [];
        foreach ($indikators as $ind) {
            $pilar = $ind->pilar->nama_pilar ?? '-';
            $noPilar = $ind->pilar->no_pilar ?? 0;
            $tc = $tcs->get($ind->id);

            $s = $this->calcStatusTL($tc->target ?? null, $tc->capaian ?? null);

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
        $indikatorQuery = $this->applyFilters(Indikator::query()->with('opd'), $filters);
        $indikators = $indikatorQuery->get();

        $tcs = TargetCapaian::whereIn('indikator_id', $indikators->pluck('id'))
            ->where('tahun', $tahun)
            ->select('indikator_id', 'target', 'capaian')
            ->get()
            ->keyBy('indikator_id');

        $grouped = [];
        foreach ($indikators as $ind) {
            $opd = $ind->opd->nama_opd ?? '-';
            $tc = $tcs->get($ind->id);

            $s = $this->calcStatusTL($tc->target ?? null, $tc->capaian ?? null);

            if (!isset($grouped[$opd])) {
                $grouped[$opd] = ['opd' => $opd, 'on_track' => 0, 'warning' => 0, 'alert' => 0, 'belum_diisi' => 0];
            }
            $key = match ($s['status_tl']) {
                'On Track' => 'on_track',
                'Warning' => 'warning',
                'Alert' => 'alert',
                default => 'belum_diisi',
            };
            $grouped[$opd][$key]++;
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
            ->select('indikator_id', 'tahun', 'target', 'capaian')
            ->get()
            ->groupBy('indikator_id');

        return $indikators->map(function ($ind) use ($allData) {
            $row = [
                'kode' => $ind->kode,
                'nama_indikator' => $ind->nama_indikator,
                'pilar' => $ind->pilar->nama_pilar ?? '-',
            ];
            $tc = $allData->get($ind->id, collect());
            foreach (['2025', '2026', '2027', '2028', '2029'] as $thn) {
                $match = $tc->firstWhere('tahun', $thn);
                $target = $match->target ?? null;
                $capaian = $match->capaian ?? null;
                $s = $this->calcStatusTL($target, $capaian);
                $row['status_' . $thn] = $s['status_tl'];
                $row['warna_' . $thn] = $s['warna_tl'];
                $row['target_' . $thn] = $target;
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
    //  FILTERS
    // ─────────────────────────────────────────────────────
    private function applyFilters(Builder $query, array $filters): Builder
    {
        if (!empty($filters['opd_id'])) {
            $query->where('opd_id', $filters['opd_id']);
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
        if (!empty($filters['opd_id'])) {
            $query->where('id', $filters['opd_id']);
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
        if (!empty($filters['opd_id'])) {
            $query->where('opd_id', $filters['opd_id']);
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
        if (!empty($filters['opd_id'])) {
            $query->where('opd_id', $filters['opd_id']);
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
}
