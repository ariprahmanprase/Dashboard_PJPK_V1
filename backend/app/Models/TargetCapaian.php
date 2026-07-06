<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TargetCapaian extends Model
{
    protected $fillable = [
        'indikator_id', 'tahun', 'target', 'capaian',
        'gap', 'pct_gap', 'status_tl', 'warna_tl', 'keterangan',
    ];

    public function indikator()
    {
        return $this->belongsTo(Indikator::class);
    }
}
