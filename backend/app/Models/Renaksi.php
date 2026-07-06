<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Renaksi extends Model
{
    protected $fillable = [
        'indikator_id', 'tahun', 'opd_id',
        'nama_kegiatan', 'status', 'keterangan', 'kolaborasi_opd',
    ];

    public function indikator()
    {
        return $this->belongsTo(Indikator::class);
    }

    public function opd()
    {
        return $this->belongsTo(Opd::class);
    }
}
