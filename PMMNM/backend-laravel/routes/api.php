<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'ok' => true,
        'service' => 'ltwnc-shop-laravel',
    ]);
});

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/oauth/google', [AuthController::class, 'oauthGoogle']);
    Route::post('/oauth/facebook', [AuthController::class, 'oauthFacebook']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::post('/password/forgot', [AuthController::class, 'forgotPassword']);
    Route::post('/password/reset', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:api')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/sessions', [AuthController::class, 'sessions']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        Route::get('/admin/probe', [AuthController::class, 'adminProbe'])->middleware('role:ADMIN');
    });
});

Route::get('/products', [ProductController::class, 'listProducts']);
Route::get('/products/categories', [ProductController::class, 'listCategories']);
Route::get('/products/{productId}', [ProductController::class, 'getProductDetail']);

Route::get('/payments/methods', [PaymentController::class, 'getPaymentMethods']);
Route::get('/payments/vnpay/return', [PaymentController::class, 'handleVnpayReturn']);
Route::get('/payments/vnpay/ipn', [PaymentController::class, 'handleVnpayIpn']);

Route::middleware('auth:api')->group(function (): void {
    Route::post('/products', [ProductController::class, 'createProduct'])->middleware('role:ADMIN');
    Route::put('/products/{productId}', [ProductController::class, 'updateProduct'])->middleware('role:ADMIN');
    Route::delete('/products/{productId}', [ProductController::class, 'deleteProduct'])->middleware('role:ADMIN');

    Route::prefix('cart')->group(function (): void {
        Route::get('/', [CartController::class, 'getCart']);
        Route::post('/add', [CartController::class, 'addToCart']);
        Route::post('/sync', [CartController::class, 'syncCart']);
        Route::put('/{cartItemId}', [CartController::class, 'updateCartItem']);
        Route::delete('/{cartItemId}', [CartController::class, 'removeFromCart']);
        Route::delete('/', [CartController::class, 'clearCart']);
    });

    Route::prefix('orders')->group(function (): void {
        Route::post('/', [OrderController::class, 'checkout']);
        Route::post('/checkout', [OrderController::class, 'checkout']);
        Route::get('/my', [OrderController::class, 'listMyOrders']);
        Route::get('/{orderId}', [OrderController::class, 'getOrderDetail']);
        Route::patch('/{orderId}/cancel', [OrderController::class, 'cancelOrder']);
        Route::get('/', [OrderController::class, 'listOrders'])->middleware('role:ADMIN');
        Route::patch('/{orderId}/status', [OrderController::class, 'updateOrderStatus'])->middleware('role:ADMIN');
    });

    Route::prefix('payments')->group(function (): void {
        Route::get('/', [PaymentController::class, 'getMyPayments']);
        Route::post('/vnpay/create-url', [PaymentController::class, 'createVnpayUrl']);
    });

    Route::get('/users/profile', [UserController::class, 'getProfile']);
    Route::put('/users/profile', [UserController::class, 'updateProfile']);

    Route::apiResource('addresses', AddressController::class)->except(['show']);

    Route::prefix('admin')->middleware('role:ADMIN')->group(function (): void {
        Route::get('/orders', [AdminController::class, 'getAllOrders']);
        Route::post('/orders', [AdminController::class, 'createOrder']);
        Route::put('/orders/{id}', [AdminController::class, 'updateOrderStatus']);
        Route::delete('/orders/{id}', [AdminController::class, 'deleteOrder']);

        Route::get('/users', [AdminController::class, 'getAllUsers']);
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);

        Route::get('/addresses', [AdminController::class, 'getAllAddresses']);
        Route::post('/addresses', [AdminController::class, 'createAddress']);
        Route::put('/addresses/{id}', [AdminController::class, 'updateAddress']);
        Route::post('/addresses/{id}/set-default', [AdminController::class, 'setDefaultAddress']);
        Route::delete('/addresses/{id}', [AdminController::class, 'deleteAddress']);

        Route::get('/audit-logs', [AdminController::class, 'getAuditLogs']);
    });

    Route::prefix('admin/modules')->middleware('role:ADMIN')->group(function (): void {
        Route::get('/', [AdminController::class, 'getModuleStatuses']);
        Route::put('/{moduleName}', [AdminController::class, 'updateModuleStatus']);
    });
});
