import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService, contentService, registrarService, studentService, teacherService } from '../services/applicationService';
import { toUserMessage } from '../services/api';
import { scheduleParts } from '../utils/schedule';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => {
    if (user?.role === 'student') {
      Promise.all([studentService.me(), studentService.completionReview(), contentService.programs({ per_page: 100 })]).then(([student, completion, programsResult]) => setData({ student, completion, programs: programsResult?.data || programsResult || [] })).catch((err) => setError(toUserMessage(err)));
      return;
    }
    const load = user?.role === 'teacher' ? teacherService.dashboard : user?.role === 'super_admin' ? adminService.dashboard : registrarService.dashboard;
    load().then(setData).catch((err) => setError(toUserMessage(err)));
  }, [user]);

  if (user?.role === 'student') {
    return <StudentDashboard user={user} data={data} error={error} logout={logout} />;
  }

  return <main className="min-h-screen bg-[#f9f9f9] px-6 py-12"><div className="max-w-5xl mx-auto">
    <div className="flex justify-between items-start mb-10"><div><p className="text-[#a87b52] text-xs font-bold tracking-widest">{user?.role_label || user?.role}</p><h1 className="text-4xl font-serif mt-2">Welcome, {user?.name}</h1></div><button onClick={logout} className="border rounded-full px-5 py-2 text-sm">Sign out</button></div>
    {error && <p className="bg-red-50 text-red-700 p-4 rounded mb-5">{error}</p>}
    <div className="bg-white rounded-2xl p-6 shadow-sm"><h2 className="font-serif text-2xl mb-4">Dashboard</h2><pre className="text-xs whitespace-pre-wrap overflow-auto">{data ? JSON.stringify(data, null, 2) : 'Loading…'}</pre></div>
    {user?.role === 'student' && <Link to="/application" className="inline-block mt-6 bg-[#e6ca64] rounded-full px-6 py-3">Continue an application</Link>}
  </div></main>;
}

