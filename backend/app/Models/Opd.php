<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Opd extends Model
{
    protected $fillable = ['kode_opd', 'nama_opd'];

    public function indikators()
    {
        return $this->hasMany(Indikator::class);
    }

    public function renaksis()
    {
        return $this->hasMany(Renaksi::class);
    }
}
