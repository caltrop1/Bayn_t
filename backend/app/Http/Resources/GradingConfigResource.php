<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GradingConfigResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'program_id' => $this->program_id, 'category' => $this->category?->value, 'weight_percentage' => $this->weight_percentage, 'created_at' => $this->created_at, 'updated_at' => $this->updated_at];
    }
}