function StudentDashboard({ user, data, error, logout }) {
  const student = data?.student || data;
  const completion = data?.completion;
  const programs = data?.programs || [];
  const [completionFinished, setCompletionFinished] = React.useState(false);
  const assignedClass = student?.class;
  const schedule = scheduleParts(assignedClass?.schedule);
  const application = student?.application;
  const finishedProgramId = application?.program?.id;
  const otherPrograms = programs.filter((program) => program.status === 'open' && String(program.id) !== String(finishedProgramId));

  React.useEffect(() => {
    if (completion?.status !== 'approved' || !student?.id || !completion?.id) return;
    setCompletionFinished(localStorage.getItem(`completion-finished-${student.id}-${completion.id}`) === '1');
  }, [completion?.id, completion?.status, student?.id]);

  const finishCompletion = () => {
    setCompletionFinished(true);
    if (student?.id && completion?.id) localStorage.setItem(`completion-finished-${student.id}-${completion.id}`, '1');
  };

  return (
    <main className="min-h-screen bg-[#f9f9f9] px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-start mb-10">
          <div><p className="text-[#a87b52] text-xs font-bold tracking-widest">STUDENT PORTAL</p><h1 className="text-4xl font-serif mt-2">Welcome, {user?.name}</h1></div>
          <button onClick={logout} className="border rounded-full px-5 py-2 text-sm">Sign out</button>
        </div>

        {error && <p className="bg-red-50 text-red-700 p-4 rounded mb-5">{error}</p>}

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-[#a87b52] text-xs font-bold tracking-widest uppercase mb-2">YOUR CLASS</p>
          {assignedClass ? (
            <>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div><h2 className="font-serif text-3xl text-[#111111]">{assignedClass.name}</h2><p className="text-sm text-gray-500 mt-2">{application?.program?.name || 'Program'} · {application?.intake?.name || 'Intake'}</p></div>
                <span className="inline-flex self-start rounded-full bg-[#eef1ed] px-3 py-1 text-xs font-semibold text-[#4d6650]">{student.status || 'Active'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                <div className="rounded-xl bg-[#f5f5f3] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">DAYS</p><p className="text-sm font-medium text-gray-800 mt-2">{schedule.label}</p></div>
                <div className="rounded-xl bg-[#f5f5f3] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">TIME</p><p className="text-sm font-medium text-gray-800 mt-2">{schedule.time || 'Time not set'}</p></div>
                <div className="rounded-xl bg-[#f5f5f3] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">INSTRUCTOR</p><p className="text-sm font-medium text-gray-800 mt-2">{assignedClass.teacher?.name || 'To be assigned'}</p></div>
              </div>
              {student.enrolled_at && <p className="text-xs text-gray-400 mt-6">Enrolled {new Date(student.enrolled_at).toLocaleDateString()}</p>}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center"><h2 className="font-serif text-2xl text-[#111111]">Class assignment pending</h2><p className="text-sm text-gray-500 mt-2">The registrar will assign your class after reviewing your application.</p></div>
          )}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-[#a87b52] text-xs font-bold tracking-widest uppercase">ATTENDANCE</p>
            <p className="mt-3 text-3xl font-serif text-[#111111]">{student?.attendance_summary?.attendance_percentage ?? 0}%</p>
            <p className="mt-1 text-sm text-gray-500">{student?.attendance_summary?.present_or_late ?? 0} of {student?.attendance_summary?.total_days ?? 0} recorded days</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-[#a87b52] text-xs font-bold tracking-widest uppercase">COURSE PROGRESS</p>
            <p className="mt-3 text-3xl font-serif text-[#111111]">{student?.course_progress?.total_weighted_score ?? 0}</p>
            <p className="mt-1 text-sm text-gray-500">Weighted score across {student?.course_progress?.assessment_count ?? 0} assessments</p>
          </div>
        </section>

        {application && <section className="bg-white rounded-2xl p-6 shadow-sm mt-6"><h2 className="font-serif text-2xl mb-2">Application status</h2><p className="text-sm text-gray-500">{application.reference_number || 'Application'} · {application.status || 'Processing'}</p></section>}
        {completion?.status === 'approved' && !completionFinished && <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#e6f7d7] via-[#fff5c7] to-[#ffd9e8] p-8 shadow-sm mt-6 border border-white"><div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/40" /><div className="absolute right-24 bottom-[-3rem] h-28 w-28 rounded-full bg-[#c8e8f4]/60" /><div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6"><div><div className="text-3xl mb-3">🎉 ✨ 🎓</div><p className="text-xs font-bold tracking-[0.2em] text-[#7f5d23] uppercase">Congratulations!</p><h2 className="font-serif text-3xl text-[#213c2d] mt-2">You completed your course</h2><p className="text-sm text-[#49604d] mt-2">Your completion has been approved by the registrar. Your certificate will be prepared for physical signing and collection.</p></div><button onClick={finishCompletion} className="relative shrink-0 rounded-full bg-[#345243] px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#2b4a3b]">Finish</button></div></section>}
        {completion?.status === 'approved' && completionFinished && <section className="rounded-2xl border border-[#bbefc8] bg-[#effdf3] p-5 shadow-sm mt-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#12b76a] text-2xl text-white">✓</div><div><p className="text-xs font-bold tracking-widest text-[#027a48] uppercase">Course completed</p><h2 className="text-xl font-semibold text-[#14532d] mt-1">Passed</h2><p className="text-sm text-[#4b6350] mt-1">Your registrar-approved result is recorded. Please contact the academy about certificate collection.</p></div></div></section>}
        {completion && completion.status !== 'approved' && <section className="bg-white rounded-2xl p-6 shadow-sm mt-6"><p className="text-[#a87b52] text-xs font-bold tracking-widest uppercase mb-2">COURSE COMPLETION</p><h2 className="font-serif text-2xl">{completion.status === 'needs_correction' ? 'Review in progress' : 'Submitted for review'}</h2><p className="text-sm text-gray-500 mt-2">{completion.review_comment || 'The registrar is reviewing your attendance, marks, and curriculum.'}</p></section>}
        {completion?.status === 'approved' && otherPrograms.length > 0 && <section className="mt-8"><div className="mb-4"><p className="text-[#a87b52] text-xs font-bold tracking-widest uppercase">KEEP LEARNING</p><h2 className="font-serif text-2xl mt-1">Explore another program</h2><p className="text-sm text-gray-500 mt-1">Build on your skills with another academy program.</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{otherPrograms.map((program) => <Link key={program.id} to={`/programs/${program.id}`} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#b9cfaa] hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#7a9279]">{program.category || 'Academy program'}</p><h3 className="font-serif text-xl text-[#1f3327] mt-2">{program.name}</h3></div><span className="text-[#345243] transition group-hover:translate-x-1">→</span></div><p className="text-sm text-gray-500 mt-3">{program.description || 'Discover a new area of beauty and professional practice.'}</p></Link>)}</div></section>}
      </div>
    </main>
  );
}
