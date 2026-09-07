# Backend API Documentation

This is the current, code-level reference for the Laravel backend API used by the frontend team. It describes behavior implemented in this repository, not a proposed API contract.

- Technology: PHP 8.3+, Laravel ^13.17 (Laravel 13), Sanctum 4, Socialite 5.
- Authentication: Laravel Sanctum personal access tokens sent as Bearer tokens.
- Architecture: JSON REST-style endpoints under /api, Form Requests, API Resources, policies, and role middleware.
- Current status: implemented in routes/api.php. There is no /v1 or other API version prefix.
- Intended use: students use authentication, application, document, and notification APIs; staff use administration, registrar, program, intake, class, payment, student, and document APIs.
- Frontend CORS: configure CORS_ALLOWED_ORIGINS, or FRONTEND_URL, as a comma-separated list of frontend origins.

## Base URL and request conventions

The configured local base URL is:

~~~text
http://localhost:8000/api
~~~

APP_URL and deployment configuration may change the host. The API prefix is /api and no version prefix is implemented.

JSON endpoints accept and return application/json. File uploads use multipart/form-data. Query-string filters are used by list endpoints and route IDs are path parameters.

Authenticated requests use:

~~~http
Authorization: Bearer <sanctum-token>
Accept: application/json
Content-Type: application/json
~~~

Do not send Content-Type: application/json for multipart uploads; let the client set the multipart boundary.

Successful resource responses generally use { "data": {} }. Paginated resource collections also contain Laravel links and meta fields. Validation responses use message and errors.

## HTTP status codes

| Status | Meaning in this API |
|---|---|
| 200 | Successful read, update, or action. |
| 201 | Successful creation. |
| 204 | Successful deletion of a program, intake, class, or user. |
| 401 | Missing, invalid, or expired authentication. |
| 403 | Inactive user, wrong role, or failed policy check. |
| 404 | Missing route-bound resource or intentionally hidden notification. |
| 409 | Invalid business transition, full class, duplicate enrollment, payment requirement, or protected deletion. |
| 422 | Form validation failure, invalid Google callback, password-reset failure, or empty search query. |
| 500 | Unexpected framework/application failure; no custom envelope is defined. |

Example validation error:

~~~json
{
  "message": "The email field is required.",
  "errors": {
    "email": ["The email field is required."]
  }
}
~~~

Example role error:

~~~json
{"message": "Unauthorized. You do not have permission to perform this action."}
~~~

Example conflict:

~~~json
{"message": "Only draft applications can be submitted."}
~~~

## Authentication

### Login

POST /api/auth/login is public. JSON fields email and password are required; device_name is optional. Invalid credentials return 422 with an email error. Inactive accounts return 403.

Successful response (200):

~~~json
{
  "message": "Login successful",
  "access_token": "1|...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "Student",
    "email": "student@example.com",
    "role": "student",
    "role_label": "Student",
    "phone": null,
    "is_active": true,
    "created_at": "2026-09-04T00:00:00.000000Z"
  }
}
~~~

The token is created with the user role as its Sanctum ability.

### Logout

POST /api/auth/logout requires authentication. It deletes the current access token and returns 200 with:

~~~json
{"message": "Successfully logged out."}
~~~

### Current user

GET /api/auth/me requires authentication and returns a user object containing id, name, email, role, role_label, phone, is_active, staff_profile, and created_at.

### Refresh token

POST /api/auth/refresh requires authentication. It revokes the current token and creates a replacement. Optional field: device_name.

~~~json
{
  "message": "Token refreshed successfully",
  "access_token": "2|...",
  "token_type": "Bearer"
}
~~~

### Google authentication

GET /api/auth/google/redirect and GET /api/auth/google/callback are public. The redirect delegates to Socialite’s Google driver.

The callback returns 422 for cancellation, missing Google email, or callback failure. It finds users by google_id and then email. Existing active users are updated with Google identity/name information. A new user is created with role student, active status, and verified email. It then issues a Sanctum token. device_name is optional and defaults to google_auth.

Inactive existing users receive 403. Success returns access_token, token_type, user, and message: Google authentication successful.

There is no separate registration endpoint. New Google users are the only self-service account creation path implemented.

## Password reset

### Forgot password

