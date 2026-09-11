<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        // Cabut token lama agar satu akun satu sesi aktif
        $user->tokens()->delete();
        $token = $user->createToken('admin-panel')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil keluar.']);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $this->userPayload($request->user())]);
    }

    /**
     * Update profil diri sendiri (semua role).
     * Role & opd_id sengaja tidak diterima — hak akses hanya bisa diubah super admin.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'current_password' => ['nullable', 'required_with:new_password', 'string'],
            'new_password' => ['nullable', 'string', 'min:6'],
        ]);

        // Ganti password hanya bila password saat ini benar
        if (!empty($validated['new_password'])) {
            if (!Hash::check($validated['current_password'] ?? '', $user->password)) {
                return response()->json([
                    'message' => 'Password saat ini salah.',
                    'errors' => ['current_password' => ['Password saat ini salah.']],
                ], 422);
            }
            $user->password = $validated['new_password'];
        }

        $user->name = $validated['name'];
        $user->jabatan = $validated['jabatan'] ?? null;
        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => $this->userPayload($user->load('opd')),
        ]);
    }

    /**
     * Upload / ganti foto profil (avatar). Semua role.
     * Frontend sudah mem-crop ke 1:1, tapi backend tetap memvalidasi
     * tipe, ukuran, dan rasio sebagai lapis terakhir.
     */
    public function updateAvatar(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096', 'dimensions:ratio=1/1'],
        ], [
            'avatar.required' => 'Foto belum dipilih.',
            'avatar.image' => 'File harus berupa gambar.',
            'avatar.mimes' => 'Format foto harus JPG, JPEG, PNG, atau WEBP.',
            'avatar.max' => 'Ukuran foto tidak boleh lebih dari 4 MB.',
            'avatar.dimensions' => 'Foto harus berbentuk persegi (rasio 1:1).',
        ]);

        $file = $validated['avatar'];
        $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $filename = 'avatars/'.$user->id.'-'.time().'.'.$ext;

        // Hapus avatar lama agar tidak menumpuk
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        Storage::disk('public')->put($filename, file_get_contents($file->getRealPath()));

        $user->avatar = $filename;
        $user->save();

        return response()->json([
            'message' => 'Foto profil berhasil diperbarui.',
            'user' => $this->userPayload($user->load('opd')),
        ]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'jabatan' => $user->jabatan,
            'opd_id' => $user->opd_id,
            'opd_nama' => $user->opd?->nama_opd,
            'bidang' => $user->bidang,
            'avatar_url' => $user->avatar ? asset('storage/'.$user->avatar) : null,
        ];
    }
}
