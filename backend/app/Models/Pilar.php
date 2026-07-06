<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pilar extends Model
{
    protected $fillable = ['no_pilar', 'nama_pilar'];

    public function indikators()
    {
        return $this->hasMany(Indikator::class);
    }
}