POST /api/auth/forgot-password is public. JSON field email is required and must be a valid email. It uses Laravel’s password broker. Success returns 200 with the localized broker message; broker failure returns 422 with an email error.

### Reset password

POST /api/auth/reset-password is public. Required JSON fields are email, token, password, and password_confirmation. Passwords must be at least eight characters and confirmed. Success revokes all Sanctum tokens and returns the localized broker message. Invalid tokens return 422.

## Sanctum behavior

config/sanctum.php sets SANCTUM_EXPIRATION to 60 minutes by default. The environment can override it. Tokens are personal access tokens sent in the Authorization header and are revoked on logout, refresh, and password reset. Invalid or expired tokens return 401.

## RBAC and roles

Roles are super_admin, registrar, teacher, and student.

| Area | super_admin | registrar | teacher | student |
|---|---:|---:|---:|---:|
| Admin dashboard | Yes | No | No | No |
| Programs/intakes read | Yes | Yes | No | Yes |
| Programs/intakes mutations | Yes | Yes | No | No |
| Classes API | Policy-controlled | Policy-controlled | Read assigned | No |
| Users CRUD | Yes | No | No | No |
| Application submission APIs | No | No | No | Yes |
| Generic document upload | Yes | Yes | Yes | Own resource |
| Notifications | Own | Own | Own | Own |
| Registrar workflow | Yes | Yes | No | No |
| Teacher dashboard | Yes | No | Yes | No |
| Student dashboard | No | No | No | Yes |

All protected routes require Sanctum. The role middleware rejects inactive users with 403 and wrong roles with 403. Policies enforce resource ownership and staff permissions.

## Application submission API

All routes below require Sanctum and role student.

### Create a draft

POST /api/applications

Optional JSON fields:

| Field | Rules |
|---|---|
| program_id | Nullable integer; must exist when supplied. |
| intake_id | Nullable integer; must exist and belong to program_id when both are supplied. |
| applicant_name | Nullable string, maximum 255 characters. |
| applicant_phone | Nullable string, maximum 50 characters. |

The applicant email is always taken from the authenticated user. The server sets status to draft and generates a reference in the form APP-YYYY-000001. Success returns 201 and an ApplicationResource.

### List my applications

GET /api/applications returns a paginated list containing only applications owned by the authenticated student. It accepts per_page (maximum 100) and includes program, intake, and documents. Use this endpoint to discover drafts across devices.

### Resume/view

GET /api/applications/{application} returns the authenticated student’s own application with program, intake, documents, and payments. Another student receives 403.

### Save a step

PATCH /api/applications/{application}/steps/{step}

Accepted fields are the existing application fields:

~~~json
{
  "applicant_name": "Student Name",
  "applicant_phone": "+251900000000",
  "program_id": 5,
  "intake_id": 3
}
~~~

Each supplied field is independently validated; incomplete drafts are allowed. The intake/program relationship is checked. status, applicant_email, reference number, review fields, and submitted_at cannot be changed. Repeated identical requests are safe ordinary updates and create no related records.

Only drafts can be updated. Submitted applications are rejected by authorization.

The step path value is accepted as an identifier but is not interpreted by the controller.

### Upload an application document

POST /api/applications/{application}/documents uses multipart/form-data.

| Field | Rules |
|---|---|
| type | id_photo, registration_doc, receipt, certificate, or other. |
| file | PDF, JPEG, PNG, DOC, or DOCX; maximum 10,240 KB. |

The existing private_documents disk stores files under applications/{id} with UUID filenames. The response contains document metadata only, not the private storage path. Only owned draft applications may use this endpoint. Success returns 201.

The current schema permits multiple documents of the same type; this endpoint does not replace previous documents.

## Assessment / marks API

Assessment endpoints require a Sanctum bearer token. Teachers may read and manage scores only for classes where they are the assigned teacher. Registrars and super admins may read and correct scores across classes; students may read only their own scores. Students cannot create, update, or delete scores.

### Assessment routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/assessments` | List scores with `class_id`, `student_id`, `category`, `program_id`, `intake_id`, and `per_page` filters. |
| POST | `/api/assessments` | Create a score. |
| GET | `/api/assessments/{assessment}` | View one score. |
| PUT/PATCH | `/api/assessments/{assessment}` | Correct `raw_score`, `sub_items`, or `category`. Student, class, and grader are immutable. |
| DELETE | `/api/assessments/{assessment}` | Delete/correct a score when authorized. |
| GET | `/api/classes/{class}/assessments` | Paginated class grading screen rows. |
| GET | `/api/students/{student}/assessments` | Student performance summary and scores. |

