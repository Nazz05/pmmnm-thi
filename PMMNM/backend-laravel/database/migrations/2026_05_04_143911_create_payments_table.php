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
        if (! Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->unique()->constrained('orders')->cascadeOnDelete();
                $table->double('amount');
                $table->string('payment_method')->nullable();
                $table->string('payment_status')->default('PENDING');
                $table->string('transaction_id')->nullable();
                $table->string('bank_code')->nullable();
                $table->string('response_code')->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->longText('gateway_payload')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index('payment_status');
                $table->index('transaction_id');
                $table->index('created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
