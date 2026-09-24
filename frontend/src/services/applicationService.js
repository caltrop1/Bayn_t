import { api, unwrap } from './api';

const resource = (response) => unwrap(response);

export const publicService = {
  settings: async () => resource(await api.get('/site/settings')),
  gallery: async (params) => resource(await api.get('/public/gallery', params)),
  subscribe: (email) => api.post('/newsletter/subscribe', { email }),
};

export const contentService = {
  programs: async (params) => resource(await api.get('/programs', params)),
  intakes: async (params) => resource(await api.get('/intakes', params)),
};

export const publicContentService = {
  programs: async (params) => resource(await api.get('/public/programs', params)),
  program: async (id) => resource(await api.get(`/public/programs/${id}`)),
  intakes: async (programId) => {
    const program = await publicContentService.program(programId);
    return program?.intakes?.data || program?.intakes || [];
  },
};

const guestRequest = async (method, url, token, data, config = {}) => {
  if (!token) {
    throw new Error('Your application session is missing. Please restart the application.');
  }

  return api.request({
    ...config,
    method,
    url,
    data,
    headers: {
      ...(config.headers || {}),
      'X-Application-Token': token,
    },
  });
};

export const guestApplicationService = {
  create: async (payload) => {
    const response = await api.post('/guest-applications', payload);
    return {
      ...resource(response),
      guest_access_token: response?.data?.guest_access_token,
    };
  },
  show: async (id, token) => resource(await guestRequest('get', `/guest-applications/${id}`, token)),
  update: async (id, token, payload) => resource(await guestRequest('patch', `/guest-applications/${id}`, token, payload)),
  upload: async (id, token, type, file) => {
    const body = new FormData();
    body.append('type', type);
    body.append('file', file);
    return resource(await guestRequest('post', `/guest-applications/${id}/documents`, token, body, { timeout: 120000 }));
  },
  submit: async (id, token) => resource(await guestRequest('post', `/guest-applications/${id}/submit`, token, {})),
  deferPayment: async (id, token) => resource(await guestRequest('post', `/guest-applications/${id}/defer-payment`, token, {})),
};

export const applicationService = {
  list: async (params) => resource(await api.get('/applications', params)),
  show: async (id) => resource(await api.get(`/applications/${id}`)),
  create: async (payload) => resource(await api.post('/applications', payload)),
  saveStep: async (id, step, payload) => resource(await api.patch(`/applications/${id}/steps/${step}`, payload)),
  upload: async (id, type, file) => {
    const body = new FormData(); body.append('type', type); body.append('file', file);
    // File uploads can take longer than normal API requests, especially when
    // the API is waking up or the connection to the database is remote.
    return resource(await api.post(`/applications/${id}/documents`, body, { timeout: 120000 }));
  },
  documents: async (id) => resource(await api.get(`/applications/${id}/documents`)),
  submit: async (id) => resource(await api.post(`/applications/${id}/submit`, {})),
};

export const paymentService = {
  initiate: async (payload) => resource(await api.post('/payments/initiate', payload)),
};

export const documentService = {
  upload: async (payload) => {
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => value != null && body.append(key, value));
    return resource(await api.post('/documents', body));
  },
  temporaryUrl: async (id) => (await api.get(`/documents/${id}/temporary-url`)).data,
};

export const notificationService = {
  list: async (params) => resource(await api.get('/notifications', params)),
  unread: async (params) => resource(await api.get('/notifications/unread', params)),
  read: async (id) => resource(await api.post(`/notifications/${id}/read`)),
  readAll: async () => (await api.post('/notifications/read-all')).data,
};

export const studentService = {
  me: async () => resource(await api.get('/student/me')),
  attendance: async (id, params) => resource(await api.get(`/students/${id}/attendance`, params)),
  attendanceSummary: async (id, params) => resource(await api.get(`/students/${id}/attendance/summary`, params)),
  assessments: async (id, params) => resource(await api.get(`/students/${id}/assessments`, params)),
  certificate: async (id) => (await api.get(`/students/${id}/certificate`)).data,
  certificateFile: async (id) => (await api.get(`/students/${id}/certificate/download`, undefined, { responseType: 'blob', timeout: 120000 })).data,
  generateCertificate: async (id) => resource(await api.post(`/students/${id}/certificate`)),
  completionReview: async () => resource(await api.get('/student/completion-review')),
};

export const teacherService = {
  dashboard: async () => resource(await api.get('/teacher/dashboard')),
  classes: async (params) => resource(await api.get('/teacher/classes', params)),
  grading: async (params) => resource(await api.get('/teacher/grading', params)),
  students: async (params) => resource(await api.get('/teacher/students', params)),
  curriculum: async (params) => resource(await api.get('/teacher/curriculum', params)),
  attendance: async (params) => resource(await api.get('/teacher/attendance', params)),
  assessments: async (params) => resource(await api.get('/teacher/assessments', params)),
  classAttendance: async (id, params) => resource(await api.get(`/classes/${id}/attendance`, params)),
  bulkAttendance: async (id, payload) => resource(await api.post(`/classes/${id}/attendance`, payload)),
  classAssessments: async (id, params) => resource(await api.get(`/classes/${id}/assessments`, params)),
  createAssessment: async (payload) => resource(await api.post('/assessments', payload)),
  updateAssessment: async (id, payload) => resource(await api.put(`/assessments/${id}`, payload)),
  deleteAssessment: async (id) => api.delete(`/assessments/${id}`),
  completionReviews: async (params) => resource(await api.get('/teacher/completion-reviews', params)),
  submitCompletion: async (studentId) => resource(await api.post(`/teacher/students/${studentId}/completion-review`)),
};

