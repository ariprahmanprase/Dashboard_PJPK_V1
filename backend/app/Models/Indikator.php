<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Indikator extends Model
{
    protected $fillable = [
        'kode', 'no_urut', 'pilar_id', 'opd_id',
        'nama_indikator', 'satuan', 'lower_better',
    ];

    public function pilar()
    {
        return $this->belongsTo(Pilar::class);
    }

    public function opd()
    {
        return $this->belongsTo(Opd::class);
    }

    public function targetCapaians()
    {
        return $this->hasMany(TargetCapaian::class);
    }

    public function renaksis()
    {
        return $this->hasMany(Renaksi::class);
    }

    public function latestTargetCapaian($tahun = null)
    {
        $query = $this->hasMany(TargetCapaian::class);
        if ($tahun) $query->where('tahun', $tahun);
        return $query->orderBy('tahun', 'desc');
    }
}
