<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grading_configs', function (Blueprint $table) {
            $table->unique(['program_id', 'category'], 'grading_configs_program_category_unique');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index('actor_id', 'audit_logs_actor_id_index');
            $table->index('action', 'audit_logs_action_index');
            $table->index('created_at', 'audit_logs_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('audit_logs_actor_id_index');
            $table->dropIndex('audit_logs_action_index');
            $table->dropIndex('audit_logs_created_at_index');
        });

        Schema::table('grading_configs', function (Blueprint $table) {
            $table->dropUnique('grading_configs_program_category_unique');
        });
    }
};
