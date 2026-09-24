import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { contentService, applicationService, publicContentService, guestApplicationService } from '../services/applicationService';
import { useAuth } from './AuthContext';

const ApplicationContext = createContext(null);
const STEP_ORDER = ['program', 'selected', 'location', 'experience', 'documents', 'review', 'payment', 'confirmation'];
const GUEST_SESSION_KEY = 'bayn_guest_application';
const initialState = { programId: null, intakeId: null, applicantName: '', applicantEmail: '', applicantPhone: '', city: '', area: '', landmark: '', education: null, experience: null, idDocument: null, profilePhoto: null, supportingDoc: null, paymentMethod: 'primary', agreed: false };
const normalizeProgram = (p) => ({ ...p, title: p.name, duration: p.duration_weeks ? `${p.duration_weeks} weeks` : '—', image: p.image_url || '/hero.png' });
const readGuestSession = () => { try { return JSON.parse(localStorage.getItem(GUEST_SESSION_KEY) || 'null'); } catch { return null; } };
const writeGuestSession = (session) => localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));

export function ApplicationProvider({ children, guest = false }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ ...initialState, isGuest: guest });
  const [programs, setPrograms] = useState([]); const [intakes, setIntakes] = useState([]);
  const [application, setApplication] = useState(null); const [errors, setErrors] = useState({}); const [furthestStep, setFurthestStep] = useState(0); const [loading, setLoading] = useState(true);
  const basePath = guest ? '/apply' : '/application';

  useEffect(() => {
    const load = guest ? publicContentService.programs({ per_page: 100 }) : contentService.programs({ status: 'open', per_page: 100 });
    load.then((data) => setPrograms((data?.data || data || []).map(normalizeProgram))).catch(() => setErrors({ api: 'Programs could not be loaded.' })).finally(() => setLoading(false));
  }, [guest]);
  useEffect(() => {
    if (guest) {
      const session = readGuestSession(); if (!session?.id || !session?.token) return;
      guestApplicationService.show(session.id, session.token).then((record) => { setApplication(record); setFormData((prev) => ({ ...prev, programId: record.program_id, intakeId: record.intake_id, applicantName: record.applicant_name || '', applicantEmail: record.applicant_email || '', applicantPhone: record.applicant_phone || '', city: record.city || '', area: record.area || '', landmark: record.landmark || '', education: record.education || null, experience: record.experience || null })); setFurthestStep(7); }).catch(() => {});
      return;
    }
    if (!user) return;
    applicationService.list({ per_page: 100 }).then((data) => { const applications = data?.data || data || []; const draft = applications.find((item) => ['draft', 'rejected', 'needs_information'].includes(item.status)); if (draft) { setApplication(draft); setFormData((prev) => ({ ...prev, programId: draft.program_id, intakeId: draft.intake_id, applicantName: draft.applicant_name || user.name || '', applicantPhone: draft.applicant_phone || user.phone || '', city: draft.city || '', area: draft.area || '', landmark: draft.landmark || '', education: draft.education || null, experience: draft.experience || null })); } else setFormData((prev) => ({ ...prev, applicantName: user.name || '', applicantPhone: prev.applicantPhone || user.phone || '' })); }).catch(() => {});
  }, [guest, user]);
  useEffect(() => { if (!formData.programId) { setIntakes([]); return; } const load = guest ? publicContentService.intakes(formData.programId) : contentService.intakes({ program_id: formData.programId, status: 'open', per_page: 100 }); load.then((data) => setIntakes(data?.data || data || [])).catch(() => setIntakes([])); }, [guest, formData.programId]);

  const updateField = useCallback((field, value) => { setFormData((prev) => ({ ...prev, [field]: value })); setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; }); }, []);
  const getSelectedProgram = useCallback(() => programs.find((p) => String(p.id) === String(formData.programId)) || null, [programs, formData.programId]);
  const validateFile = useCallback((file) => !file ? 'This document is required' : file.size > 10 * 1024 * 1024 ? 'File must be under 10 MB' : !['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type) ? 'Only PDF, JPG, PNG, DOC, or DOCX allowed' : null, []);
  const validateStep = useCallback((step) => { const next = {}; if (step === 'program' && !formData.programId) next.programId = 'Please select a program'; if (step === 'selected' && !formData.intakeId) next.intakeId = 'Please select an intake'; if (step === 'location') { if (guest && !formData.applicantName.trim()) next.applicantName = 'Full name is required'; if (guest && !formData.applicantEmail.trim()) next.applicantEmail = 'Email is required'; if (guest && formData.applicantEmail && !/^\S+@\S+\.\S+$/.test(formData.applicantEmail)) next.applicantEmail = 'Enter a valid email address'; if (!formData.applicantPhone.trim()) next.applicantPhone = 'Phone number is required'; if (!formData.city.trim()) next.city = 'City is required'; if (!formData.area.trim()) next.area = 'Area is required'; } if (step === 'experience') { if (!formData.education) next.education = 'Please select your education level'; if (!formData.experience) next.experience = 'Please select your experience level'; } if (step === 'documents') { next.idDocument = validateFile(formData.idDocument); next.profilePhoto = validateFile(formData.profilePhoto); Object.keys(next).forEach((key) => !next[key] && delete next[key]); } setErrors(next); return !Object.keys(next).length; }, [formData, guest, validateFile]);
  const completeStep = useCallback((step) => { const index = STEP_ORDER.indexOf(step); setFurthestStep((prev) => Math.max(prev, index + 1)); }, []);
  const canAccess = useCallback((step) => { const index = STEP_ORDER.indexOf(step); return index <= furthestStep ? true : STEP_ORDER[index - 1]; }, [furthestStep]);
  const applicationPayload = useCallback(() => { const payload = { program_id: formData.programId, intake_id: formData.intakeId, applicant_name: guest ? formData.applicantName : (user?.name || formData.applicantName), applicant_email: guest ? formData.applicantEmail : user?.email, applicant_phone: formData.applicantPhone || user?.phone, city: formData.city, area: formData.area, landmark: formData.landmark, education: formData.education, experience: formData.experience }; return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== undefined && value !== '')); }, [formData, guest, user]);
  const ensureDraft = useCallback(async () => {
    const currentSession = guest ? readGuestSession() : null;
    if (application?.id && (!guest || currentSession?.token)) return application;
    if (guest && application?.id && !currentSession?.token) setApplication(null);

    if (guest) {
      const session = currentSession;
      if (session?.id && session?.token) {
        const existing = await guestApplicationService.show(session.id, session.token);
        setApplication(existing);
        return existing;
      }
      if (session?.id && !session?.token) {
        localStorage.removeItem(GUEST_SESSION_KEY);
      }
    }

    const draft = guest ? await guestApplicationService.create(applicationPayload()) : await applicationService.create(applicationPayload());
    setApplication(draft);
    if (guest && draft.guest_access_token) writeGuestSession({ id: draft.id, token: draft.guest_access_token });
    return draft;
  }, [application, applicationPayload, guest]);
  const saveStep = useCallback(async (step) => { const draft = await ensureDraft(); const token = readGuestSession()?.token || draft.guest_access_token; const saved = guest ? await guestApplicationService.update(draft.id, token, applicationPayload()) : await applicationService.saveStep(draft.id, step, applicationPayload()); setApplication(saved); return saved; }, [ensureDraft, applicationPayload, guest]);
  const uploadDocuments = useCallback(async () => { const draft = await ensureDraft(); const session = readGuestSession(); const token = session?.token || draft.guest_access_token; const uploads = [['id_photo', formData.idDocument], ['other', formData.profilePhoto], ['registration_doc', formData.supportingDoc]]; for (const [type, file] of uploads) if (file) guest ? await guestApplicationService.upload(draft.id, token, type, file) : await applicationService.upload(draft.id, type, file); }, [ensureDraft, formData, guest]);
  const submitApplication = useCallback(async (draftOverride = null) => { const draft = draftOverride || await ensureDraft(); const token = readGuestSession()?.token || draft.guest_access_token; const submitted = guest ? await guestApplicationService.submit(draft.id, token) : await applicationService.submit(draft.id); setApplication(submitted); if (guest) writeGuestSession({ ...readGuestSession(), reference_number: submitted.reference_number }); return submitted; }, [ensureDraft, guest]);
  return <ApplicationContext.Provider value={{ formData, programs, intakes, application, loading, errors, furthestStep, guest, basePath, updateField, getSelectedProgram, validateStep, completeStep, canAccess, setErrors, ensureDraft, saveStep, uploadDocuments, submitApplication }}>{children}</ApplicationContext.Provider>;
}
export function useApplication() { const context = useContext(ApplicationContext); if (!context) throw new Error('useApplication must be used within ApplicationProvider'); return context; }
