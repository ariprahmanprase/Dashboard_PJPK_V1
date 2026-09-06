<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiAnalysis extends Model
{
    protected $fillable = [
        'prompt_kode', 'indikator_id', 'opd_id', 'tahun',
        'hasil', 'model', 'created_by',
    ];

    public function indikator()
    {
        return $this->belongsTo(Indikator::class);
    }

    public function opd()
    {
        return $this->belongsTo(Opd::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
