<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Indikator extends Model
{
    // Route model binding memakai kode (P-01 s.d. P-30) bukan id numerik
    public function getRouteKeyName(): string
    {
        return 'kode';
    }

    protected $fillable = [
        'kode', 'no_urut', 'pilar_id', 'opd_id',
        'nama_indikator', 'satuan', 'arah_target',
        'sumber_data', 'baseline_2024', 'dokrenda', 'kendala', 'inovasi',
    ];

    public function pilar()
    {
        return $this->belongsTo(Pilar::class);
    }

    public function opds()
    {
        return $this->belongsToMany(Opd::class, 'indikator_opd');
    }

    /**
     * Accessor: nama_opd sebagai comma-separated dari pivot.
     * Dipakai buat backward compatibility di getTableData dll.
     */
    public function getNamaOpdAttribute(): string
    {
        if ($this->relationLoaded('opds')) {
            return $this->opds->pluck('nama_opd')->join(', ');
        }
        // fallback: single opd_id kalau opds belum diload
        if ($this->opd_id && $opd = Opd::find($this->opd_id)) {
            return $opd->nama_opd;
        }
        return '-';
    }

    public function targetCapaians()
    {
        return $this->hasMany(TargetCapaian::class);
    }

    public function renaksis()
    {
        return $this->hasMany(Renaksi::class);
    }

    /**
     * Renaksi program yang tertaut ke indikator ini (many-to-many via
     * indikator_renaksi_program) — jumlah tidak dibatasi.
     */
    public function renaksiPrograms()
    {
        return $this->belongsToMany(RenaksiProgram::class, 'indikator_renaksi_program')
            ->withTimestamps()
            ->orderBy('renaksi_programs.no');
    }

    public function latestTargetCapaian($tahun = null)
    {
        $query = $this->hasMany(TargetCapaian::class);
        if ($tahun) $query->where('tahun', $tahun);
        return $query->orderBy('tahun', 'desc');
    }
}
