<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGradingConfigRequest;
use App\Http\Requests\UpdateGradingConfigRequest;
use App\Http\Resources\GradingConfigResource;
use App\Models\GradingConfig;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class GradingConfigController extends Controller
{
    public function __construct(private readonly AuditLogService $audit) {}

    public function index(Request $request) { Gate::authorize('viewAny', GradingConfig::class); return GradingConfigResource::collection(GradingConfig::query()->when($request->has('program_id'), fn ($q) => $q->where('program_id', $request->input('program_id')))->orderBy('program_id')->orderBy('category')->paginate(min($request->integer('per_page', 20), 100))); }
    public function store(StoreGradingConfigRequest $request): JsonResponse
    {
        Gate::authorize('create', GradingConfig::class);
        $data = $request->validated();
        $config = DB::transaction(function () use ($data) {
            $this->assertTotal($data['program_id'] ?? null, null, $data['weight_percentage']);
            $config = GradingConfig::create($data);
            $this->audit->log('grading_config.created', $config, null, $this->audit->snapshot($config));
            return $config;
        });
        return (new GradingConfigResource($config))->response()->setStatusCode(201);
    }
    public function show(GradingConfig $gradingConfig): GradingConfigResource { Gate::authorize('view', $gradingConfig); return new GradingConfigResource($gradingConfig); }
    public function update(UpdateGradingConfigRequest $request, GradingConfig $gradingConfig): GradingConfigResource
    {
        Gate::authorize('update', $gradingConfig);
        $data = $request->validated();
        $before = $this->audit->snapshot($gradingConfig);
        DB::transaction(function () use ($data, $gradingConfig, $before) {
            $programId = array_key_exists('program_id', $data) ? $data['program_id'] : $gradingConfig->program_id;
            $this->assertTotal($programId, $gradingConfig->id, $data['weight_percentage'] ?? $gradingConfig->weight_percentage);
            $gradingConfig->update($data);
            $this->audit->log('grading_config.updated', $gradingConfig, $before, $this->audit->snapshot($gradingConfig));
        });
        return new GradingConfigResource($gradingConfig->refresh());
    }

    public function destroy(GradingConfig $gradingConfig): JsonResponse
    {
        Gate::authorize('delete', $gradingConfig);
        $before = $this->audit->snapshot($gradingConfig);
        DB::transaction(function () use ($gradingConfig, $before) {
            $gradingConfig->delete();
            $this->audit->log('grading_config.deleted', $gradingConfig, $before, null);
        });
        return response()->json(null, 204);
    }

    private function assertTotal(?int $programId, ?int $ignoreId, string|int|float $replacementWeight): void
    {
        $configs = GradingConfig::query()->where('program_id', $programId)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->get();
        $total = (float) $configs->sum('weight_percentage') + (float) $replacementWeight;
        if ($total > 100.0) {
            throw ValidationException::withMessages(['weight_percentage' => ['The grading configuration weights cannot exceed 100%.']]);
        }
        if ($configs->count() >= 2 && abs($total - 100.0) > 0.0001) {
            throw ValidationException::withMessages(['weight_percentage' => ['All three grading category weights must total exactly 100%.']]);
        }
    }
}
