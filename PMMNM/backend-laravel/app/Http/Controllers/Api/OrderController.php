<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function checkout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'shippingAddr' => 'required|string|max:500',
            'phoneNumber' => 'required|string|max:50',
            'note' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.productId' => 'required_with:items|integer|exists:products,id',
            'items.*.quantity' => 'required_with:items|integer|min:1',
        ]);

        $requestedItems = collect($validated['items'] ?? [])->map(function (array $item): array {
            return [
                'product_id' => (int) $item['productId'],
                'quantity' => (int) $item['quantity'],
            ];
        });

        try {
            $order = DB::transaction(function () use ($user, $validated, $requestedItems): Order {
                $checkoutItems = $requestedItems;

                if ($checkoutItems->isEmpty()) {
                    $cart = Cart::with('items')->where('user_id', $user->id)->first();

                    if (! $cart || $cart->items->isEmpty()) {
                        abort(response()->json(['message' => 'Giỏ hàng trống, không thể checkout'], 400));
                    }

                    $checkoutItems = $cart->items->map(fn ($item) => [
                        'product_id' => (int) $item->product_id,
                        'quantity' => (int) $item->quantity,
                    ]);
                }

                $products = Product::whereIn('id', $checkoutItems->pluck('product_id')->unique()->all())
                    ->get()
                    ->keyBy('id');

                $totalPrice = 0.0;
                foreach ($checkoutItems as $item) {
                    $product = $products->get($item['product_id']);
                    if (! $product || ! $product->is_active) {
                        abort(response()->json(['message' => 'Một hoặc nhiều sản phẩm không tồn tại'], 404));
                    }
                    if ($item['quantity'] > $product->stock) {
                        abort(response()->json([
                            'message' => sprintf('Sản phẩm %s chỉ còn %d trong kho', $product->name, $product->stock),
                        ], 400));
                    }

                    $totalPrice += (float) $product->price * $item['quantity'];
                }

                foreach ($checkoutItems as $item) {
                    Product::where('id', $item['product_id'])->decrement('stock', $item['quantity']);
                }

                $order = Order::create([
                    'user_id' => $user->id,
                    'status' => 'PENDING',
                    'total_price' => $totalPrice,
                    'shipping_addr' => $validated['shippingAddr'],
                    'phone_number' => $validated['phoneNumber'],
                    'note' => $validated['note'] ?? null,
                ]);

                foreach ($checkoutItems as $item) {
                    $product = $products->get($item['product_id']);
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'price' => (float) $product->price,
                    ]);
                }

                if ($requestedItems->isEmpty()) {
                    $cart = Cart::where('user_id', $user->id)->first();
                    if ($cart) {
                        $cart->items()->delete();
                    }
                }

                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'checkout',
                    'entity' => 'order',
                    'entity_id' => $order->id,
                    'new_values' => [
                        'status' => 'PENDING',
                        'total_price' => $totalPrice,
                    ],
                ]);

                return $order;
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $exception) {
            /** @var \Illuminate\Http\JsonResponse $response */
            $response = $exception->getResponse();
            return $response;
        }

        return response()->json([
            'message' => 'Checkout thành công',
            'data' => $this->loadOrder($order->id),
        ], 201);
    }

    public function listMyOrders(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 10)));

        $orders = Order::where('user_id', $user->id)
            ->with('items.product.category', 'payment')
            ->orderByDesc('created_at')
            ->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Lấy danh sách đơn hàng của tôi thành công',
            'data' => $orders->items(),
            'pagination' => [
                'total' => $orders->total(),
                'page' => $orders->currentPage(),
                'limit' => $orders->perPage(),
                'totalPages' => $orders->lastPage(),
            ],
        ]);
    }

    public function listOrders(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 10)));
        $status = $request->query('status');
        $userId = $request->query('userId');

        $query = Order::query()->with('items.product.category', 'payment', 'user')->orderByDesc('created_at');

        if (is_string($status) && $status !== '') {
            $query->where('status', strtoupper($status));
        }
        if ($userId !== null && $userId !== '') {
            $query->where('user_id', (int) $userId);
        }

        $orders = $query->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Lấy danh sách đơn hàng thành công',
            'data' => $orders->items(),
            'pagination' => [
                'total' => $orders->total(),
                'page' => $orders->currentPage(),
                'limit' => $orders->perPage(),
                'totalPages' => $orders->lastPage(),
            ],
        ]);
    }

    public function getOrderDetail(Request $request, string $orderId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $order = Order::with('items.product.category', 'payment')->find((int) $orderId);

        if (! $order) {
            return response()->json(['message' => 'Đơn hàng không tồn tại'], 404);
        }

        if ($user->role !== 'ADMIN' && (int) $order->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Không có quyền truy cập'], 403);
        }

        return response()->json([
            'message' => 'Lấy chi tiết đơn hàng thành công',
            'data' => $order,
        ]);
    }

    public function cancelOrder(Request $request, string $orderId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $order = Order::with('items.product')->find((int) $orderId);

        if (! $order || (int) $order->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Đơn hàng không tồn tại'], 404);
        }

        if (! in_array($order->status->value, ['PENDING', 'CONFIRMED'], true)) {
            return response()->json([
                'message' => 'Đơn hàng không thể hủy ở trạng thái hiện tại',
            ], 400);
        }

        DB::transaction(function () use ($order): void {
            foreach ($order->items as $item) {
                Product::where('id', $item->product_id)->increment('stock', $item->quantity);
            }
            $order->update(['status' => 'CANCELLED']);
        });

        return response()->json([
            'message' => 'Hủy đơn hàng thành công',
            'data' => $this->loadOrder($order->id),
        ]);
    }

    public function updateOrderStatus(Request $request, string $orderId): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:PENDING,CONFIRMED,SHIPPED,DELIVERED,CANCELLED',
        ]);

        $order = Order::find((int) $orderId);
        if (! $order) {
            return response()->json(['message' => 'Đơn hàng không tồn tại'], 404);
        }

        $order->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Cập nhật trạng thái đơn hàng thành công',
            'data' => $this->loadOrder($order->id),
        ]);
    }

    private function loadOrder(int $orderId): Order
    {
        return Order::with('items.product.category', 'payment', 'user')->findOrFail($orderId);
    }
}
