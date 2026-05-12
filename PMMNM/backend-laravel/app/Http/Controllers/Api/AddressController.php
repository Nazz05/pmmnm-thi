<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $addresses = Address::where('user_id', $user->id)->orderByDesc('is_default')->orderByDesc('id')->get();

        return response()->json($addresses);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'street' => 'required|string|max:255',
            'ward' => 'required|string|max:255',
            'district' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'zipCode' => 'nullable|string|max:50',
            'isDefault' => 'nullable|boolean',
        ]);

        $address = DB::transaction(function () use ($user, $validated): Address {
            if (($validated['isDefault'] ?? false) === true) {
                Address::where('user_id', $user->id)->update(['is_default' => false]);
            }

            return Address::create([
                'user_id' => $user->id,
                'street' => $validated['street'],
                'ward' => $validated['ward'],
                'district' => $validated['district'],
                'city' => $validated['city'],
                'zip_code' => $validated['zipCode'] ?? null,
                'is_default' => (bool) ($validated['isDefault'] ?? false),
            ]);
        });

        return response()->json($address, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $address = Address::where('user_id', $user->id)->find((int) $id);

        if (! $address) {
            return response()->json(['message' => 'Địa chỉ không tồn tại'], 404);
        }

        $validated = $request->validate([
            'street' => 'nullable|string|max:255',
            'ward' => 'nullable|string|max:255',
            'district' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'zipCode' => 'nullable|string|max:50',
            'isDefault' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($user, $address, $validated): void {
            if (($validated['isDefault'] ?? false) === true) {
                Address::where('user_id', $user->id)->update(['is_default' => false]);
            }

            $payload = [];
            if (array_key_exists('street', $validated)) {
                $payload['street'] = $validated['street'];
            }
            if (array_key_exists('ward', $validated)) {
                $payload['ward'] = $validated['ward'];
            }
            if (array_key_exists('district', $validated)) {
                $payload['district'] = $validated['district'];
            }
            if (array_key_exists('city', $validated)) {
                $payload['city'] = $validated['city'];
            }
            if (array_key_exists('zipCode', $validated)) {
                $payload['zip_code'] = $validated['zipCode'];
            }
            if (array_key_exists('isDefault', $validated)) {
                $payload['is_default'] = (bool) $validated['isDefault'];
            }

            $address->update($payload);
        });

        return response()->json($address->fresh());
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $address = Address::where('user_id', $user->id)->find((int) $id);

        if (! $address) {
            return response()->json(['message' => 'Địa chỉ không tồn tại'], 404);
        }

        $address->delete();

        return response()->json(null, 204);
    }
}
