<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssessmentScoreRequest;
use App\Http\Requests\UpdateAssessmentScoreRequest;
use App\Http\Resources\AssessmentScoreResource;
use App\Models\AssessmentScore;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\AssessmentService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AssessmentScoreController extends Controller
{
    public function __construct(private readonly AssessmentService $assessmentService) {}

    public function index(Request $request)
    {
        Gate::authorize('viewAny', AssessmentScore::class);

        $query = AssessmentScore::query()->with(['student.user', 'schoolClass.program', 'gradedBy']);
        $user = $request->user();

        if ($user->isTeacher()) {
            $query->whereHas('schoolClass', fn ($q) => $q->where('teacher_id', $user->id));
        } elseif ($user->isStudent()) {
            $query->whereHas('student', fn ($q) => $q->where('user_id', $user->id));
        }

        $scores = $query
            ->when($request->integer('class_id'), fn ($q, $v) => $q->where('class_id', $v))
            ->when($request->integer('student_id'), fn ($q, $v) => $q->where('student_id', $v))
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->string('category')->value()))
            ->when($request->integer('program_id'), fn ($q, $v) => $q->whereHas('schoolClass', fn ($class) => $class->where('program_id', $v)))
            ->when($request->integer('intake_id'), fn ($q, $v) => $q->whereHas('schoolClass', fn ($class) => $class->where('intake_id', $v)))
            ->latest()
            ->paginate(min($request->integer('per_page', 20), 100));

        return AssessmentScoreResource::collection($scores);
    }

    public function store(StoreAssessmentScoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        $class = SchoolClass::findOrFail($data['class_id']);
        $student = Student::findOrFail($data['student_id']);
        Gate::authorize('create', [AssessmentScore::class, $class, $student]);

        try {
            $score = $this->assessmentService->create($data, $class, $request->user()->id);
        } catch (QueryException $exception) {
            if ($exception->getCode() === '23000') {
                return response()->json(['message' => 'An assessment already exists for this student, class, and category.'], 409);
            }
            throw $exception;
        }

        return (new AssessmentScoreResource($score))->response()->setStatusCode(201);
    }

    public function show(AssessmentScore $assessment): AssessmentScoreResource
    {
        $assessment->load(['student.user', 'schoolClass.program', 'gradedBy']);
        Gate::authorize('view', $assessment);

        return new AssessmentScoreResource($assessment);
    }

    public function update(UpdateAssessmentScoreRequest $request, AssessmentScore $assessment): AssessmentScoreResource|JsonResponse
    {
        Gate::authorize('update', $assessment);
        try {
            $score = $this->assessmentService->update($assessment, $request->validated());
        } catch (QueryException $exception) {
            if ($exception->getCode() === '23000') {
                return response()->json(['message' => 'An assessment already exists for this student, class, and category.'], 409);
            }
            throw $exception;
        }

        return new AssessmentScoreResource($score);
    }

    public function destroy(AssessmentScore $assessment): JsonResponse
    {
        Gate::authorize('delete', $assessment);
        $assessment->load(['student.user', 'schoolClass.program', 'gradedBy']);
        $audit = app(\App\Services\AuditLogService::class);
        $before = $audit->snapshot($assessment);
        \Illuminate\Support\Facades\DB::transaction(function () use ($assessment, $audit, $before) {
            $assessment->delete();
            $audit->log('assessment.deleted', $assessment, $before, null);
        });

        return response()->json(null, 204);
    }

    public function classAssessments(Request $request, SchoolClass $class)
    {
        Gate::authorize('view', $class);

        $students = $class->students()
            ->with(['user', 'assessmentScores' => fn ($q) => $q->with('gradedBy')->when($request->filled('category'), fn ($query) => $query->where('category', $request->string('category')->value()))])
            ->paginate(min($request->integer('per_page', 50), 100));

        $students->getCollection()->transform(function (Student $student) {
            $byCategory = $student->assessmentScores->keyBy(fn (AssessmentScore $score) => $score->category->value);
            return [
                'student' => ['id' => $student->id, 'name' => $student->user?->name, 'user_id' => $student->user_id],
                'assessments' => AssessmentScoreResource::collection($student->assessmentScores)->resolve(),
                'total_raw_score' => round((float) $student->assessmentScores->sum('raw_score'), 2),
                'total_weighted_score' => round((float) $student->assessmentScores->sum('weighted_score'), 2),
                'categories' => collect(['practical', 'theory', 'professional'])->mapWithKeys(fn ($category) => [$category => $byCategory->get($category)?->raw_score])->all(),
            ];
        });

        return response()->json($students);
    }

    public function studentAssessments(Request $request, Student $student)
    {
        Gate::authorize('view', $student);
        $student->load(['user', 'schoolClass.program']);
        $scores = $student->assessmentScores()->with(['schoolClass.program', 'gradedBy'])
            ->when($request->integer('class_id'), fn ($q, $v) => $q->where('class_id', $v))
            ->latest()->get();

        return response()->json([
            'data' => [
                'student' => ['id' => $student->id, 'name' => $student->user?->name],
                'class' => $student->schoolClass?->only(['id', 'name', 'program_id']),
                'assessments' => AssessmentScoreResource::collection($scores),
                'total_raw_score' => round((float) $scores->sum('raw_score'), 2),
                'total_weighted_score' => round((float) $scores->sum('weighted_score'), 2),
            ],
        ]);
    }

}
