<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function getPaymentMethods(): JsonResponse
    {
        $methods = PaymentMethod::where('is_active', true)
            ->orderBy('display_order')
            ->get();

        if ($methods->isEmpty()) {
            return response()->json([
                ['code' => 'VNPAY', 'name' => 'VNPAY'],
            ]);
        }

        return response()->json($methods);
    }

    public function createVnpayUrl(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validate([
            'orderId' => 'required|integer|exists:orders,id',
        ]);

        $order = Order::findOrFail((int) $validated['orderId']);
        if ($user->role !== 'ADMIN' && (int) $order->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Không có quyền truy cập'], 403);
        }

        $payment = Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'amount' => $order->total_price,
                'payment_method' => 'VNPAY',
                'payment_status' => 'PENDING',
            ]
        );

        return response()->json([
            'paymentUrl' => $this->buildVnpayUrl($order, $payment),
        ]);
    }

    public function handleVnpayReturn(Request $request): JsonResponse
    {
        return $this->handleVnpayCallback($request->all());
    }

    public function handleVnpayIpn(Request $request): JsonResponse
    {
        return $this->handleVnpayCallback($request->all());
    }

    public function getMyPayments(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $payments = Payment::query()
            ->whereIn('order_id', Order::where('user_id', $user->id)->select('id'))
            ->with('order')
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($payments);
    }

    private function handleVnpayCallback(array $vnpData): JsonResponse
    {
        if (! $this->verifyVnpayResponse($vnpData)) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $orderId = (int) ($vnpData['vnp_OrderInfo'] ?? 0);
        $responseCode = (string) ($vnpData['vnp_ResponseCode'] ?? '');
        $transactionNo = (string) ($vnpData['vnp_TransactionNo'] ?? '');
        $bankCode = (string) ($vnpData['vnp_BankCode'] ?? '');

        $payment = Payment::where('order_id', $orderId)->first();
        if (! $payment) {
            return response()->json(['error' => 'Payment record not found'], 404);
        }

        if ($responseCode === '00') {
            $payment->update([
                'payment_status' => 'SUCCESS',
                'transaction_id' => $transactionNo,
                'bank_code' => $bankCode,
                'response_code' => $responseCode,
                'paid_at' => now(),
                'gateway_payload' => $vnpData,
            ]);

            Order::where('id', $orderId)->update(['status' => 'CONFIRMED']);

            return response()->json(['message' => 'Payment successful']);
        }

        $payment->update([
            'payment_status' => 'FAILED',
            'transaction_id' => $transactionNo,
            'bank_code' => $bankCode,
            'response_code' => $responseCode,
            'gateway_payload' => $vnpData,
        ]);

        return response()->json(['error' => 'Payment failed'], 400);
    }

    private function buildVnpayUrl(Order $order, Payment $payment): string
    {
        $tmnCode = (string) config('services.vnpay.tmn_code', '');
        $hashSecret = (string) config('services.vnpay.hash_secret', '');
        $baseUrl = (string) config('services.vnpay.url', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
        $returnUrl = (string) config('services.vnpay.return_url', config('app.url').'/api/payments/vnpay/return');
        $ipnUrl = (string) config('services.vnpay.ipn_url', config('app.url').'/api/payments/vnpay/ipn');

        $startTime = now()->format('YmdHis');
        $expire = now()->addMinutes(15)->format('YmdHis');

        $data = [
            'vnp_Version' => '2.1.0',
            'vnp_Command' => 'pay',
            'vnp_TmnCode' => $tmnCode,
            'vnp_Amount' => (int) round($order->total_price * 100),
            'vnp_CurrCode' => 'VND',
            'vnp_TxnRef' => $order->id.'-'.time(),
            'vnp_OrderInfo' => (string) $order->id,
            'vnp_OrderType' => 'billpayment',
            'vnp_Locale' => (string) config('services.vnpay.locale', 'vn'),
            'vnp_ReturnUrl' => $returnUrl,
            'vnp_IpnUrl' => $ipnUrl,
            'vnp_CreateDate' => $startTime,
            'vnp_ExpireDate' => $expire,
            'vnp_Bill_Mobile' => $order->phone_number,
        ];

        ksort($data);
        $query = http_build_query($data);
        $secureHash = hash_hmac('sha512', $query, $hashSecret);

        $payment->update([
            'gateway_payload' => $data,
        ]);

        return $baseUrl.'?'.$query.'&vnp_SecureHash='.$secureHash;
    }

    private function verifyVnpayResponse(array $data): bool
    {
        $hashSecret = (string) config('services.vnpay.hash_secret', '');
        $secureHash = $data['vnp_SecureHash'] ?? null;

        if (! is_string($secureHash) || $secureHash === '') {
            return false;
        }

        unset($data['vnp_SecureHash'], $data['vnp_SecureHashType']);
        ksort($data);
        $query = http_build_query($data);
        $calculated = hash_hmac('sha512', $query, $hashSecret);

        return hash_equals($secureHash, $calculated);
    }
}
