<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClassResource;
use App\Http\Resources\TeacherStudentResource;
use App\Models\AssessmentScore;
use App\Models\AttendanceRecord;
use App\Services\TeacherScopeService;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    public function __construct(private readonly TeacherScopeService $scope) {}

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $classes = $this->scope->classes($user);
        $classIds = (clone $classes)->pluck('id');
        return response()->json(['data' => [
            'classes_count' => $classIds->count(),
            'student_count' => $this->scope->students($user)->distinct('students.id')->count('students.id'),
            'recent_attendance' => $this->scope->attendance($user)->with(['student.user', 'schoolClass'])->latest()->limit(5)->get()->map(fn ($record) => [
                'id' => $record->id, 'student_id' => $record->student_id, 'student_name' => $record->student?->user?->name,
                'class_id' => $record->class_id, 'class_name' => $record->schoolClass?->name, 'date' => $record->date?->toDateString(), 'status' => $record->status?->value,
            ]),
            'recent_assessment_count' => $this->scope->assessments($user)->whereIn('class_id', $classIds)->latest()->count(),
        ]]);
    }

    public function classes(Request $request)
    {
        $classes = $this->scope->classes($request->user())->with(['program', 'intake', 'teacher'])->withCount('students')->latest()->paginate(min($request->integer('per_page', 20), 100));
        return ClassResource::collection($classes);
    }

    public function students(Request $request)
    {
        $students = $this->scope->students($request->user())->with(['user', 'schoolClass'])
            ->when($request->integer('class_id'), fn ($q, $v) => $q->where('class_id', $v))
            ->when($request->integer('program_id'), fn ($q, $v) => $q->whereHas('schoolClass', fn ($class) => $class->where('program_id', $v)))
            ->when($request->integer('intake_id'), fn ($q, $v) => $q->whereHas('schoolClass', fn ($class) => $class->where('intake_id', $v)))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->value()))
            ->when($request->filled('search'), fn ($q) => $q->whereHas('user', fn ($user) => $user->where('name', 'like', '%'.$request->string('search')->value().'%')))
            ->latest()->paginate(min($request->integer('per_page', 20), 100));
        return TeacherStudentResource::collection($students);
    }
}
