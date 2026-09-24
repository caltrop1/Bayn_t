<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table): void {
            $table->string('guest_access_token_hash', 64)->nullable()->unique();
            $table->timestamp('guest_access_expires_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table): void {
            $table->dropUnique(['guest_access_token_hash']);
            $table->dropColumn(['guest_access_token_hash', 'guest_access_expires_at']);
        });
    }
};
