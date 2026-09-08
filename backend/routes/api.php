<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AssessmentScoreController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\IntakeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\RegistrarController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\GradingConfigController;
use App\Http\Controllers\Api\AuditLogController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --------------------------------------------------------------------------
// Authentication
// --------------------------------------------------------------------------

// Public Auth Endpoints
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::get('/google/redirect', [AuthController::class, 'googleRedirect']);
    Route::get('/google/callback', [AuthController::class, 'googleCallback']);
});

// Protected Auth Endpoints (Requires Sanctum Bearer Token)
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
});

Route::middleware('auth:sanctum')->prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('/unread', [NotificationController::class, 'unread']);
    Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::post('/{notification}/read', [NotificationController::class, 'markAsRead']);
});

Route::middleware(['auth:sanctum', 'role:student'])->prefix('applications')->group(function () {
    Route::post('/', [ApplicationController::class, 'store']);
    Route::get('/', [ApplicationController::class, 'index']);
    Route::get('/{application}', [ApplicationController::class, 'show']);
    Route::patch('/{application}/steps/{step}', [ApplicationController::class, 'updateStep'])
        ->where('step', '[A-Za-z0-9_-]+');
    Route::post('/{application}/documents', [DocumentController::class, 'storeForApplication']);
    Route::get('/{application}/documents', [ApplicationController::class, 'documents']);
    Route::post('/{application}/submit', [ApplicationController::class, 'submit']);
});

Route::middleware(['auth:sanctum', 'role:student'])->prefix('student')->group(function () {
    Route::get('/me', [StudentController::class, 'me']);
});

// --------------------------------------------------------------------------
// Core CRUD APIs
// --------------------------------------------------------------------------

Route::middleware(['auth:sanctum', 'role:super_admin,registrar,student'])->group(function () {
    Route::apiResources([
        'programs' => ProgramController::class,
        'intakes' => IntakeController::class,
    ]);
});


Route::middleware(['auth:sanctum', 'role:super_admin,registrar,teacher'])
    ->apiResource('classes', ClassController::class);

Route::middleware(['auth:sanctum', 'role:super_admin,registrar,teacher,student'])
    ->group(function () {
        Route::get('/students/{student}', [StudentController::class, 'show']);
        Route::get('/students/{student}/attendance', [AttendanceController::class, 'studentAttendance']);
        Route::get('/students/{student}/attendance/summary', [AttendanceController::class, 'studentSummary']);
        Route::get('/classes/{class}/attendance', [AttendanceController::class, 'classAttendance']);
        Route::post('/classes/{class}/attendance', [AttendanceController::class, 'bulk']);
    });

Route::middleware(['auth:sanctum', 'role:super_admin,registrar,teacher,student'])
    ->prefix('attendance')->group(function () {
        Route::get('/', [AttendanceController::class, 'index']);
        Route::post('/', [AttendanceController::class, 'store'])->middleware('role:super_admin,registrar,teacher');
        Route::get('/{attendance}', [AttendanceController::class, 'show']);
        Route::match(['put', 'patch'], '/{attendance}', [AttendanceController::class, 'update'])->middleware('role:super_admin,registrar,teacher');
        Route::delete('/{attendance}', [AttendanceController::class, 'destroy'])->middleware('role:super_admin,registrar,teacher');
    });

Route::middleware(['auth:sanctum', 'role:super_admin'])
    ->apiResource('users', UserController::class);

Route::middleware(['auth:sanctum', 'role:super_admin,registrar,teacher,student'])
    ->prefix('documents')
    ->group(function () {
        Route::post('/', [DocumentController::class, 'store']);
        Route::get('/{document}/temporary-url', [DocumentController::class, 'temporaryUrl']);
    });

Route::middleware(['auth:sanctum', 'role:super_admin,registrar'])->group(function () {
    Route::apiResource('grading-configs', GradingConfigController::class);
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::get('/audit-logs/{auditLog}', [AuditLogController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'role:super_admin,registrar,teacher,student'])
    ->prefix('assessments')
    ->group(function () {
        Route::get('/', [AssessmentScoreController::class, 'index']);
        Route::post('/', [AssessmentScoreController::class, 'store'])->middleware('role:super_admin,registrar,teacher');
        Route::get('/{assessment}', [AssessmentScoreController::class, 'show']);
        Route::match(['put', 'patch'], '/{assessment}', [AssessmentScoreController::class, 'update'])->middleware('role:super_admin,registrar,teacher');
        Route::delete('/{assessment}', [AssessmentScoreController::class, 'destroy'])->middleware('role:super_admin,registrar,teacher');
    });

Route::middleware(['auth:sanctum', 'role:super_admin,registrar,teacher,student'])->group(function () {
    Route::get('/classes/{class}/assessments', [AssessmentScoreController::class, 'classAssessments']);
    Route::get('/students/{student}/assessments', [AssessmentScoreController::class, 'studentAssessments']);
});

Route::get('/documents/{document}/download', [DocumentController::class, 'download'])
    ->middleware('signed')
    ->name('documents.download');

// --------------------------------------------------------------------------
// Role-Gated Routes
// --------------------------------------------------------------------------

// Super Admin
Route::middleware(['auth:sanctum', 'role:super_admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/dashboard', function () {
            return response()->json([
                'message' => 'Welcome Super Admin',
            ]);
        });
    });

// Super Admin + Registrar
Route::middleware(['auth:sanctum', 'role:super_admin,registrar'])
    ->prefix('registrar')
    ->group(function () {
        Route::get('/dashboard', [RegistrarController::class, 'dashboard']);
        Route::get('/applications', [RegistrarController::class, 'applications']);
        Route::get('/applications/{application}', [RegistrarController::class, 'showApplication']);
        Route::patch('/applications/{application}', [RegistrarController::class, 'review']);
        Route::get('/applications/{application}/documents', [RegistrarController::class, 'documents']);
        Route::post('/applications/{application}/enroll', [RegistrarController::class, 'enroll']);
        Route::get('/documents/{document}/temporary-url', [RegistrarController::class, 'documentUrl']);
        Route::get('/payments', [RegistrarController::class, 'payments']);
        Route::get('/payments/{payment}', [RegistrarController::class, 'showPayment']);
        Route::post('/payments/{payment}/verify', [RegistrarController::class, 'verifyPayment']);
        Route::get('/students', [RegistrarController::class, 'students']);
        Route::get('/students/{student}', [RegistrarController::class, 'showStudent']);
        Route::patch('/students/{student}/status', [RegistrarController::class, 'updateStudentStatus']);
        Route::get('/classes', [RegistrarController::class, 'classes']);
        Route::get('/search', [RegistrarController::class, 'search']);
    });

// Super Admin + Teacher
Route::middleware(['auth:sanctum', 'role:super_admin,teacher'])
    ->prefix('teacher')
    ->group(function () {
        Route::get('/dashboard', [TeacherController::class, 'dashboard']);
        Route::get('/classes', [TeacherController::class, 'classes']);
        Route::get('/students', [TeacherController::class, 'students']);
        Route::get('/attendance', [AttendanceController::class, 'index']);
        Route::get('/assessments', [AssessmentScoreController::class, 'index']);
    });

// Student
Route::middleware(['auth:sanctum', 'role:student'])
    ->prefix('student')
    ->group(function () {
        Route::get('/dashboard', function () {
            return response()->json([
                'message' => 'Welcome Student',
            ]);
        });
    });
