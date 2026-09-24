import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import MainLayout from './layouts/MainLayout';
import ApplicationLayout from './layouts/ApplicationLayout';
import { ApplicationProvider, useApplication } from './context/ApplicationContext';
import Home from './pages/Home';
import About from './pages/About';
import Programs from './pages/Programs';
import PublicProgramDetails from './pages/PublicProgramDetails';
import EventsPage from './pages/EventsPage';
import Teachers from './pages/Teachers';
import FAQPage from './pages/FAQPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Contact from './pages/Contact';
import Gallery from './pages/Gallery';
import Application from './pages/Application';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RegistrarLayout from './layouts/RegistrarLayout';
import RegistrarOverview from './pages/RegistrarOverview';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationReviewPage from './pages/ApplicationReviewPage';
import ClassAssignmentPage from './pages/ClassAssignmentPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import ClassesPage from './pages/ClassesPage';
import EnrollmentHistoryPage from './pages/EnrollmentHistoryPage';
import CompletionReviewsPage from './pages/CompletionReviewsPage';
import ProfilePage from './pages/ProfilePage';

import TeacherLayout from './layouts/TeacherLayout';
import TeacherOverview from './pages/teacher/TeacherOverview';
import TeacherClasses from './pages/teacher/TeacherClasses';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherMarks from './pages/teacher/TeacherMarks';
import TeacherCurriculum from './pages/teacher/TeacherCurriculum';
import TeacherRoster from './pages/teacher/TeacherRoster';
import TeacherStudentProgress from './pages/teacher/TeacherStudentProgress';

import ProgramSelection from './pages/ProgramSelection';
import SelectedProgram from './pages/SelectedProgram';
import LocationStep from './pages/LocationStep';
import ExperienceStep from './pages/ExperienceStep';
import DocumentsStep from './pages/DocumentsStep';
import ReviewStep from './pages/ReviewStep';
import PaymentStep from './pages/PaymentStep';
import ApplicationConfirmation from './pages/ApplicationConfirmation';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import SuperAdminOverview from './pages/super-admin/SuperAdminOverview';
import SuperAdminUsers from './pages/super-admin/SuperAdminUsers';
import SuperAdminUserDetail from './pages/super-admin/SuperAdminUserDetail';
import SuperAdminAddUser from './pages/super-admin/SuperAdminAddUser';
import SuperAdminPrograms from './pages/super-admin/SuperAdminPrograms';
import SuperAdminProgramAdd from './pages/super-admin/SuperAdminProgramAdd';
import SuperAdminProgramView from './pages/super-admin/SuperAdminProgramView';
import SuperAdminProgramEdit from './pages/super-admin/SuperAdminProgramEdit';
import SuperAdminClasses from './pages/super-admin/SuperAdminClasses';
import SuperAdminAddClass from './pages/super-admin/SuperAdminAddClass';
import SuperAdminClassDetail from './pages/super-admin/SuperAdminClassDetail';
import SuperAdminGrading from './pages/super-admin/SuperAdminGrading';
import SuperAdminReports from './pages/super-admin/SuperAdminReports';
import SuperAdminPayments from './pages/super-admin/SuperAdminPayments';
import SuperAdminPaymentVerification from './pages/super-admin/SuperAdminPaymentVerification';
import SuperAdminContent from './pages/super-admin/SuperAdminContent';
import SuperAdminDocuments from './pages/super-admin/SuperAdminDocuments';
import SuperAdminRoles from './pages/super-admin/SuperAdminRoles';
import SuperAdminAuditLog from './pages/super-admin/SuperAdminAuditLog';
import SuperAdminSettings from './pages/super-admin/SuperAdminSettings';
import SuperAdminNotifications from './pages/super-admin/SuperAdminNotifications';
import SuperAdminPasswordResetRequests from './pages/super-admin/SuperAdminPasswordResetRequests';
import SuperAdminGenerateReport from './pages/super-admin/SuperAdminGenerateReport';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import StudentApplicationEntry from './components/StudentApplicationEntry';
import { roleHome } from './utils/roleHome';
import ForcedPasswordChangeModal from './components/ForcedPasswordChangeModal';
function ProtectedRoute({ step, children }) {
  const { canAccess } = useApplication();
  const targetStep = canAccess(step);
  if (targetStep !== true) {
    return <Navigate to={`/application/${targetStep}`} replace />;
  }
  return children;
}

function ApplicationStepsLayout({ guest = false }) {
  return (
    <ApplicationProvider guest={guest}>
      <Outlet />
    </ApplicationProvider>
  );
}

function RequireAuth({ children }) {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
}

