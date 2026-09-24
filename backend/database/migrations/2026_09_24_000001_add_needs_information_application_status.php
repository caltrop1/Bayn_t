<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const STATUSES = "'draft','submitted','payment_pending','paid','under_review','approved','rejected','needs_information','enrolled'";
    private const OLD_STATUSES = "'draft','submitted','payment_pending','paid','under_review','approved','rejected','enrolled'";

    public function up(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check');
            DB::statement('ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('.self::STATUSES.'))');
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE applications MODIFY status ENUM(".self::STATUSES.") NOT NULL");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check');
            DB::statement('ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('.self::OLD_STATUSES.'))');
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE applications MODIFY status ENUM(".self::OLD_STATUSES.") NOT NULL");
        }
    }
};
