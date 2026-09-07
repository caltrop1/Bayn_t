<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BulkAttendanceRequest;
use App\Http\Requests\StoreAttendanceRequest;
use App\Http\Requests\UpdateAttendanceRequest;
use App\Http\Resources\AttendanceRecordResource;
use App\Models\AttendanceRecord;
use App\Models\AuditLog;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\AttendanceService;
use App\Services\TeacherScopeService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AttendanceController extends Controller
{
    public function __construct(private readonly TeacherScopeService $scope, private readonly AttendanceService $service) {}

    public function index(Request $request)
    {
        Gate::authorize('viewAny', AttendanceRecord::class);
        $this->validateFilters($request);
        $query = $this->scope->attendance($request->user())->with(['student.user', 'schoolClass.program', 'markedBy']);
        $this->filters($query, $request);
        return AttendanceRecordResource::collection($query->latest('date')->latest('id')->paginate(min($request->integer('per_page', 20), 100)));
    }

    public function store(StoreAttendanceRequest $request): JsonResponse
    {
        Gate::authorize('create', AttendanceRecord::class);
        $data = $request->validated();
        $class = SchoolClass::findOrFail($data['class_id']);
        $student = Student::findOrFail($data['student_id']);
        Gate::authorize('manageAttendance', [$class]);
        if ($student->class_id !== $class->id) return response()->json(['message' => 'The student does not belong to this class.'], 422);

        try {
            $record = AttendanceRecord::create([...$data, 'marked_by' => $request->user()->id]);
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') return response()->json(['message' => 'Attendance already exists for this student, class, and date.'], 409);
            throw $e;
        }
        $record->load(['student.user', 'schoolClass.program', 'markedBy']);
        $this->audit('attendance.created', null, $record, $request->user()->id);
        return (new AttendanceRecordResource($record))->response()->setStatusCode(201);
    }

    public function show(AttendanceRecord $attendance): AttendanceRecordResource
    {
        $attendance->load(['student.user', 'schoolClass.program', 'markedBy']);
        Gate::authorize('view', $attendance);
        return new AttendanceRecordResource($attendance);
    }

    public function update(UpdateAttendanceRequest $request, AttendanceRecord $attendance): AttendanceRecordResource
    {
        $attendance->load(['student.user', 'schoolClass.program', 'markedBy']);
        Gate::authorize('update', $attendance);
        $before = $attendance->replicate();
        $attendance->update(['status' => $request->validated('status'), 'marked_by' => $request->user()->id]);
        $attendance->refresh()->load(['student.user', 'schoolClass.program', 'markedBy']);
        $this->audit('attendance.updated', $before, $attendance, $request->user()->id);
        return new AttendanceRecordResource($attendance);
    }

    public function destroy(Request $request, AttendanceRecord $attendance): JsonResponse
    {
        $attendance->load(['student.user', 'schoolClass.program', 'markedBy']);
        Gate::authorize('delete', $attendance);
        $before = $attendance->toArray();
        $id = $attendance->id;
        $attendance->delete();
        AuditLog::create(['actor_id' => $request->user()->id, 'action' => 'attendance.deleted', 'target_type' => AttendanceRecord::class, 'target_id' => $id, 'before_snapshot' => $before]);
        return response()->json(null, 204);
    }

    public function bulk(BulkAttendanceRequest $request, SchoolClass $class): JsonResponse
    {
        Gate::authorize('manageAttendance', $class);
        $data = $request->validated();
        $ids = collect($data['records'])->pluck('student_id');
        $valid = $class->students()->whereIn('id', $ids)->pluck('id');
        if ($valid->count() !== $ids->unique()->count()) return response()->json(['message' => 'Every student must belong to this class.'], 422);
        $records = $this->service->upsert($class, $data['records'], $data['date'], $request->user()->id);
        return response()->json(['data' => AttendanceRecordResource::collection(collect($records))->resolve(), 'date' => $data['date'], 'class_id' => $class->id]);
    }

    public function classAttendance(Request $request, SchoolClass $class): JsonResponse
    {
        Gate::authorize('view', $class);
        $date = $request->input('date', now()->toDateString());
        validator(['date' => $date], ['date' => 'date_format:Y-m-d'])->validate();
        $students = $class->students()->with('user')->with(['attendanceRecords' => fn ($q) => $q->whereDate('date', $date)->with('markedBy')])->get();
        return response()->json(['data' => ['class' => ['id' => $class->id, 'name' => $class->name], 'date' => $date, 'students' => $students->map(fn (Student $student) => ['student' => ['id' => $student->id, 'name' => $student->user?->name], 'attendance' => $student->attendanceRecords->first() ? (new AttendanceRecordResource($student->attendanceRecords->first()))->resolve($request) : null])]]);
    }

    public function studentAttendance(Request $request, Student $student)
    {
        Gate::authorize('view', $student);
        $this->validateFilters($request);
        $query = $student->attendanceRecords()->with(['schoolClass.program', 'markedBy']);
        $this->filters($query, $request);
        return AttendanceRecordResource::collection($query->latest('date')->paginate(min($request->integer('per_page', 50), 100)));
    }

    public function studentSummary(Request $request, Student $student): JsonResponse
    {
        Gate::authorize('view', $student);
        $from = $request->input('from'); $to = $request->input('to');
        validator(['from' => $from, 'to' => $to], ['from' => 'nullable|date_format:Y-m-d', 'to' => 'nullable|date_format:Y-m-d'])->validate();
        $records = $student->attendanceRecords()->when($from, fn ($q) => $q->whereDate('date', '>=', $from))->when($to, fn ($q) => $q->whereDate('date', '<=', $to))->get();
        $counts = collect(['present', 'absent', 'late', 'excused'])->mapWithKeys(fn ($status) => [$status => $records->filter(fn ($record) => $record->status?->value === $status)->count()]);
        $total = $records->count();
        return response()->json(['data' => ['student_id' => $student->id, 'from' => $from, 'to' => $to, 'total_days' => $total, ...$counts->all(), 'attendance_percentage' => $total ? round(($counts['present'] + $counts['late']) / $total * 100, 2) : 0]]);
    }

    private function filters($query, Request $request): void
    {
        $query->when($request->integer('class_id'), fn ($q, $v) => $q->where('class_id', $v))
            ->when($request->integer('student_id'), fn ($q, $v) => $q->where('student_id', $v))
            ->when($request->filled('date'), fn ($q) => $q->whereDate('date', $request->string('date')->value()))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('date', '>=', $request->string('from')->value()))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('date', '<=', $request->string('to')->value()))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->value()));
    }

    private function validateFilters(Request $request): void
    {
        validator($request->all(), [
            'date' => ['nullable', 'date_format:Y-m-d'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
            'status' => ['nullable', 'in:present,absent,late,excused'],
        ])->validate();
    }

    private function audit(string $action, ?AttendanceRecord $before, AttendanceRecord $after, int $actor): void
    {
        AuditLog::create(['actor_id' => $actor, 'action' => $action, 'target_type' => AttendanceRecord::class, 'target_id' => $after->id, 'before_snapshot' => $before?->toArray(), 'after_snapshot' => $after->toArray()]);
    }
}
