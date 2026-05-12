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
        if (! Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->id();
                $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('desc')->nullable();
                $table->double('price');
                $table->double('origin_price')->nullable();
                $table->integer('stock')->default(0);
                $table->string('image')->nullable();
                $table->boolean('is_active')->default(true);
                $table->softDeletes();
                $table->timestamps();

                $table->index('category_id');
                $table->index(['is_active', 'category_id']);
                $table->index('name');
                $table->index('deleted_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
