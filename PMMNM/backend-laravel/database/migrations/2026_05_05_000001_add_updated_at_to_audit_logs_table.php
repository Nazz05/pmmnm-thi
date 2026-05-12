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
        if (! Schema::hasTable('audit_logs')) {
            return;
        }

        Schema::table('audit_logs', function (Blueprint $table): void {
            if (! Schema::hasColumn('audit_logs', 'updated_at')) {
                $table->timestamp('updated_at')->nullable()->after('new_values');
            }

            if (! Schema::hasColumn('audit_logs', 'created_at')) {
                $table->timestamp('created_at')->nullable()->after('updated_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('audit_logs')) {
            return;
        }

        Schema::table('audit_logs', function (Blueprint $table): void {
            if (Schema::hasColumn('audit_logs', 'updated_at')) {
                $table->dropColumn('updated_at');
            }

            if (Schema::hasColumn('audit_logs', 'created_at')) {
                $table->dropColumn('created_at');
            }
        });
    }
};
