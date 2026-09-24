import { registrarService } from '../services/applicationService';

const DEFAULT_PER_PAGE = 7;

const initials = (name = '') => name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const statusLabel = (status) => ({ submitted: 'Needs Review', under_review: 'Needs Review', payment_pending: 'Awaiting Information', needs_information: 'Awaiting Information', paid: 'Needs Review', approved: 'Approved', enrolled: 'Approved', rejected: 'Rejected' }[status] || status || 'Needs Review');
const statusStyle = (status) => ({ 'Needs Review': ['bg-[#fef3c7] text-[#b45309]', 'bg-[#f59e0b]'], 'Awaiting Information': ['bg-[#e0f2fe] text-[#0369a1]', 'bg-[#0ea5e9]'], Approved: ['bg-[#dcfce7] text-[#15803d]', 'bg-[#22c55e]'], Rejected: ['bg-[#fee2e2] text-[#b91c1c]', 'bg-[#ef4444]'] }[statusLabel(status)] || ['bg-gray-100 text-gray-700', 'bg-gray-400']);

const toTableRow = (app) => ({
  id: app.id,
  name: app.applicant_name || 'Unnamed applicant',
  initials: app.initials,
  program: app.program?.name || 'Unassigned',
  submitted: app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Draft',
  status: statusLabel(app.status),
  backendStatus: app.status,
  statusColor: statusStyle(app.status)[0],
  statusIconColor: statusStyle(app.status)[1],
  payment: app.payments?.[0]?.status || 'Pending',
  paymentColor: app.payments?.[0]?.status === 'successful' ? 'text-[#16a34a]' : 'text-[#b45309]',
  paymentDot: true,
  paymentDotColor: app.payments?.[0]?.status === 'successful' ? 'bg-[#22c55e]' : 'bg-[#f59e0b]',
});

export default class ApplicationsModel {
  constructor(applications) {
    this.applications = applications;
    this.total = applications.length;
    this.statusCounts = applications.reduce((counts, app) => {
      counts[app.status] = (counts[app.status] || 0) + 1;
      return counts;
    }, {});
  }

  query({ status = 'All', search = '', page = 1, perPage = DEFAULT_PER_PAGE } = {}) {
    const q = search.trim().toLowerCase();
    let filtered = this.applications;
    if (status && status !== 'All') {
      filtered = filtered.filter((app) => app.status === status);
    }
    if (q) {
      filtered = filtered.filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          app.id.toLowerCase().includes(q) ||
          app.program.toLowerCase().includes(q),
      );
    }

    const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * perPage;
    const rows = filtered.slice(start, start + perPage);

    return {
      rows,
      total: filtered.length,
      from: filtered.length === 0 ? 0 : start + 1,
      to: start + rows.length,
      page: safePage,
      pageCount,
    };
  }

  static async fetch() {
    const response = await registrarService.applications({ per_page: 100 });
    const rows = (response?.data || response || []).map((app) => toTableRow({ ...app, initials: initials(app.applicant_name) }));
    return new ApplicationsModel(rows);
  }
}
