import { applicantStatusStyles } from '../data/applicantStatusData';
import { registrarService } from '../services/applicationService';

const DECISION_STATUSES = ['Needs Review', 'Awaiting Information'];

const formatActivityDate = () =>
  new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) +
  ' • ' +
  new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export default class ApplicationModel {
  constructor(record) {
    this.record = record;
    Object.assign(this, record);
  }

  isDecisionable() {
    return DECISION_STATUSES.includes(this.status);
  }

  transition(status, { activityTitle, note } = {}) {
    const styles = applicantStatusStyles[status];
    const activities = this.record.activities.map((activity) => ({ ...activity, active: false, isLast: false }));
    if (activityTitle) {
      activities.push({
        id: activities.length + 1,
        title: activityTitle,
        date: formatActivityDate(),
        active: true,
        isLast: true,
      });
    }
    return new ApplicationModel({
      ...this.record,
      ...styles,
      historyNote: note || this.record.historyNote,
      activities,
    });
  }

  static async fetch(id) {
    const app = await registrarService.application(id);
    if (!app) return null;
    const label = ({ submitted: 'Needs Review', under_review: 'Needs Review', payment_pending: 'Awaiting Information', needs_information: 'Awaiting Information', paid: 'Needs Review', approved: 'Approved', enrolled: 'Approved', rejected: 'Rejected' }[app.status] || app.status || 'Needs Review');
    const style = applicantStatusStyles[label] || applicantStatusStyles['Needs Review'];
    return new ApplicationModel({
      ...style,
      id: app.id,
      name: app.applicant_name || 'Unnamed applicant',
      initials: (app.applicant_name || '').split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
      program: app.program?.name || 'Unassigned',
      intake: app.intake?.name || 'Unassigned',
      email: app.applicant_email,
      phone: app.applicant_phone || 'Not provided',
      fullName: app.applicant_name || 'Unnamed applicant',
      dateOfBirth: 'Not provided',
      address: [app.city, app.area, app.landmark].filter(Boolean).join(', ') || 'Not provided',
      educationLevel: app.education || 'Not provided',
      experience: app.experience || 'Not provided',
      experienceDetails: 'No additional details provided.',
      applicationDate: app.created_at ? new Date(app.created_at).toLocaleDateString() : '—',
      payment: app.payments?.[0]?.status || 'Pending',
      paymentStatus: app.payments?.[0]?.status || 'Pending',
      paymentAmount: app.payments?.[0]?.amount ? `${app.payments[0].amount} ${app.payments[0].currency || ''}` : '—',
      programDuration: app.program?.duration_weeks ? `${app.program.duration_weeks} weeks` : '—',
      programLevel: app.program?.level || '—',
      documents: app.documents || [],
      activities: [],
      backendStatus: app.status,
      historyNote: '',
      rejectionReason: app.rejection_reason || '',
    });
  }
}
