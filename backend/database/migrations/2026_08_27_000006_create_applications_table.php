<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique();
            $table->foreignId('program_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('intake_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('applicant_name')->nullable();
            $table->string('applicant_email');
            $table->string('applicant_phone')->nullable();
            $table->enum('status', ['draft', 'submitted', 'payment_pending', 'paid', 'under_review', 'approved', 'rejected', 'needs_information', 'enrolled'])->index();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
