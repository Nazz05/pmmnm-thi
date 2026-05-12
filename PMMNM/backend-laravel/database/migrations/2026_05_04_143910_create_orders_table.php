<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('orders')) {
            Schema::create('orders', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
                $table->enum('status', ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])->default('PENDING');
                $table->double('total_price');
                $table->string('shipping_addr');
                $table->string('phone_number');
                $table->text('note')->nullable();
                $table->softDeletes();
                $table->timestamps();

                $table->index('user_id');
                $table->index(['user_id', 'created_at']);
                $table->index(['status', 'created_at']);
                $table->index('deleted_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