function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to={roleHome(user?.role)} replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/apply" element={<ApplicationLayout />}>
          <Route index element={<Application basePath="/apply" />} />
          <Route element={<ApplicationStepsLayout guest />}>
            <Route path="program" element={<ProgramSelection />} />
            <Route path="selected" element={<ProtectedRoute step="selected"><SelectedProgram /></ProtectedRoute>} />
            <Route path="location" element={<ProtectedRoute step="location"><LocationStep /></ProtectedRoute>} />
            <Route path="experience" element={<ProtectedRoute step="experience"><ExperienceStep /></ProtectedRoute>} />
            <Route path="documents" element={<ProtectedRoute step="documents"><DocumentsStep /></ProtectedRoute>} />
            <Route path="review" element={<ProtectedRoute step="review"><ReviewStep /></ProtectedRoute>} />
            <Route path="payment" element={<ProtectedRoute step="payment"><PaymentStep /></ProtectedRoute>} />
            <Route path="confirmation" element={<ProtectedRoute step="confirmation"><ApplicationConfirmation /></ProtectedRoute>} />
          </Route>
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/:id" element={<PublicProgramDetails />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        <Route path="/application" element={<RequireAuth><RequireRole roles={['student']}><ApplicationLayout /></RequireRole></RequireAuth>}>
          <Route index element={<StudentApplicationEntry />} />
        </Route>

        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />

        <Route path="/application" element={<RequireAuth><RequireRole roles={['student']}><ApplicationLayout /></RequireRole></RequireAuth>}>
          <Route element={<ApplicationStepsLayout />}>
            <Route path="program" element={<ProgramSelection />} />
            <Route path="selected" element={<ProtectedRoute step="selected"><SelectedProgram /></ProtectedRoute>} />
            <Route path="location" element={<ProtectedRoute step="location"><LocationStep /></ProtectedRoute>} />
            <Route path="experience" element={<ProtectedRoute step="experience"><ExperienceStep /></ProtectedRoute>} />
            <Route path="documents" element={<ProtectedRoute step="documents"><DocumentsStep /></ProtectedRoute>} />
            <Route path="review" element={<ProtectedRoute step="review"><ReviewStep /></ProtectedRoute>} />
            <Route path="payment" element={<ProtectedRoute step="payment"><PaymentStep /></ProtectedRoute>} />
            <Route path="confirmation" element={<ProtectedRoute step="confirmation"><ApplicationConfirmation /></ProtectedRoute>} />
          </Route>
        </Route>

        <Route path="/registrar" element={<RequireAuth><RequireRole roles={['registrar', 'super_admin']}><RegistrarLayout /></RequireRole></RequireAuth>}>
          <Route path="overview" element={<RegistrarOverview />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="applications/:id" element={<ApplicationReviewPage />} />
          <Route path="applications/:id/assign-class" element={<ClassAssignmentPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:studentId" element={<StudentDetailPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="history" element={<EnrollmentHistoryPage />} />
          <Route path="completion-reviews" element={<CompletionReviewsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="/teacher" element={<RequireAuth><RequireRole roles={['teacher', 'super_admin']}><TeacherLayout /></RequireRole></RequireAuth>}>
          <Route path="overview" element={<TeacherOverview />} />
          <Route path="classes" element={<TeacherClasses />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="marks" element={<TeacherMarks />} />
          <Route path="curriculum" element={<TeacherCurriculum />} />
          <Route path="roster" element={<TeacherRoster />} />
          <Route path="roster/:studentId" element={<TeacherStudentProgress />} />
          <Route path="profile" element={<ProfilePage />} />
          {/* Default redirect to overview */}
          <Route index element={<Navigate to="/teacher/overview" replace />} />
        </Route>

        <Route path="/super-admin" element={<RequireAuth><RequireRole roles={['super_admin']}><SuperAdminLayout /></RequireRole></RequireAuth>}>
          <Route path="overview" element={<SuperAdminOverview />} />
          <Route path="users" element={<SuperAdminUsers />} />
          <Route path="users/add" element={<SuperAdminAddUser />} />
          <Route path="users/:id" element={<SuperAdminUserDetail />} />
          <Route path="programs" element={<SuperAdminPrograms />} />
          <Route path="programs/add" element={<SuperAdminProgramAdd />} />
          <Route path="programs/:id" element={<SuperAdminProgramView />} />
          <Route path="programs/:id/edit" element={<SuperAdminProgramEdit />} />
          <Route path="classes" element={<SuperAdminClasses />} />
          <Route path="classes/add" element={<SuperAdminAddClass />} />
          <Route path="classes/:id" element={<SuperAdminClassDetail />} />
          <Route path="grading" element={<SuperAdminGrading />} />
          <Route path="reports" element={<SuperAdminReports />} />
          <Route path="reports/generate" element={<SuperAdminGenerateReport />} />
          <Route path="payments" element={<SuperAdminPayments />} />
          <Route path="payments/:id" element={<SuperAdminPaymentVerification />} />
          <Route path="content" element={<SuperAdminContent />} />
          <Route path="documents" element={<SuperAdminDocuments />} />
          <Route path="roles" element={<SuperAdminRoles />} />
          <Route path="audit" element={<SuperAdminAuditLog />} />
          <Route path="notifications" element={<SuperAdminNotifications />} />
          <Route path="password-resets" element={<SuperAdminPasswordResetRequests />} />
          <Route path="settings" element={<SuperAdminSettings />} />
          <Route index element={<Navigate to="/super-admin/overview" replace />} />
        </Route>
      </Routes>
      <ForcedPasswordChangeModal />
    </BrowserRouter>
  );
}

export default App;
