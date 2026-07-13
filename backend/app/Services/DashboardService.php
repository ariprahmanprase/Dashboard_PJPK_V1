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
        if ($capaian === null || $target === null) {
            return ['status_tl' => 'Belum Diisi', 'warna_tl' => 'Abu'];
        }

        if ($target == 0) {
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
     * Update semua target_capaians di DB dengan formula baru
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
    public function getScorecards(array $filters = []): array
    {
        // Default to tahun 2025 if not specified
        $tahun = $filters['tahun'] ?? '2025';

        $indikatorQuery = $this->applyFilters(Indikator::query(), $filters);
        $opdQuery = $this->applyFiltersToOpd($filters);

        // Total Indikator
        $totalIndikator = $indikatorQuery->count();

        // Total OPD (unique OPDs that have indikators matching filter)
        $totalOpd = $opdQuery->distinct('opds.id')->count();

        // On Track, Warning, Alert, Belum Diisi based on specified tahun
        $byStatus = TargetCapaian::whereIn('indikator_id', $indikatorQuery->pluck('id'))
            ->when($tahun, fn($q) => $q->where('tahun', $tahun))
            ->selectRaw('status_tl, COUNT(*) as count')
            ->groupBy('status_tl')
            ->pluck('count', 'status_tl');

        $onTrack = $byStatus['On Track'] ?? 0;
        $warning = $byStatus['Warning'] ?? 0;
        $alert = $byStatus['Alert'] ?? 0;
        $belumDiisi = $byStatus['Belum Diisi'] ?? 0;

        // Target Belum Diinput (target is null)
        $targetBelum = TargetCapaian::whereIn('indikator_id', $indikatorQuery->pluck('id'))
            ->when($tahun, fn($q) => $q->where('tahun', $tahun))
            ->whereNull('target')
            ->count();

        // Capaian Belum Diinput (capaian is null)
        $capaianBelum = TargetCapaian::whereIn('indikator_id', $indikatorQuery->pluck('id'))
            ->when($tahun, fn($q) => $q->where('tahun', $tahun))
            ->whereNull('capaian')
            ->count();

        return [
            'total_indikator' => $totalIndikator,
            'total_opd' => $totalOpd,
            'on_track' => $onTrack,
            'warning' => $warning,
            'alert' => $alert,
            'target_belum_diinput' => $targetBelum,
            'capaian_belum_diinput' => $capaianBelum,
        ];
    }

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
            // Gap = capaian - target
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

    public function getChartData(array $filters = []): array
    {
        $indikatorQuery = $this->applyFilters(Indikator::query(), $filters);

        $query = TargetCapaian::whereIn('indikator_id', $indikatorQuery->pluck('id'));

        // Apply status_tl filter directly on TargetCapaian
        if (!empty($filters['status_tl'])) {
            $query->where('status_tl', $filters['status_tl']);
        }

        return $query
            ->selectRaw('tahun, ROUND(AVG(target), 2) as avg_target, ROUND(AVG(capaian), 2) as avg_capaian, COUNT(*) as count')
            ->groupBy('tahun')
            ->orderBy('tahun')
            ->get()
            ->toArray();
    }

    public function getRenaksiPieData(array $filters = []): array
    {
        $indikatorQuery = $this->applyFilters(Indikator::query(), $filters);
        $totalIndikator = $indikatorQuery->count();
        $indikatorIds = $indikatorQuery->pluck('id');

        // Count indikators that have at least one renaksi
        $indikatorDenganRenaksi = \App\Models\Renaksi::whereIn('indikator_id', $indikatorIds)
            ->distinct('indikator_id')
            ->count('indikator_id');

        // Count renaksi by status
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

        // Optional: filter by renaksi status
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

    public function getPerPilar(array $filters = []): array
    {
        $tahun = $filters['tahun'] ?? '2025';
        $indikatorQuery = $this->applyFilters(Indikator::query(), $filters);
        $indikatorIds = $indikatorQuery->pluck('id');

        $rows = \Illuminate\Support\Facades\DB::table('target_capaians')
            ->join('indikators', 'target_capaians.indikator_id', '=', 'indikators.id')
            ->join('pilars', 'indikators.pilar_id', '=', 'pilars.id')
            ->whereIn('target_capaians.indikator_id', $indikatorIds)
            ->where('target_capaians.tahun', $tahun)
            ->selectRaw("pilars.nama_pilar as pilar, target_capaians.status_tl, COUNT(*) as count")
            ->groupBy('pilars.nama_pilar', 'target_capaians.status_tl')
            ->orderBy('pilars.no_pilar')
            ->get();

        $grouped = [];
        foreach ($rows as $r) {
            $grouped[$r->pilar] ??= ['pilar' => $r->pilar, 'on_track' => 0, 'warning' => 0, 'alert' => 0, 'belum_diisi' => 0];
            $key = match ($r->status_tl) {
                'On Track' => 'on_track',
                'Warning' => 'warning',
                'Alert' => 'alert',
                default => 'belum_diisi',
            };
            $grouped[$r->pilar][$key] = $r->count;
        }

        return array_values($grouped);
    }

    public function getPerOpd(array $filters = []): array
    {
        $tahun = $filters['tahun'] ?? '2025';
        $indikatorQuery = $this->applyFilters(Indikator::query(), $filters);
        $indikatorIds = $indikatorQuery->pluck('id');

        $rows = \Illuminate\Support\Facades\DB::table('target_capaians')
            ->join('indikators', 'target_capaians.indikator_id', '=', 'indikators.id')
            ->join('opds', 'indikators.opd_id', '=', 'opds.id')
            ->whereIn('target_capaians.indikator_id', $indikatorIds)
            ->where('target_capaians.tahun', $tahun)
            ->selectRaw("opds.nama_opd as opd, target_capaians.status_tl, COUNT(*) as count")
            ->groupBy('opds.nama_opd', 'target_capaians.status_tl')
            ->orderBy('opds.nama_opd')
            ->get();

        $grouped = [];
        foreach ($rows as $r) {
            $grouped[$r->opd] ??= ['opd' => $r->opd, 'on_track' => 0, 'warning' => 0, 'alert' => 0, 'belum_diisi' => 0];
            $key = match ($r->status_tl) {
                'On Track' => 'on_track',
                'Warning' => 'warning',
                'Alert' => 'alert',
                default => 'belum_diisi',
            };
            $grouped[$r->opd][$key] = $r->count;
        }

        return array_values($grouped);
    }

    public function getHeatmap(array $filters = []): array
    {
        $indikatorQuery = $this->applyFilters(Indikator::query()->with('pilar'), $filters);
        $indikators = $indikatorQuery->orderBy('kode')->get();

        $allData = \Illuminate\Support\Facades\DB::table('target_capaians')
            ->whereIn('indikator_id', $indikators->pluck('id'))
            ->select('indikator_id', 'tahun', 'status_tl', 'warna_tl', 'target', 'capaian')
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
                $row['status_' . $thn] = $match->status_tl ?? 'Belum Diisi';
                $row['warna_' . $thn] = $match->warna_tl ?? 'Abu';
                // Tambah target, capaian, gap per tahun untuk tooltip
                $row['target_' . $thn] = $match->target ?? null;
                $row['capaian_' . $thn] = $match->capaian ?? null;
                $target = $match->target ?? null;
                $capaian = $match->capaian ?? null;
                $row['gap_' . $thn] = ($capaian !== null && $target !== null) ? round($capaian - $target, 4) : null;
            }
            return $row;
        })->toArray();
    }

    public function getChartPerPilar(array $filters = []): array
    {
        $indikatorQuery = $this->applyFilters(Indikator::query(), $filters);
        $indikators = $indikatorQuery->with('pilar')->get();

        $tcQuery = TargetCapaian::whereIn('indikator_id', $indikators->pluck('id'));
        if (!empty($filters['status_tl'])) {
            $tcQuery->where('status_tl', $filters['status_tl']);
        }

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
            // Filter indicators by their target_capaian status for a given tahun
            $tahun = $filters['tahun'] ?? null;
            $query->whereHas('targetCapaians', function ($q) use ($filters, $tahun) {
                $q->where('status_tl', $filters['status_tl']);
                if ($tahun) $q->where('tahun', $tahun);
            });
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
                    $tahun = $filters['tahun'] ?? 2025;
                    $q->whereHas('targetCapaians', fn($tc) => $tc->where('status_tl', $filters['status_tl'])->where('tahun', $tahun));
                }
            });
        }
        return $query;
    }

    public function getRencanaAksiList(array $filters = []): array
    {
        $tahun = $filters['tahun'] ?? '2025';

        $query = \App\Models\Renaksi::with(['indikator.pilar', 'opd']);

        // Filter by tahun
        if (!empty($filters['tahun'])) {
            $query->where('tahun', $filters['tahun']);
        }

        // Filter by status renaksi
        if (!empty($filters['status_renaksi'])) {
            $query->where('status', $filters['status_renaksi']);
        }

        // Filter by pilar
        if (!empty($filters['pilar_id'])) {
            $query->whereHas('indikator', fn($q) => $q->where('pilar_id', $filters['pilar_id']));
        }

        // Filter by OPD
        if (!empty($filters['opd_id'])) {
            $query->where('opd_id', $filters['opd_id']);
        }

        // Filter by indikator
        if (!empty($filters['indikator_id'])) {
            $query->where('indikator_id', $filters['indikator_id']);
        }

        // Search by nama_kegiatan
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