Create requests require `student_id`, `class_id`, `category` (`practical`, `theory`, or `professional`), and non-negative numeric `raw_score`. `sub_items` is an optional object/array of non-negative numeric values. The student must belong to the submitted class. `graded_by` is always taken from the authenticated user.

There is one score per student, class, and category. Duplicate creates and category changes that collide with an existing score return `409`. Scores are weighted using the matching program-specific `grading_configs` row, falling back to the global row (`program_id = null`); when no configuration exists, `weighted_score` is null. The calculation is `raw_score * weight_percentage / 100`, rounded to two decimal places. `raw_score` remains authoritative; sub-items are stored but are not automatically summed.

Successful resource responses use the normal `{ "data": ... }` Laravel resource envelope. Validation errors return `422`, unauthorized access returns `403`, unauthenticated requests return `401`, duplicate conflicts return `409`, and deletion returns `204`. Assessment create/update/delete operations are recorded in `audit_logs` with actor, action, target, and before/after snapshots.

Typical teacher workflow: call `GET /api/classes`, select an assigned class, call `GET /api/classes/{class}/assessments`, then POST or PATCH each score. Registrar users can use the filters on `GET /api/assessments` and the student performance endpoint for review.

### List application documents

GET /api/applications/{application}/documents returns 200 with a data array of DocumentResource metadata:

~~~json
{
  "data": [
    {
      "id": 10,
      "application_id": 123,
      "student_id": null,
      "type": "id_photo",
      "uploaded_at": "2026-09-04T19:00:00.000000Z",
      "created_at": "2026-09-04T19:00:00.000000Z",
      "updated_at": "2026-09-04T19:00:00.000000Z"
    }
  ]
}
~~~

### Submit

POST /api/applications/{application}/submit has an empty request body. The server locks the row in a transaction and checks program_id, intake_id, applicant_name, authenticated applicant_email, applicant_phone, an associated id_photo, and that the intake belongs to the selected program.

Failures return 422 with field-specific errors and leave the application as draft. Success returns 200, changes draft to submitted, sets submitted_at, creates an audit row, and dispatches ApplicationSubmitted. The existing notification listener then notifies the applicant and active registrar/super-admin users.

The only transition introduced by this workflow is draft -> submitted. A later submission returns 409. Draft updates and nested document uploads are not allowed after submission. No payment is required by this endpoint; payment checks occur later in registrar approval/enrollment.

### Application response

ApplicationResource contains id, reference_number, applicant_name, applicant_email, applicant_phone, status, rejection_reason, submitted_at, and conditionally loaded program, intake, payments, documents, student, created_at, and updated_at. Passwords, tokens, and private file paths are not exposed.

## Generic document API

POST /api/documents requires any role super_admin, registrar, teacher, or student. Multipart fields are exactly one of application_id or student_id, type, and file. Types and file restrictions are the same as the nested upload. Policy ownership is checked and success returns 201.

GET /api/documents/{document}/temporary-url requires an authenticated authorized user and returns a signed URL valid for 15 minutes plus expires_at.

GET /api/documents/{document}/download uses signed-route middleware and does not itself require Sanctum. Use the signed URL returned by the temporary URL endpoint. Missing files return 404.

The legacy generic application upload method does not explicitly reject submitted applications, unlike the nested application upload endpoint.

## Programs

All program routes require Sanctum and role super_admin or registrar, with policy checks.

| Method | Path | Behavior |
|---|---|---|
| GET | /api/programs | Paginated list; filters status, category, level, search, per_page (max 100). |
| POST | /api/programs | Create; required name, slug, category, level, status, tuition_fee, fee_currency, duration_weeks; optional description. |
| GET | /api/programs/{program} | Show program. |
| PUT/PATCH | /api/programs/{program} | Partial validated update. |
| DELETE | /api/programs/{program} | Super admin only; 204 or 409 when related. |

Statuses: draft, open, closed, archived.

## Intakes

