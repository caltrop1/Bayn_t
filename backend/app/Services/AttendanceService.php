<?php

namespace App\Services;

use App\Models\AttendanceRecord;
use App\Models\SchoolClass;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    public function upsert(SchoolClass $class, array $records, string $date, int $markerId): array
    {
        return DB::transaction(function () use ($class, $records, $date, $markerId) {
            $studentIds = array_column($records, 'student_id');
            $existing = AttendanceRecord::query()
                ->where('class_id', $class->id)->where('date', $date)
                ->whereIn('student_id', $studentIds)->get()->keyBy('student_id');

            $rows = collect($records)->map(fn (array $record) => [
                'student_id' => $record['student_id'],
                'class_id' => $class->id,
                'date' => $date,
                'status' => $record['status'],
                'marked_by' => $markerId,
                'created_at' => now(),
                'updated_at' => now(),
            ])->all();

            AttendanceRecord::query()->upsert(
                $rows,
                ['student_id', 'class_id', 'date'],
                ['status', 'marked_by', 'updated_at']
            );

            $saved = AttendanceRecord::query()
                ->with(['student.user', 'schoolClass.program', 'markedBy'])
                ->where('class_id', $class->id)->where('date', $date)
                ->whereIn('student_id', $studentIds)->get()->keyBy('student_id');

            foreach ($saved as $record) {
                $before = $existing->get($record->student_id);
                app(AuditLogService::class)->log(
                    $before ? 'attendance.updated' : 'attendance.created',
                    $record,
                    app(AuditLogService::class)->snapshot($before),
                    app(AuditLogService::class)->snapshot($record),
                    $markerId,
                );
            }

            return $saved->sortBy(fn (AttendanceRecord $record) => array_search($record->student_id, $studentIds, true))->values()->all();
        });
    }
}
