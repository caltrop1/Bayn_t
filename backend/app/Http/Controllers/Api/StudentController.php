<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use Illuminate\Support\Facades\Gate;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function me(Request $request): StudentResource
    {
        return new StudentResource($request->user()->student?->load([
            'user', 'application.program', 'application.intake', 'schoolClass.program', 'schoolClass.intake',
            'documents', 'payments',
        ]) ?? abort(404, 'No student record exists for this account.'));
    }

    public function show(Student $student): StudentResource
    {
        Gate::authorize('view', $student);
        return new StudentResource($student->load(['user', 'schoolClass.program', 'schoolClass.intake']));
    }
}
