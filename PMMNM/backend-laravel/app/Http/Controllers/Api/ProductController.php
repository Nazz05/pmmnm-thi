<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function listProducts(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 10)));
        $search = trim((string) $request->query('search', ''));
        $categoryId = $request->query('categoryId');
        $sortBy = (string) $request->query('sortBy', 'latest');

        $query = Product::query()
            ->with('category')
            ->where('is_active', true);

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('name', 'ilike', "%{$search}%")
                    ->orWhere('desc', 'ilike', "%{$search}%");
            });
        }

        if ($categoryId !== null && $categoryId !== '') {
            $query->where('category_id', (int) $categoryId);
        }

        if ($sortBy === 'price_asc') {
            $query->orderBy('price', 'asc');
        } elseif ($sortBy === 'price_desc') {
            $query->orderBy('price', 'desc');
        } else {
            $query->orderByDesc('created_at');
        }

        $products = $query->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Lấy danh sách sản phẩm thành công',
            'data' => $products->items(),
            'pagination' => [
                'total' => $products->total(),
                'page' => $products->currentPage(),
                'limit' => $products->perPage(),
                'totalPages' => $products->lastPage(),
            ],
        ]);
    }

    public function getProductDetail(string $productId): JsonResponse
    {
        $id = (int) $productId;
        $product = Product::with('category')->find($id);

        if (! $product) {
            return response()->json([
                'message' => 'Sản phẩm không tồn tại',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'message' => 'Lấy chi tiết sản phẩm thành công',
            'data' => $product,
        ]);
    }

    public function listCategories(): JsonResponse
    {
        $categories = Category::query()
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return response()->json([
            'message' => 'Lấy danh mục sản phẩm thành công',
            'data' => $categories,
        ]);
    }

    public function createProduct(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'desc' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'categoryId' => 'required|integer|exists:categories,id',
            'image' => 'nullable|string|max:2048',
        ]);

        $product = Product::create([
            'category_id' => (int) $validated['categoryId'],
            'name' => $validated['name'],
            'slug' => $this->uniqueSlug($validated['name']),
            'desc' => $validated['desc'] ?? null,
            'price' => (float) $validated['price'],
            'stock' => (int) ($validated['stock'] ?? 0),
            'image' => $validated['image'] ?? null,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Tạo sản phẩm thành công',
            'data' => $product->load('category'),
        ], 201);
    }

    public function updateProduct(Request $request, string $productId): JsonResponse
    {
        $product = Product::find((int) $productId);

        if (! $product) {
            return response()->json([
                'message' => 'Sản phẩm không tồn tại',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'desc' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'image' => 'nullable|string|max:2048',
            'isActive' => 'nullable|boolean',
        ]);

        $payload = [];
        if (array_key_exists('name', $validated)) {
            $payload['name'] = $validated['name'];
            $payload['slug'] = $this->uniqueSlug($validated['name'], $product->id);
        }
        if (array_key_exists('desc', $validated)) {
            $payload['desc'] = $validated['desc'];
        }
        if (array_key_exists('price', $validated)) {
            $payload['price'] = (float) $validated['price'];
        }
        if (array_key_exists('stock', $validated)) {
            $payload['stock'] = (int) $validated['stock'];
        }
        if (array_key_exists('image', $validated)) {
            $payload['image'] = $validated['image'];
        }
        if (array_key_exists('isActive', $validated)) {
            $payload['is_active'] = (bool) $validated['isActive'];
        }

        $product->update($payload);

        return response()->json([
            'message' => 'Cập nhật sản phẩm thành công',
            'data' => $product->fresh()->load('category'),
        ]);
    }

    public function deleteProduct(string $productId): JsonResponse
    {
        $product = Product::find((int) $productId);
        if (! $product) {
            return response()->json([
                'message' => 'Sản phẩm không tồn tại',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $product->delete();

        return response()->json([
            'message' => 'Xóa sản phẩm thành công',
        ]);
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 2;

        while (
            Product::query()
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $i);
            $i++;
        }

        return $slug;
    }
}
