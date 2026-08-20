<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Opd;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    /**
     * List user untuk panel admin (khusus super admin).
     */
    public function index(Request $request)
    {
        $query = User::with('opd')->orderBy('role')->orderBy('name');

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }
        if ($request->filled('opd_id')) {
            $query->where('opd_id', $request->integer('opd_id'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $items = $query->get()->map(fn($u) => $this->serialize($u));

        return response()->json(['data' => $items]);
    }

    /**
     * Daftar OPD untuk dropdown form/filter user.
     * Hanya OPD yang punya renaksi + OPD yang sudah dipakai user (hindari 40 OPD tidak relevan).
     */
    public function opdOptions()
    {
        $opdIds = \App\Models\RenaksiProgram::whereNotNull('opd_id')->distinct()->pluck('opd_id')
            ->merge(User::whereNotNull('opd_id')->distinct()->pluck('opd_id'))
            ->unique();

        $opds = Opd::whereIn('id', $opdIds)->orderBy('nama_opd')->get(['id', 'nama_opd']);

        return response()->json(['data' => $opds]);
    }

    /**
     * Buat user baru.
     */
    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        if ($validated['role'] === User::ROLE_SUPER_ADMIN) {
            $validated['opd_id'] = null;
        }

        $user = User::create($validated);

        return response()->json([
            'message' => 'User berhasil dibuat.',
            'data' => $this->serialize($user->load('opd')),
        ], 201);
    }

    /**
     * Update user.
     */
    public function update(Request $request, User $user)
    {
        $validated = $this->validatePayload($request, $user);

        if ($validated['role'] === User::ROLE_SUPER_ADMIN) {
            $validated['opd_id'] = null;
        }

        // Mencegah super admin menurunkan/menghapus hak akunnya sendiri
        if ($user->id === $request->user()->id && $validated['role'] !== User::ROLE_SUPER_ADMIN) {
            return response()->json(['message' => 'Anda tidak bisa mengubah role akun sendiri.'], 422);
        }

        // Password opsional saat edit
        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'User berhasil diperbarui.',
            'data' => $this->serialize($user->load('opd')),
        ]);
    }

    /**
     * Hapus user.
     */
    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Anda tidak bisa menghapus akun sendiri.'], 422);
        }

        // Cabut semua token sesi user yang dihapus
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User berhasil dihapus.']);
    }

    private function validatePayload(Request $request, ?User $user = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user?->id),
            ],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:6'],
            'role' => ['required', Rule::in([User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN_OPD])],
            'opd_id' => [
                Rule::requiredIf($request->input('role') === User::ROLE_ADMIN_OPD),
                'nullable', 'integer', 'exists:opds,id',
            ],
        ]);
    }

    private function serialize(User $u): array
    {
        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role,
            'opd_id' => $u->opd_id,
            'opd_nama' => $u->opd?->nama_opd,
            'created_at' => $u->created_at?->format('Y-m-d H:i'),
        ];
    }
}
