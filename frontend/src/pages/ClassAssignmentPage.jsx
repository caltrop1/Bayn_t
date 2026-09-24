import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentSummaryCard from '../components/StudentSummaryCard';
import AvailableClassesSection from '../components/AvailableClassesSection';
import AssignmentActionFooter from '../components/AssignmentActionFooter';
import { registrarService } from '../services/applicationService';
import { scheduleParts } from '../utils/schedule';

const mapClass = (item) => {
  const schedule = scheduleParts(item.schedule);
  const totalSeats = Number(item.capacity || 0);
  const seatsAvailable = Number(item.available_capacity ?? Math.max(0, totalSeats - Number(item.enrolled_count || 0)));

  return {
    ...item,
    title: item.name,
    seatsAvailable,
    totalSeats,
    programInfo: [item.program?.name, item.intake?.name].filter(Boolean).join(' · '),
    schedule: schedule.label,
    time: schedule.time,
    instructor: item.teacher?.name || 'Instructor not assigned',
    instructorRole: item.teacher?.role_label || 'Lead instructor',
    isFull: seatsAvailable <= 0,
  };
};

export default function ClassAssignmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [enrolledStudent, setEnrolledStudent] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    registrarService.application(id)
      .then((record) => Promise.all([
        Promise.resolve(record),
        registrarService.classes({ program_id: record.program_id, intake_id: record.intake_id, per_page: 100 }),
      ]))
      .then(([record, response]) => {
        if (!active) return;
        const availableClasses = (response?.data || response || []).map(mapClass);
        setApplication(record);
        setClasses(availableClasses);
        setSelectedClassId(availableClasses.find((item) => !item.isFull)?.id || null);
      })
      .catch((err) => {
        if (active) setError(err.message || 'The application classes could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  const selectedClass = useMemo(
    () => classes.find((item) => String(item.id) === String(selectedClassId)) || null,
    [classes, selectedClassId],
  );

  const assignClass = async () => {
    if (!selectedClass || assigning) return;
    setAssigning(true);
    setError('');
    try {
      const student = await registrarService.enroll(id, selectedClass.id);
      if (student?.user) {
        navigate(`/registrar/students/${student.id}`);
      } else {
        setEnrolledStudent(student);
      }
    } catch (err) {
      setError(err.message || 'The student could not be assigned to this class.');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-[#6b7280]">Loading available classes…</div>;

  if (!application) {
    return <div className="py-20 text-center text-[#6b7280]">{error || 'Application not found.'}</div>;
  }

  if (enrolledStudent) {
    const email = application.applicant_email;
    const createAccount = async () => {
      setCreatingAccount(true);
      setError('');
      try {
        const created = await registrarService.createStudentAccount(id, temporaryPassword.trim() || undefined);
        setTemporaryPassword('');
        navigate(`/registrar/students/${created.id || enrolledStudent.id}`);
      } catch (err) {
        setError(err.message || 'The student account could not be created.');
      } finally {
        setCreatingAccount(false);
      }
    };

    return (
      <div className="mx-auto max-w-2xl pb-20">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a87b52]">Class assigned</p>
          <h1 className="mt-2 text-3xl font-serif text-[#111827]">Create the student login</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">The class assignment is complete. Create the student account using the application email.</p>
          <div className="mt-6 rounded-xl bg-[#f5f5f3] p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400">Login email</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{email}</p>
            <p className="mt-3 text-xs text-gray-500">This email is locked to the application and cannot be changed.</p>
          </div>
          <label className="mt-6 block text-sm font-medium text-gray-700">
            Temporary password <span className="font-normal text-gray-400">(optional)</span>
            <input
              type="password"
              minLength={8}
              value={temporaryPassword}
              onChange={(event) => setTemporaryPassword(event.target.value)}
              placeholder="Leave blank to use the configured default"
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:border-[#a87b52] focus:outline-none"
            />
          </label>
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button onClick={createAccount} disabled={creatingAccount} className="mt-7 w-full rounded-full bg-[#221712] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3b2920] disabled:opacity-60">
            {creatingAccount ? 'Creating account…' : 'Create student account'}
          </button>
          <p className="mt-4 text-center text-xs text-gray-500">The student will be required to change the temporary password on first login.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <button onClick={() => navigate(`/registrar/applications/${id}`)} className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#111827] transition-colors mb-5">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Application
      </button>

      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] leading-tight mb-1">Assign to Class</h1>
          <p className="text-sm text-[#6b7280]">Select an available class for this student’s program and intake.</p>
        </div>
        <div className="flex-shrink-0 mt-1 px-4 py-1.5 rounded-full bg-[#f3f4f6] text-xs font-medium text-[#6b7280] whitespace-nowrap">Step 2 of 2 · Final Cohort Enrollment</div>
      </div>

      <StudentSummaryCard application={application} />
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <AvailableClassesSection classes={classes} selectedClassId={selectedClassId} onSelectClass={setSelectedClassId} application={application} />
      <AssignmentActionFooter selectedClass={selectedClass} onAssign={assignClass} busy={assigning} />
    </div>
  );
}
