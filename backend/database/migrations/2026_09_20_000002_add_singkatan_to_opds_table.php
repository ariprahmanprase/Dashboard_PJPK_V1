<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Singkatan resmi OPD (untuk label chart sempit) — sebelumnya hardcode
     * di frontend (OPD_SINGKATAN, lib/opd.ts). Sekarang jadi kolom DB agar
     * bisa dikelola super admin dan OPD baru ikut ter-cover.
     */
    private const SINGKATAN_RESMI = [
        'dinas kepemudaan, olah raga, dan pariwisata' => 'Disporapar',
        'dinas kesehatan' => 'Dinkes',
        'dinas koperasi dan umkm' => 'Dinkopum',
        'dinas lingkungan hidup dan kehutanan' => 'DLHK',
        'dinas pangan dan pertanian' => 'DPP',
        'dinas pekerjaan umum dan bina marga' => 'DPUBM',
        'dinas pemberdayaan masyarakat dan desa' => 'DPMD',
        'dinas pemberdayaan perempuan, perlindungan anak dan keluarga berencana' => 'DP3AKB',
        'dinas penanaman modal dan pelayanan terpadu satu pintu' => 'DPMPTSP',
        'dinas pendidikan' => 'Dispendik',
        'dinas perhubungan' => 'Dishub',
        'dinas perikanan' => 'Diskan',
        'dinas perindustrian dan perdagangan' => 'Disperindag',
        'dinas perumahan permukiman cipta karya dan tata ruang' => 'DPPR',
        'dinas sosial' => 'Dinsos',
        'dinas tenaga kerja' => 'Disnaker',
    ];

    public function up(): void
    {
        Schema::table('opds', function (Blueprint $table) {
            $table->string('singkatan', 30)->nullable()->after('kode_opd');
            // kode_opd kini opsional (form tambah OPD boleh mengosongkannya)
            $table->string('kode_opd', 100)->nullable()->change();
        });

        // Backfill: nama induk (tanpa bidang dalam kurung/setelah ":") dicocokkan ke peta resmi
        foreach (DB::table('opds')->get(['id', 'nama_opd']) as $o) {
            $induk = $this->namaInduk($o->nama_opd);
            $singkatan = self::SINGKATAN_RESMI[strtolower($induk)] ?? null;
            if ($singkatan !== null) {
                DB::table('opds')->where('id', $o->id)->update(['singkatan' => $singkatan]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('opds', function (Blueprint $table) {
            $table->dropColumn('singkatan');
        });
    }

    /** Cermin opdInduk() di frontend: potong embel-embel bidang. */
    private function namaInduk(string $nama): string
    {
        $s = trim($nama);
        if (preg_match('/^(Cabang|TP\s+PKK|UPTD)/i', $s)) {
            return $s;
        }
        $colon = strpos($s, ':');
        if ($colon > 0) {
            $s = substr($s, 0, $colon);
        }
        $paren = strpos($s, '(');
        if ($paren > 0) {
            $s = substr($s, 0, $paren);
        }
        $s = preg_replace('/[\s,;\-–:]+$/', '', $s);
        return trim($s) !== '' ? trim($s) : trim($nama);
    }
};
