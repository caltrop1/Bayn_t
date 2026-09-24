<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProgramRequest;
use App\Http\Requests\UpdateProgramRequest;
use App\Http\Resources\ProgramResource;
use App\Models\Program;
use App\Models\Intake;
use App\Enums\IntakeStatus;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ProgramController extends Controller
{
    public function publicIndex(Request $request)
    {
        $programs = Program::query()
            ->where('status', 'open')
            ->when($request->input('category'), fn ($query, $value) => $query->where('category', $value))
            ->when($request->input('level'), fn ($query, $value) => $query->where('level', $value))
            ->when($request->input('search'), fn ($query, $value) => $query->where('name', 'like', '%'.$value.'%'))
            ->orderByDesc('created_at')
            ->paginate(min($request->integer('per_page', 20), 100));

        return ProgramResource::collection($programs);
    }

    public function publicShow(Program $program): ProgramResource
    {
        abort_unless($program->status?->value === 'open', 404);

        return new ProgramResource($program->load([
            'intakes' => fn ($query) => $query->whereIn('status', [IntakeStatus::Open->value, IntakeStatus::Upcoming->value])->orderBy('start_date'),
            'classes',
            'teachers',
        ]));
    }

    public function index(Request $request)
    {
        Gate::authorize('viewAny', Program::class);

        $programs = Program::query()
            ->with('intakes')
            ->when($request->input('status'), fn ($query, $value) => $query->where('status', $value))
            ->when($request->input('category'), fn ($query, $value) => $query->where('category', $value))
            ->when($request->input('level'), fn ($query, $value) => $query->where('level', $value))
            ->when($request->input('search'), fn ($query, $value) => $query->where('name', 'like', '%'.$value.'%'))
            ->orderByDesc('created_at')
            ->paginate(min($request->integer('per_page', 20), 100));

        return ProgramResource::collection($programs);
    }

    public function store(StoreProgramRequest $request)
    {
        Gate::authorize('create', Program::class);

        $validated = $request->validated();
        $months = $validated['intake_months'];
        unset($validated['intake_months']);

        $program = DB::transaction(function () use ($validated, $months): Program {
            $program = Program::create($validated);
            $this->syncIntakes($program, $months);
            return $program->load('intakes');
        });

        return (new ProgramResource($program))->response()->setStatusCode(201);
    }

    public function show(Program $program): ProgramResource
    {
        Gate::authorize('view', $program);

        return new ProgramResource($program);
    }

    public function update(UpdateProgramRequest $request, Program $program): ProgramResource
    {
        Gate::authorize('update', $program);

        $validated = $request->validated();
        $months = $validated['intake_months'] ?? null;
        unset($validated['intake_months']);

        DB::transaction(function () use ($program, $validated, $months): void {
            $program->update($validated);
            if ($months !== null) {
                $this->syncIntakes($program, $months);
            }
        });

        return new ProgramResource($program->refresh()->load('intakes'));
    }

    private function syncIntakes(Program $program, array $months): void
    {
        $months = array_values(array_unique($months));
        $selected = collect($months)->mapWithKeys(function (string $month): array {
            $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
            return [$month => $start];
        });

        foreach ($selected as $month => $start) {
            Intake::updateOrCreate(
                ['program_id' => $program->id, 'name' => $start->format('F Y')],
                [
                    'start_date' => $start->toDateString(),
                    'end_date' => $start->copy()->endOfMonth()->toDateString(),
                    'status' => $start->isCurrentMonth() ? IntakeStatus::Open : IntakeStatus::Upcoming,
                ],
            );
        }

        $program->intakes()->whereNotIn('name', $selected->map(fn ($start) => $start->format('F Y'))->all())
            ->get()->each(function (Intake $intake): void {
                if ($intake->classes()->exists() || $intake->program()->exists() && $intake->applications()->exists()) {
                    $intake->update(['status' => IntakeStatus::Closed]);
                } else {
                    $intake->delete();
                }
            });
    }

    public function destroy(Program $program): JsonResponse
    {
        Gate::authorize('delete', $program);

        try {
            $program->delete();
        } catch (QueryException) {
            return response()->json(['message' => 'The program cannot be deleted while it has related records.'], 409);
        }

        return response()->json(null, 204);
    }
}
