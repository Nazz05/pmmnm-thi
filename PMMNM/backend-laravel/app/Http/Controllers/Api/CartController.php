<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    public function getCart(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $cart = Cart::firstOrCreate(['user_id' => $user->id]);
        $cart->load('items.product');

        return response()->json([
            'message' => 'Lấy giỏ hàng thành công',
            'data' => $this->cartPayload($cart),
        ]);
    }

    public function addToCart(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'productId' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = Product::findOrFail((int) $validated['productId']);
        $quantity = (int) $validated['quantity'];

        if (! $product->is_active) {
            return response()->json(['message' => 'Sản phẩm đã ngừng kinh doanh'], 400);
        }

        $cart = Cart::firstOrCreate(['user_id' => $user->id]);
        $item = CartItem::where('cart_id', $cart->id)->where('product_id', $product->id)->first();
        $newQuantity = ($item?->quantity ?? 0) + $quantity;

        if ($newQuantity > $product->stock) {
            return response()->json([
                'message' => sprintf('Sản phẩm chỉ còn %d cái trong kho', $product->stock),
            ], 400);
        }

        CartItem::updateOrCreate(
            [
                'cart_id' => $cart->id,
                'product_id' => $product->id,
            ],
            [
                'quantity' => $newQuantity,
            ]
        );

        $cart->load('items.product');

        return response()->json([
            'message' => 'Thêm sản phẩm vào giỏ hàng thành công',
            'data' => $this->cartPayload($cart),
        ]);
    }

    public function syncCart(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $items = $request->input('items', []);

        if (! is_array($items)) {
            return response()->json([
                'message' => 'Danh sách sản phẩm không hợp lệ',
            ], 400);
        }

        $normalized = collect($items)
            ->map(function ($item) {
                if (! is_array($item)) {
                    return null;
                }

                $productId = (int) ($item['productId'] ?? $item['id'] ?? 0);
                $quantity = max(1, (int) ($item['quantity'] ?? 1));
                if ($productId <= 0) {
                    return null;
                }

                return [
                    'product_id' => $productId,
                    'quantity' => $quantity,
                ];
            })
            ->filter()
            ->values();

        $productIds = $normalized->pluck('product_id')->unique()->all();
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

        foreach ($normalized as $row) {
            $product = $products->get($row['product_id']);
            if (! $product) {
                return response()->json(['message' => 'Một hoặc nhiều sản phẩm không tồn tại'], 400);
            }
            if ($row['quantity'] > $product->stock) {
                return response()->json([
                    'message' => sprintf('Sản phẩm %s chỉ còn %d trong kho', $product->name, $product->stock),
                ], 400);
            }
        }

        DB::transaction(function () use ($user, $normalized): void {
            $cart = Cart::firstOrCreate(['user_id' => $user->id]);
            CartItem::where('cart_id', $cart->id)->delete();

            foreach ($normalized as $row) {
                CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $row['product_id'],
                    'quantity' => $row['quantity'],
                ]);
            }
        });

        $cart = Cart::where('user_id', $user->id)->with('items.product')->firstOrFail();

        return response()->json([
            'message' => 'Đồng bộ giỏ hàng thành công',
            'data' => $this->cartPayload($cart),
        ]);
    }

    public function updateCartItem(Request $request, string $cartItemId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $item = CartItem::with(['cart', 'product'])->find((int) $cartItemId);
        if (! $item || $item->cart->user_id !== $user->id) {
            return response()->json(['message' => 'Mục giỏ hàng không tồn tại'], 404);
        }

        if ((int) $validated['quantity'] > $item->product->stock) {
            return response()->json([
                'message' => sprintf('Sản phẩm chỉ còn %d cái trong kho', $item->product->stock),
            ], 400);
        }

        $item->update(['quantity' => (int) $validated['quantity']]);

        $cart = Cart::where('user_id', $user->id)->with('items.product')->firstOrFail();

        return response()->json([
            'message' => 'Cập nhật sản phẩm trong giỏ hàng thành công',
            'data' => $this->cartPayload($cart),
        ]);
    }

    public function removeFromCart(Request $request, string $cartItemId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $item = CartItem::with('cart')->find((int) $cartItemId);
        if (! $item || $item->cart->user_id !== $user->id) {
            return response()->json(['message' => 'Mục giỏ hàng không tồn tại'], 404);
        }

        $item->delete();
        $cart = Cart::where('user_id', $user->id)->with('items.product')->firstOrFail();

        return response()->json([
            'message' => 'Xóa sản phẩm khỏi giỏ hàng thành công',
            'data' => $this->cartPayload($cart),
        ]);
    }

    public function clearCart(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $cart = Cart::firstOrCreate(['user_id' => $user->id]);
        CartItem::where('cart_id', $cart->id)->delete();

        return response()->json([
            'message' => 'Xóa tất cả sản phẩm trong giỏ hàng thành công',
        ]);
    }

    private function cartPayload(Cart $cart): array
    {
        $items = $cart->items;
        $totalPrice = $items->sum(fn (CartItem $item) => (float) $item->product->price * (int) $item->quantity);

        return [
            'id' => $cart->id,
            'user_id' => $cart->user_id,
            'items' => $items,
            'totalPrice' => $totalPrice,
            'itemCount' => $items->count(),
        ];
    }
}