export const registrarService = {
  dashboard: async () => resource(await api.get('/registrar/dashboard')),
  applications: async (params) => resource(await api.get('/registrar/applications', params)),
  application: async (id) => resource(await api.get(`/registrar/applications/${id}`)),
  review: async (id, payload) => resource(await api.patch(`/registrar/applications/${id}`, payload)),
  requestInformation: async (id, payload) => resource(await api.post(`/registrar/applications/${id}/request-information`, payload)),
  classes: async (params) => resource(await api.get('/registrar/classes', params)),
  teachers: async () => resource(await api.get('/registrar/teachers')),
  assignTeacher: async (classId, teacherId) => resource(await api.patch(`/classes/${classId}`, { teacher_id: teacherId || null })),
  documentUrl: async (id) => (await api.get(`/registrar/documents/${id}/temporary-url`)).data,
  enroll: async (id, class_id) => resource(await api.post(`/registrar/applications/${id}/enroll`, { class_id })),
  createStudentAccount: async (id, password) => resource(await api.post(`/registrar/applications/${id}/account`, password ? { password } : {})),
  students: async (params) => resource(await api.get('/registrar/students', params)),
  student: async (id) => resource(await api.get(`/registrar/students/${id}`)),
  updateStudentStatus: async (id, status) => resource(await api.patch(`/registrar/students/${id}/status`, { status })),
  payments: async (params) => resource(await api.get('/registrar/payments', params)),
  verifyPayment: async (id) => resource(await api.post(`/registrar/payments/${id}/verify`)),
  search: async (q) => resource(await api.get('/registrar/search', { q })),
  completionReviews: async (params) => resource(await api.get('/registrar/completion-reviews', params)),
  completionReview: async (id) => resource(await api.get(`/registrar/completion-reviews/${id}`)),
  reviewCompletion: async (id, payload) => resource(await api.patch(`/registrar/completion-reviews/${id}`, payload)),
};

export const adminService = {
  dashboard: async () => resource(await api.get('/admin/dashboard')),
  users: async (params) => resource(await api.get('/users', params)),
  reports: async (type, params) => resource(await api.get(`/reports/${type}`, params)),
  backups: async () => resource(await api.get('/backups')),
  createBackup: async () => resource(await api.post('/backups')),
  restoreBackup: async (name) => resource(await api.post(`/backups/${encodeURIComponent(name)}/restore`)),
  programs: async (params) => resource(await api.get('/programs', params)),
  program: async (id) => resource(await api.get(`/programs/${id}`)),
  createProgram: async (payload) => resource(await api.post('/programs', payload)),
  updateProgram: async (id, payload) => resource(await api.put(`/programs/${id}`, payload)),
  deleteProgram: async (id) => api.delete(`/programs/${id}`),
  classes: async (params) => resource(await api.get('/classes', params)),
  schoolClass: async (id) => resource(await api.get(`/classes/${id}`)),
  createClass: async (payload) => resource(await api.post('/classes', payload)),
  updateClass: async (id, payload) => resource(await api.put(`/classes/${id}`, payload)),
  deleteClass: async (id) => api.delete(`/classes/${id}`),
  user: async (id) => resource(await api.get(`/users/${id}`)),
  createUser: async (payload) => resource(await api.post('/users', payload)),
  updateUser: async (id, payload) => resource(await api.put(`/users/${id}`, payload)),
  deleteUser: async (id) => api.delete(`/users/${id}`),
  passwordResetRequests: async (params) => resource(await api.get('/password-reset-requests', params)),
  approvePasswordReset: async (id, payload = {}) => resource(await api.post(`/password-reset-requests/${id}/approve`, payload)),
  rejectPasswordReset: async (id, payload = {}) => resource(await api.post(`/password-reset-requests/${id}/reject`, payload)),
  grading: async (params) => resource(await api.get('/grading-configs', params)),
  createGrading: async (payload) => resource(await api.post('/grading-configs', payload)),
  updateGrading: async (id, payload) => resource(await api.put(`/grading-configs/${id}`, payload)),
  deleteGrading: async (id) => api.delete(`/grading-configs/${id}`),
  auditLogs: async (params) => resource(await api.get('/audit-logs', params)),
  settings: async () => resource(await api.get('/site/settings')),
  updateSettings: async (payload) => {
    const body = new FormData(); Object.entries(payload).forEach(([key, value]) => value != null && body.append(key, value));
    return resource(await api.put('/site/settings', body));
  },
  gallery: async (params) => resource(await api.get('/gallery', params)),
  createGallery: async (payload) => { const body = new FormData(); Object.entries(payload).forEach(([key, value]) => value != null && body.append(key, value)); return resource(await api.post('/gallery', body)); },
  updateGallery: async (id, payload) => { const body = new FormData(); Object.entries(payload).forEach(([key, value]) => value != null && body.append(key, value)); return resource(await api.post(`/gallery/${id}`, body, { params: { _method: 'PATCH' } })); },
  deleteGallery: async (id) => api.delete(`/gallery/${id}`),
};
