<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PrismaSeedSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Create payment methods (idempotent)
        $paymentMethods = [
            ['name' => 'Thẻ Tín Dụng / Ghi Nợ', 'code' => 'CARD', 'description' => 'Thanh toán bằng thẻ tín dụng hoặc thẻ ghi nợ', 'icon' => '💳', 'is_active' => true, 'display_order' => 1],
            ['name' => 'Chuyển Khoản Ngân Hàng', 'code' => 'BANK', 'description' => 'Chuyển tiền trực tiếp vào tài khoản ngân hàng', 'icon' => '🏦', 'is_active' => true, 'display_order' => 2],
            ['name' => 'Ví Điện Tử', 'code' => 'WALLET', 'description' => 'Thanh toán qua ví điện tử (Momo, Zalo Pay, ViettelPay)', 'icon' => '📱', 'is_active' => true, 'display_order' => 3],
            ['name' => 'Thanh Toán Khi Nhận', 'code' => 'COD', 'description' => 'Thanh toán tiền mặt khi nhận hàng', 'icon' => '🚚', 'is_active' => true, 'display_order' => 4],
        ];

        foreach ($paymentMethods as $pm) {
            PaymentMethod::firstOrCreate(['code' => $pm['code']], $pm);
        }

        // Create admin and sample users
        $admin = User::firstOrCreate(
            ['email' => 'admin@ltwnc.tech'],
            [
                'password' => 'Admin@123',
                'full_name' => 'Admin User',
                'phone' => '0123456789',
                'role' => 'ADMIN',
                'is_active' => true,
            ]
        );

        $testUsers = ['user@ltwnc.tech','user2@ltwnc.tech','user3@ltwnc.tech','user4@ltwnc.tech','user5@ltwnc.tech'];
        $seededUsers = [];

        foreach ($testUsers as $idx => $email) {
            $u = User::firstOrCreate(
                ['email' => $email],
                [
                    'password' => 'User@123',
                    'full_name' => 'Test User '.($idx + 1),
                    'phone' => '098765432'.($idx + 1),
                    'role' => 'USER',
                    'is_active' => true,
                ]
            );

            $seededUsers[] = $u;
        }

        // Create addresses for first few users
        foreach (array_slice($seededUsers, 0, 5) as $i => $u) {
            Address::firstOrCreate([
                'user_id' => $u->id,
                'street' => 'Sample Street '.$i,
            ],[
                'ward' => 'Phường 1',
                'district' => 'Quận 1',
                'city' => 'TP Hồ Chí Minh',
                'zip_code' => '7000'.$i,
                'is_default' => true,
            ]);
        }

        // Create categories
        $categories = ['Nam'=>'nam','Nữ'=>'nu','Giày'=>'giay','Phụ kiện'=>'phu-kien'];
        $categoryModels = [];
        foreach ($categories as $name => $slug) {
            $categoryModels[] = Category::firstOrCreate(['slug'=>$slug], ['name'=>$name,'desc'=>$name.' products']);
        }

        // Create some products
        $productSeeds = [
            ['category' => 0, 'name'=>'Áo thun nam cơ bản','slug'=>'ao-thun-nam-co-ban-1','price'=>199000,'origin_price'=>299000,'stock'=>50,'image'=>'https://naidecor.vn/wp-content/uploads/2020/01/ct00192-549k.jpg'],
            ['category' => 0, 'name'=>'Áo sơ mi nam trắng','slug'=>'ao-so-mi-nam-trang-1','price'=>349000,'origin_price'=>499000,'stock'=>30,'image'=>'https://naidecor.vn/wp-content/uploads/2020/01/ct00192-549k.jpg'],
            ['category' => 1, 'name'=>'Áo thun nữ cơ bản','slug'=>'ao-thun-nu-co-ban-1','price'=>189000,'origin_price'=>289000,'stock'=>45,'image'=>'https://naidecor.vn/wp-content/uploads/2020/01/ct00192-549k.jpg'],
        ];

        $products = [];
        foreach ($productSeeds as $ps) {
            $cat = $categoryModels[$ps['category']] ?? $categoryModels[0];
            $p = Product::firstOrCreate(['slug' => $ps['slug']], [
                'category_id' => $cat->id,
                'name' => $ps['name'],
                'desc' => $ps['name'],
                'price' => $ps['price'],
                'origin_price' => $ps['origin_price'],
                'stock' => $ps['stock'],
                'image' => $ps['image'],
                'is_active' => true,
            ]);

            $products[] = $p;
        }

        // Create a cart for first seeded user and add items
        $firstUser = $seededUsers[0] ?? $admin;
        $cart = Cart::firstOrCreate(['user_id' => $firstUser->id]);
        if (! CartItem::where('cart_id', $cart->id)->exists() && ! empty($products)) {
            CartItem::create(['cart_id' => $cart->id, 'product_id' => $products[0]->id, 'quantity' => 2]);
            if (isset($products[1])) {
                CartItem::create(['cart_id' => $cart->id, 'product_id' => $products[1]->id, 'quantity' => 1]);
            }
        }

        // Create sample order
        if (! Order::where('user_id', $firstUser->id)->exists()) {
            $order = Order::create([
                'user_id' => $firstUser->id,
                'status' => 'CONFIRMED',
                'total_price' => ($products[0]->price ?? 0) * 2 + ($products[1]->price ?? 0),
                'shipping_addr' => '123 Đường ABC, Phường 1, Quận 1, TP HCM',
                'phone_number' => '0987654321',
                'note' => 'Giao hàng nhanh nếu được',
            ]);

            if (! empty($products)) {
                OrderItem::create(['order_id' => $order->id, 'product_id' => $products[0]->id, 'quantity' => 2, 'price' => $products[0]->price]);
                if (isset($products[1])) {
                    OrderItem::create(['order_id' => $order->id, 'product_id' => $products[1]->id, 'quantity' => 1, 'price' => $products[1]->price]);
                }
            }
        }

        // Audit log: insert non-destructively; some existing audit_logs tables may lack updated_at
        $exists = DB::table('audit_logs')->where('action', 'seeded')->where('entity', 'system')->exists();
        if (! $exists) {
            DB::table('audit_logs')->insert([
                'user_id' => $admin->id,
                'action' => 'seeded',
                'entity' => 'system',
                'entity_id' => null,
                'new_values' => json_encode(['note' => 'seed ran']),
                'created_at' => now(),
            ]);
        }
    }
}
