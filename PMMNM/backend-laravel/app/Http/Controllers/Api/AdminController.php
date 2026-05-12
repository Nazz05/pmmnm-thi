<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\AuditLog;
use App\Models\ModuleSetting;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function getAllOrders(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 10)));
        $status = (string) $request->query('status', '');

        $query = Order::query()->with('user', 'items.product', 'payment')->orderByDesc('created_at');
        if ($status !== '') {
            $query->where('status', strtoupper($status));
        }

        $orders = $query->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Lấy danh sách đơn hàng thành công',
            'data' => [
                'orders' => $orders->items(),
                'pagination' => [
                    'total' => $orders->total(),
                    'page' => $orders->currentPage(),
                    'limit' => $orders->perPage(),
                    'totalPages' => $orders->lastPage(),
                ],
            ],
        ]);
    }

    public function createOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'userId' => 'required|integer|exists:users,id',
            'shippingAddr' => 'required|string|max:500',
            'phoneNumber' => 'required|string|max:50',
            'note' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.productId' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $orderController = new OrderController();
        $fakeRequest = Request::create('/api/orders/checkout', 'POST', [
            'shippingAddr' => $validated['shippingAddr'],
            'phoneNumber' => $validated['phoneNumber'],
            'note' => $validated['note'] ?? null,
            'items' => $validated['items'],
        ]);
        $fakeRequest->setUserResolver(fn () => User::findOrFail((int) $validated['userId']));

        return $orderController->checkout($fakeRequest);
    }

    public function updateOrderStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:PENDING,CONFIRMED,SHIPPED,DELIVERED,CANCELLED',
        ]);

        $order = Order::find((int) $id);
        if (! $order) {
            return response()->json(['message' => 'Đơn hàng không tồn tại'], 404);
        }

        $order->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Cập nhật trạng thái đơn hàng thành công',
            'data' => $order->fresh()->load('user', 'items.product', 'payment'),
        ]);
    }

    public function deleteOrder(string $id): JsonResponse
    {
        $order = Order::find((int) $id);
        if (! $order) {
            return response()->json(['message' => 'Đơn hàng không tồn tại'], 404);
        }

        $order->delete();

        return response()->json(['message' => 'Xóa đơn hàng thành công']);
    }

    public function getAllUsers(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 10)));
        $role = (string) $request->query('role', '');

        $query = User::query()->orderByDesc('id');
        if ($role !== '') {
            $query->where('role', strtoupper($role));
        }

        $users = $query->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Lấy danh sách người dùng thành công',
            'data' => [
                'users' => $users->items(),
                'pagination' => [
                    'total' => $users->total(),
                    'page' => $users->currentPage(),
                    'limit' => $users->perPage(),
                    'totalPages' => $users->lastPage(),
                ],
            ],
        ]);
    }

    public function createUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'fullName' => 'required|string|max:255',
            'phone' => 'nullable|string|max:30',
            'role' => 'nullable|string|in:ADMIN,USER',
            'isActive' => 'nullable|boolean',
        ]);

        $user = User::create([
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'full_name' => $validated['fullName'],
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'] ?? 'USER',
            'is_active' => (bool) ($validated['isActive'] ?? true),
        ]);

        return response()->json([
            'message' => 'Tạo người dùng thành công',
            'data' => $user,
        ], 201);
    }

    public function updateUser(Request $request, string $id): JsonResponse
    {
        $user = User::find((int) $id);
        if (! $user) {
            return response()->json(['message' => 'Người dùng không tồn tại'], 404);
        }

        $validated = $request->validate([
            'fullName' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
            'role' => 'nullable|string|in:ADMIN,USER',
            'isActive' => 'nullable|boolean',
        ]);

        $payload = [];
        if (array_key_exists('fullName', $validated)) {
            $payload['full_name'] = $validated['fullName'];
        }
        if (array_key_exists('phone', $validated)) {
            $payload['phone'] = $validated['phone'];
        }
        if (array_key_exists('role', $validated)) {
            $payload['role'] = $validated['role'];
        }
        if (array_key_exists('isActive', $validated)) {
            $payload['is_active'] = (bool) $validated['isActive'];
        }

        $user->update($payload);

        return response()->json([
            'message' => 'Cập nhật người dùng thành công',
            'data' => $user->fresh(),
        ]);
    }

    public function deleteUser(string $id): JsonResponse
    {
        $user = User::find((int) $id);
        if (! $user) {
            return response()->json(['message' => 'Người dùng không tồn tại'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'Xóa người dùng thành công']);
    }

    public function getAllAddresses(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 10)));
        $addresses = Address::with('user')->orderByDesc('id')->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Lấy danh sách địa chỉ thành công',
            'data' => [
                'addresses' => $addresses->items(),
                'pagination' => [
                    'total' => $addresses->total(),
                    'page' => $addresses->currentPage(),
                    'limit' => $addresses->perPage(),
                    'totalPages' => $addresses->lastPage(),
                ],
            ],
        ]);
    }

    public function createAddress(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'userId' => 'required|integer|exists:users,id',
            'street' => 'required|string|max:255',
            'ward' => 'required|string|max:255',
            'district' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'zipCode' => 'nullable|string|max:50',
            'isDefault' => 'nullable|boolean',
        ]);

        $address = Address::create([
            'user_id' => $validated['userId'],
            'street' => $validated['street'],
            'ward' => $validated['ward'],
            'district' => $validated['district'],
            'city' => $validated['city'],
            'zip_code' => $validated['zipCode'] ?? null,
            'is_default' => (bool) ($validated['isDefault'] ?? false),
        ]);

        return response()->json([
            'message' => 'Tạo địa chỉ thành công',
            'data' => $address,
        ], 201);
    }

    public function updateAddress(Request $request, string $id): JsonResponse
    {
        $address = Address::find((int) $id);
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

        return response()->json([
            'message' => 'Cập nhật địa chỉ thành công',
            'data' => $address->fresh(),
        ]);
    }

    public function setDefaultAddress(string $id): JsonResponse
    {
        $address = Address::find((int) $id);
        if (! $address) {
            return response()->json(['message' => 'Địa chỉ không tồn tại'], 404);
        }

        Address::where('user_id', $address->user_id)->update(['is_default' => false]);
        $address->update(['is_default' => true]);

        return response()->json([
            'message' => 'Đặt địa chỉ mặc định thành công',
            'data' => $address->fresh(),
        ]);
    }

    public function deleteAddress(string $id): JsonResponse
    {
        $address = Address::find((int) $id);
        if (! $address) {
            return response()->json(['message' => 'Địa chỉ không tồn tại'], 404);
        }

        $address->delete();

        return response()->json(['message' => 'Xóa địa chỉ thành công']);
    }

    public function getAuditLogs(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 20)));

        $logs = AuditLog::with('user')
            ->orderByDesc('created_at')
            ->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Lấy audit logs thành công',
            'data' => [
                'logs' => $logs->items(),
                'pagination' => [
                    'total' => $logs->total(),
                    'page' => $logs->currentPage(),
                    'limit' => $logs->perPage(),
                    'totalPages' => $logs->lastPage(),
                ],
            ],
        ]);
    }

    public function getModuleStatuses(): JsonResponse
    {
        return response()->json([
            'message' => 'Lấy trạng thái module thành công',
            'data' => ModuleSetting::orderBy('name')->get(),
        ]);
    }

    public function updateModuleStatus(Request $request, string $moduleName): JsonResponse
    {
        $validated = $request->validate([
            'isEnabled' => 'required|boolean',
        ]);

        $module = ModuleSetting::updateOrCreate(
            ['name' => $moduleName],
            ['is_enabled' => (bool) $validated['isEnabled']]
        );

        return response()->json([
            'message' => 'Cập nhật trạng thái module thành công',
            'data' => $module,
        ]);
    }
}