All intake routes require Sanctum and role super_admin or registrar.

| Method | Path | Behavior |
|---|---|---|
| GET | /api/intakes | Paginated list; filters program_id, status, per_page (max 100). |
| POST | /api/intakes | Create; required program_id, name, start_date, end_date, status. |
| GET | /api/intakes/{intake} | Show intake and program. |
| PUT/PATCH | /api/intakes/{intake} | Partial validated update. |
| DELETE | /api/intakes/{intake} | Super admin only; 204 or 409 when related. |

Statuses: upcoming, open, closed, completed. Dates must be valid and end_date must be on or after start_date.

## Classes

All class routes require Sanctum and one of super_admin, registrar, or teacher. Mutations are limited by policy to super_admin/registrar; teachers can view assigned classes.

| Method | Path | Behavior |
|---|---|---|
| GET | /api/classes | Paginated list; filters program_id, intake_id, teacher_id, per_page (max 100). |
| POST | /api/classes | Create; required program_id, intake_id, name, capacity, schedule; nullable teacher_id. |
| GET | /api/classes/{class} | Show class. |
| PUT/PATCH | /api/classes/{class} | Update. |
| DELETE | /api/classes/{class} | Delete; 204 or 409 when related. |

## Users

All user routes require Sanctum and super_admin.

| Method | Path | Behavior |
|---|---|---|
| GET | /api/users | Paginated list; filters role, is_active, search, per_page (max 100). |
| POST | /api/users | Create with name, email, password, role; optional phone/is_active. |
| GET | /api/users/{user} | Show permitted user. |
| PUT/PATCH | /api/users/{user} | Update permitted user. |
| DELETE | /api/users/{user} | Delete another user; 204 or 409 for dependencies. |

UserResource excludes password and remember_token. Valid roles are super_admin, registrar, teacher, and student.

## Attendance API

Attendance requires a Sanctum bearer token. Valid statuses are `present`, `absent`, `late`, and `excused`. There is one record per student, class, and date; the existing database unique constraint prevents duplicates.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/attendance` | Paginated records. Supports `class_id`, `student_id`, `date`, `from`, `to`, `status`, and `per_page`. |
| POST | `/api/attendance` | Create one record with `student_id`, `class_id`, `date` (`YYYY-MM-DD`), and `status`. `marked_by` is always the authenticated user. |
| GET | `/api/attendance/{attendance}` | View one authorized record. |
| PUT/PATCH | `/api/attendance/{attendance}` | Correct `status`; the record's class is checked server-side. |
| DELETE | `/api/attendance/{attendance}` | Delete an authorized record. |
| GET | `/api/classes/{class}/attendance` | Class attendance screen for `date`, including every class student and that day's record. |
| POST | `/api/classes/{class}/attendance` | Bulk upsert. Body: `{ "date": "2026-09-07", "records": [{"student_id": 1, "status": "present"}] }`. All students are validated before the transaction; partial writes are not possible. |
| GET | `/api/students/{student}/attendance` | Authorized student records with the same date filters. |
| GET | `/api/students/{student}/attendance/summary` | Counts and percentage; accepts optional `from` and `to`. Present and late count toward the percentage. |

Attendance creates, corrections, and deletions write audit log entries with before/after snapshots. Bulk submissions update existing rows safely and audit each changed row. No attendance notification is generated because the current notification workflow has no attendance event.

## Teacher API

The existing backend represents teacher assignment with `classes.teacher_id`; that relationship is the authorization source for teacher-scoped class, student, attendance, and assessment access. The `program_teacher` relationship is not used to grant access to a class that is assigned to another teacher.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/auth/me` | Current authenticated user and profile. |
| GET | `/api/teacher/dashboard` | Assigned class/student counts and recent attendance/assessment activity. |
| GET | `/api/teacher/classes` | Only the authenticated teacher's classes. |
| GET | `/api/teacher/students` | Only students in the teacher's classes. Supports `class_id`, `program_id`, `intake_id`, `status`, `search`, and `per_page`. |
| GET | `/api/teacher/attendance` | Attendance automatically scoped to the authenticated teacher; supports attendance filters. |
| GET | `/api/teacher/assessments` | Assessments automatically scoped to the authenticated teacher. |

