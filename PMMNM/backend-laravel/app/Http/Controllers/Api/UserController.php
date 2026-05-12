<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function getProfile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'fullName' => $user->full_name,
            'phone' => $user->phone,
            'role' => $user->role,
            'isActive' => $user->is_active,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'fullName' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
        ]);

        $user->update([
            'full_name' => $validated['fullName'] ?? $user->full_name,
            'phone' => $validated['phone'] ?? $user->phone,
        ]);

        return response()->json([
            'message' => 'Cập nhật hồ sơ thành công',
            'data' => [
                'id' => $user->id,
                'email' => $user->email,
                'fullName' => $user->full_name,
                'phone' => $user->phone,
                'role' => $user->role,
            ],
        ]);
    }
}
