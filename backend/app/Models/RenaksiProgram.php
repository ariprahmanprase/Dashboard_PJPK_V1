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
        'dokumentasi',
        'created_by',
        'status',
        'ai_recommendation',
    ];

    public function opd()
    {
        return $this->belongsTo(Opd::class, 'opd_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Tautan indikator (many-to-many via indikator_renaksi_program) —
     * jumlah tidak dibatasi (sebelumnya maks. 4 via kolom indikator_1_id..4_id).
     */
    public function indikators()
    {
        return $this->belongsToMany(Indikator::class, 'indikator_renaksi_program')
            ->withTimestamps()
            ->orderBy('indikators.id');
    }

    public function getIndikatorListAttribute()
    {
        return $this->indikators->pluck('nama_indikator')->all();
    }

    public function getPilarListAttribute()
    {
        // Pilar terkait mengikuti pilar dari indikator yang ditautkan (unik)
        $pilars = [];
        foreach ($this->indikators as $indikator) {
            if ($indikator->pilar) {
                // nama_pilar sudah berbentuk "Pilar 1: Pengendalian Kuantitas Penduduk"
                $label = $indikator->pilar->nama_pilar;
                if (!in_array($label, $pilars, true)) {
                    $pilars[] = $label;
                }
            }
        }
        return $pilars;
    }

    public function getIndikatorIdListAttribute()
    {
        return $this->indikators->pluck('id')->all();
    }
}
