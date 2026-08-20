<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RenaksiProgram extends Model
{
    use HasFactory;

    protected $table = 'renaksi_programs';

    protected $fillable = [
        'no',
        'tahun',
        'dinas_text',
        'opd_id',
        'kode_program',
        'program',
        'rencana_aksi',
        'target',
        'realisasi',
        'jenis_target',
        'target_nilai',
        'target_satuan',
        'realisasi_nilai',
        'kendala',
        'catatan',
        'indikator_1_id',
        'indikator_2_id',
        'indikator_3_id',
        'indikator_4_id',
        'status',
    ];

    public function opd()
    {
        return $this->belongsTo(Opd::class, 'opd_id');
    }

    public function indikator1()
    {
        return $this->belongsTo(Indikator::class, 'indikator_1_id');
    }

    public function indikator2()
    {
        return $this->belongsTo(Indikator::class, 'indikator_2_id');
    }

    public function indikator3()
    {
        return $this->belongsTo(Indikator::class, 'indikator_3_id');
    }

    public function indikator4()
    {
        return $this->belongsTo(Indikator::class, 'indikator_4_id');
    }

    public function getIndikatorListAttribute()
    {
        $indikators = [];
        if ($this->indikator1) $indikators[] = $this->indikator1->nama_indikator;
        if ($this->indikator2) $indikators[] = $this->indikator2->nama_indikator;
        if ($this->indikator3) $indikators[] = $this->indikator3->nama_indikator;
        if ($this->indikator4) $indikators[] = $this->indikator4->nama_indikator;
        return $indikators;
    }

    public function getIndikatorIdListAttribute()
    {
        return collect([
            $this->indikator_1_id,
            $this->indikator_2_id,
            $this->indikator_3_id,
            $this->indikator_4_id,
        ])->filter()->values()->all();
    }
}