Teacher identity is always derived from the authenticated Sanctum user. Client-supplied `teacher_id` values are never used to establish authorization. Generic class, student, attendance, and assessment resource endpoints also authorize the individual object, preventing IDOR access to another teacher's records.

Admin user creation hashes and persists the password; the password remains hidden from UserResource. A null password in a partial update is ignored.

## Registrar API

All routes require Sanctum and role super_admin or registrar.

| Method | Path | Purpose |
|---|---|---|
| GET | /api/registrar/dashboard | Application, payment, student, intake, and class-capacity counts. |
| GET | /api/registrar/applications | Paginated applications; status/program/intake/reference/date/search/sort filters. |
| GET | /api/registrar/applications/{application} | Full application and loaded relationships. |
| PATCH | /api/registrar/applications/{application} | Review with status and conditional rejection_reason. |
| GET | /api/registrar/applications/{application}/documents | Application documents. |
| GET | /api/registrar/documents/{document}/temporary-url | Staff document URL. |
| POST | /api/registrar/applications/{application}/enroll | Enroll approved application using class_id. |
| GET | /api/registrar/payments | Paginated payments; filters status/application_id/per_page. |
| GET | /api/registrar/payments/{payment} | Payment and relationships. |
| POST | /api/registrar/payments/{payment}/verify | Pending -> successful; sets paid_at and emits event. |
| GET | /api/registrar/students | Paginated students with status/class/program/intake/date/search filters. |
| GET | /api/registrar/students/{student} | Student and relationships. |
| PATCH | /api/registrar/students/{student}/status | Update student status. |
| GET | /api/registrar/classes | Paginated classes filtered by program/intake. |
| GET | /api/registrar/search?q=... | Search applications/students, max 10 results each; q required. |

Review transitions are submitted or paid -> under_review, and under_review -> approved or rejected. Approval requires a successful payment when the application has payments. Enrollment requires approved status, matching program/intake class, available capacity, and a successful payment when payments exist.

## Notifications

All notification routes require Sanctum and are scoped to the current user:

| Method | Path | Purpose |
|---|---|---|
| GET | /api/notifications | Paginated own notifications; per_page max 100. |
| GET | /api/notifications/unread | Paginated unread notifications. |
| POST | /api/notifications/{notification}/read | Mark own notification read; another user receives 404. |
| POST | /api/notifications/read-all | Mark all own unread notifications read; returns updated count. |

Events/listeners notify for application submission, application approval/rejection, payment status changes, and student enrollment. NotificationService::createOnce uses recipient/type/message as its idempotency key.

## Student profile

GET /api/student/me requires Sanctum and role student. It returns the authenticated user’s StudentResource, including application, class, program/intake, documents, and payments when present. It returns 404 when the account has no student record.

## Data and enum values

Application statuses: draft, submitted, payment_pending, paid, under_review, approved, rejected, enrolled.

Document types: id_photo, registration_doc, receipt, certificate, other.

Payment statuses: pending, successful, failed, cancelled, refunded.

Student statuses: applicant, active, completed, suspended, withdrawn, graduated.

The application model contains reference_number, nullable program_id/intake_id/applicant_name/applicant_phone, applicant_email, status, rejection_reason, reviewed_by, and submitted_at. Related models are Program, Intake, Document, Payment, Student, and reviewer User.

## Storage and security

- Private documents use the private_documents disk, rooted at PRIVATE_STORAGE_ROOT or storage/app/private.
- CORS is configured through CORS_ALLOWED_ORIGINS, falling back to FRONTEND_URL and then http://localhost:5173. Credentials are disabled because the API uses Bearer tokens.
- Resources do not expose file_path.
- Temporary URLs are signed and expire after 15 minutes.
- Application ownership is checked by matching authenticated email to applicant_email. Student ownership is checked by user ID or application email, depending on the policy.
- Pagination defaults to 20 and is capped at 100.
- Authentication tokens are only returned by login, Google callback, and refresh.

## Not implemented / pending

- ⚠️ No API versioning (/v1) is implemented.
- ⚠️ No self-service email/password registration endpoint is implemented.
- ⚠️ Application step names are not interpreted; the step value is accepted but field validation is shared.
- ⚠️ No document replacement endpoint exists; duplicate document types are allowed by the schema.
- ⚠️ No payment-before-submission requirement is implemented.
