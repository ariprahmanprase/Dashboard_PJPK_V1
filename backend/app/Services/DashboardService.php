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
     * Hitung status_tl seragam: HIJAU ≥ Target, KUNING ≥ 90% Target, MERAH < 90% Target
     */
    public function calcStatusTL($target, $capaian): array
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
        $indikatorQuery = $this->applyFilters(Indikator::query()->with(['pilar', 'opds']), $filters);

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
                'kode'            => $indikator->kode,
                'nama_indikator'  => $indikator->nama_indikator,
                'nama_opd'        => $indikator->nama_opd,           // accessor: join dari pivot
                'opd_list'        => $indikator->opds->pluck('nama_opd')->toArray(),
                'pilar_id'        => $indikator->pilar_id,
                'opd_ids'         => $indikator->opds->pluck('id')->toArray(),
                'nama_pilar'      => $indikator->pilar->nama_pilar ?? '-',
                'status_tl'       => $status['status_tl'],
                'warna_tl'        => $status['warna_tl'],
                'target'          => $target,
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
        $indikatorQuery = $this->applyFilters(Indikator::query()->with('opds'), $filters);
        $indikators = $indikatorQuery->get();

        $tcs = TargetCapaian::whereIn('indikator_id', $indikators->pluck('id'))
            ->where('tahun', $tahun)
            ->select('indikator_id', 'target', 'capaian')
            ->get()
            ->keyBy('indikator_id');

        $grouped = [];
        foreach ($indikators as $ind) {
            $tc = $tcs->get($ind->id);
            $s = $this->calcStatusTL($tc->target ?? null, $tc->capaian ?? null);

            foreach ($ind->opds as $opd) {
                $opdName = $opd->nama_opd;
                if (!isset($grouped[$opdName])) {
                    $grouped[$opdName] = ['opd' => $opdName, 'on_track' => 0, 'warning' => 0, 'alert' => 0, 'belum_diisi' => 0];
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
            $query->whereHas('opds', function ($q) use ($filters) {
                $q->where('opds.id', $filters['opd_id']);
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
            $s = $this->calcStatusTL($t, $c);
            $gap = ($c !== null && $t !== null) ? round($c - $t, 6) : null;
            $pctGap = ($gap !== null && $t != 0) ? round($gap / $t, 6) : null;

            $targetCapaians[] = [
                'tahun'     => $thn,
                'target'    => $t,
                'capaian'   => $c,
                'gap'       => $gap,
                'pct_gap'   => $pctGap,
                'status_tl' => $s['status_tl'],
                'warna_tl'  => $s['warna_tl'],
            ];
        }

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

    // ─────────────────────────────────────────────────────
    //  RENCANA AKSI PROGRAM (dari Excel)
    // ─────────────────────────────────────────────────────
    public function getRenaksiProgramList(array $filters = []): array
    {
        $query = RenaksiProgram::with(['opd', 'indikator1', 'indikator2', 'indikator3', 'indikator4']);

        // Filter by tahun
        if (!empty($filters['tahun'])) {
            $query->where('tahun', $filters['tahun']);
        }
        // Filter by dinas (text from Excel)
        if (!empty($filters['dinas'])) {
            $query->where('dinas_text', $filters['dinas']);
        }
        // Filter by OPD id (fallback)
        if (!empty($filters['opd_id'])) {
            $query->where('opd_id', $filters['opd_id']);
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
                'rencana_aksi'  => $r->rencana_aksi ?? '-',
                'jenis_target'  => $r->jenis_target ?? 'kualitatif',
                'target'        => $this->formatTarget($r),
                'realisasi'     => $this->formatRealisasi($r),
                'kendala'       => $r->kendala,
                'catatan'       => $r->catatan,
                'indikator'     => $r->indikator_list,
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
        if (!empty($filters['opd_id'])) {
            $query->where('opd_id', $filters['opd_id']);
        }

        $total = $query->count();
        $terlaksana = (clone $query)->where('status', 'Terlaksana')->count();
        $tidakTerlaksana = (clone $query)->where('status', 'Tidak Terlaksana')->count();
        $totalDinas = (clone $query)
            ->whereNotNull('dinas_text')
            ->where('dinas_text', '!=', '')
            ->where('dinas_text', '!=', '-')
            ->distinct()
            ->count('dinas_text');

        return [
            'total'           => $total,
            'total_dinas'     => $totalDinas,
            'terlaksana'      => $terlaksana,
            'tidak_terlaksana'=> $tidakTerlaksana,
            'persentase'      => $total > 0 ? round(($terlaksana / $total) * 100, 1) : 0,
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
            ->select('id', 'kode', 'nama_indikator')
            ->orderBy('no_urut')
            ->get()
            ->toArray();
    }
}
