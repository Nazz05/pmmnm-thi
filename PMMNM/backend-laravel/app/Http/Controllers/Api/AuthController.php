<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:8',
            'fullName' => 'required|string|max:255',
            'phone' => 'nullable|string|max:30',
        ]);

        $email = Str::lower(trim($validated['email']));

        if (User::withTrashed()->where('email', $email)->exists()) {
            return response()->json([
                'message' => 'Email already exists',
                'code' => 'CONFLICT',
            ], 409);
        }

        $user = User::create([
            'email' => $email,
            'password' => $validated['password'],
            'full_name' => trim($validated['fullName']),
            'phone' => $validated['phone'] ?? null,
            'role' => 'USER',
            'is_active' => true,
        ]);

        return response()->json([
            'user' => $this->userPayload($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $email = Str::lower(trim($validated['email']));
        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'Invalid credentials',
                'code' => 'UNAUTHORIZED',
            ], 401);
        }

        $passwordMatches = false;
        try {
            $passwordMatches = Hash::check($validated['password'], $user->password);
        } catch (\RuntimeException $e) {
            $passwordMatches = password_verify($validated['password'], $user->password);
            if ($passwordMatches) {
                // Rehash into default hasher to normalize stored password
                $user->password = $validated['password'];
                $user->save();
            }
        }

        if (! $passwordMatches) {
            return response()->json([
                'message' => 'Invalid credentials',
                'code' => 'UNAUTHORIZED',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Account is disabled',
                'code' => 'FORBIDDEN',
            ], 403);
        }

        $credentials = [
            'email' => $email,
            'password' => $validated['password'],
        ];

        $accessToken = auth('api')->attempt($credentials);

        if (! $accessToken) {
            return response()->json([
                'message' => 'Invalid credentials',
                'code' => 'UNAUTHORIZED',
            ], 401);
        }

        $refreshToken = $accessToken;
        $sessionId = (string) Str::uuid();

        return response()->json([
            'user' => $this->userPayload($user),
            'accessToken' => $accessToken,
            'refreshToken' => $refreshToken,
            'sessionId' => $sessionId,
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'refreshToken' => 'required|string',
        ]);

        try {
            $newAccessToken = auth('api')->setToken($validated['refreshToken'])->refresh();
        } catch (\Throwable) {
            return response()->json([
                'message' => 'Invalid refresh token',
                'code' => 'TOKEN_INVALID',
            ], 401);
        }

        return response()->json([
            'accessToken' => $newAccessToken,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        return response()->json([
            'user' => $user ? $this->userPayload($user) : null,
        ]);
    }

    public function sessions(Request $request): JsonResponse
    {
        $payload = auth('api')->payload();

        $sessions = [[
            'jti' => $payload->get('jti'),
            'sub' => $payload->get('sub'),
            'email' => $payload->get('email'),
            'role' => $payload->get('role'),
            'iat' => $payload->get('iat'),
            'exp' => $payload->get('exp'),
        ]];

        return response()->json([
            'sessions' => $sessions,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            auth('api')->logout();
        } catch (\Throwable) {
            // If the token is already invalidated, still return success for idempotency.
        }

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function logoutAll(Request $request): JsonResponse
    {
        auth('api')->logout(true);

        return response()->json([
            'message' => 'All sessions revoked',
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $email = Str::lower(trim($validated['email']));
        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'If the email exists, reset instructions have been generated',
            ]);
        }

        $resetToken = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => Hash::make($resetToken),
                'created_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Reset token generated',
            'resetToken' => $resetToken,
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'newPassword' => 'required|string|min:8',
        ]);

        $records = DB::table('password_reset_tokens')->get();
        $matched = $records->first(fn ($record) => Hash::check($validated['token'], (string) $record->token));

        if (! $matched) {
            return response()->json([
                'message' => 'Invalid reset token',
                'code' => 'TOKEN_INVALID',
            ], 400);
        }

        /** @var User|null $user */
        $user = User::where('email', $matched->email)->first();
        if (! $user) {
            return response()->json([
                'message' => 'User not found',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $user->update([
            'password' => $validated['newPassword'],
        ]);

        DB::table('password_reset_tokens')->where('email', $matched->email)->delete();

        return response()->json([
            'message' => 'Password reset successfully',
        ]);
    }

    public function oauthGoogle(): JsonResponse
    {
        $validated = request()->validate([
            'accessToken' => 'required_without:code|string',
            'code' => 'required_without:accessToken|string',
        ]);

        $token = $validated['accessToken'] ?? null;

        try {
            $socialUser = $token
                ? Socialite::driver('google')->stateless()->userFromToken($token)
                : Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            Log::error('Google OAuth error: '.$e->getMessage());
            return response()->json(['message' => 'Invalid Google token', 'code' => 'OAUTH_ERROR'], 400);
        }

        $email = strtolower(trim($socialUser->getEmail() ?? ''));
        if (! $email) {
            return response()->json(['message' => 'Google account has no email', 'code' => 'OAUTH_NO_EMAIL'], 400);
        }

        $user = User::firstOrCreate(['email' => $email], [
            'full_name' => $socialUser->getName() ?? $socialUser->getNickname() ?? $email,
            'password' => Str::random(40),
            'phone' => null,
            'role' => 'USER',
            'is_active' => true,
        ]);

        $accessToken = auth('api')->login($user);

        return response()->json([
            'user' => $this->userPayload($user),
            'accessToken' => $accessToken,
            'refreshToken' => $accessToken,
        ]);

    }

    public function oauthFacebook(): JsonResponse
    {
        $validated = request()->validate([
            'accessToken' => 'required_without:code|string',
            'code' => 'required_without:accessToken|string',
        ]);

        $token = $validated['accessToken'] ?? null;

        try {
            $socialUser = $token
                ? Socialite::driver('facebook')->stateless()->userFromToken($token)
                : Socialite::driver('facebook')->stateless()->user();
        } catch (\Throwable $e) {
            Log::error('Facebook OAuth error: '.$e->getMessage());
            return response()->json(['message' => 'Invalid Facebook token', 'code' => 'OAUTH_ERROR'], 400);
        }

        $email = strtolower(trim($socialUser->getEmail() ?? ''));
        if (! $email) {
            return response()->json(['message' => 'Facebook account has no email', 'code' => 'OAUTH_NO_EMAIL'], 400);
    }

        $user = User::firstOrCreate(['email' => $email], [
            'full_name' => $socialUser->getName() ?? $socialUser->getNickname() ?? $email,
            'password' => Str::random(40),
            'phone' => null,
            'role' => 'USER',
            'is_active' => true,
        ]);

        $accessToken = auth('api')->login($user);

        return response()->json([
            'user' => $this->userPayload($user),
            'accessToken' => $accessToken,
            'refreshToken' => $accessToken,
        ]);

    }

    public function adminProbe(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'message' => sprintf('Hello admin %s', $user->email),
        ]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'fullName' => $user->full_name,
            'phone' => $user->phone,
            'role' => $user->role,
            'isActive' => $user->is_active,
        ];
    }
}
