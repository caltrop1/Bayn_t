import { useEffect, useState } from "react";
import { ArrowRight, CreditCard, FileUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  publicContentService,
  guestApplicationService,
} from "../services/applicationService";
import { toUserMessage } from "../services/api";

export default function GuestApplicationPage() {
  const [programs, setPrograms] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [form, setForm] = useState({
    program_id: "",
    intake_id: "",
    applicant_name: "",
    applicant_email: "",
    applicant_phone: "",
    city: "",
    area: "",
    landmark: "",
    education: "",
    experience: "",
  });
  const [files, setFiles] = useState({
    id_photo: null,
    profile_photo: null,
    supporting_doc: null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    publicContentService
      .programs({ per_page: 100 })
      .then((data) => setPrograms(data?.data || data || []))
      .catch(() => setError("Programs could not be loaded."));
  }, []);
  useEffect(() => {
    if (!form.program_id) return setIntakes([]);
      publicContentService
      .intakes(form.program_id)
      .then((data) => setIntakes(data?.data || data || []))
      .catch(() => setIntakes([]));
  }, [form.program_id]);
  const setField = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!files.id_photo) return setError("An identity document is required.");
    if (!files.profile_photo)
      return setError("A profile photo is required.");
    setBusy(true);
    try {
      const created = await guestApplicationService.create(form);
      const id = created.id;
      const token = created.guest_access_token;
      localStorage.setItem(
        "bayn_guest_application",
        JSON.stringify({ id, token }),
      );
      await guestApplicationService.upload(
        id,
        token,
        "id_photo",
        files.id_photo,
      );
      await guestApplicationService.upload(id, token, "other", files.profile_photo);
      if (files.supporting_doc) {
        await guestApplicationService.upload(id, token, "registration_doc", files.supporting_doc);
      }
      const submitted = await guestApplicationService.submit(id, token);
      localStorage.setItem(
        "bayn_guest_application",
        JSON.stringify({
          id,
          token,
          reference_number:
            submitted?.data?.reference_number ||
            submitted?.reference_number ||
            id,
        }),
      );
      navigate("/apply/payment-complete");
    } catch (err) {
      const validationErrors = err?.errors
        ? Object.values(err.errors).flat().filter(Boolean)
        : [];
      setError(
        validationErrors.length
          ? validationErrors.join(" ")
          : toUserMessage(err, "Your application could not be submitted."),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fbf7f1] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <a href="/" className="text-sm text-[#8b7350]">
            ← Back to website
          </a>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-[#a87b52]">
            Admissions
          </p>
          <h1 className="mt-2 font-serif text-5xl text-[#221712]">
            Apply to the academy
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
            Complete your application, upload your documents, and continue to
            secure payment. Your email becomes your academy login email after
            payment and account approval.
          </p>
        </div>
        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Section title="Choose your program">
              <div className="grid gap-4 sm:grid-cols-2">
                {programs.map((program) => (
                  <label
                    key={program.id}
                    className={`cursor-pointer rounded-xl border p-4 transition ${String(form.program_id) === String(program.id) ? "border-[#a87b52] bg-[#fffaf2] ring-1 ring-[#a87b52]" : "border-gray-200 bg-white hover:border-[#c9a227]"}`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="program_id"
                      value={program.id}
                      checked={String(form.program_id) === String(program.id)}
                      onChange={(e) => {
                        setField("program_id", e.target.value);
                        setField("intake_id", "");
                      }}
                      required
                    />
                    <p className="font-medium text-gray-900">{program.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {program.duration_weeks
                        ? `${program.duration_weeks} weeks`
                        : "Academy program"}
                    </p>
                  </label>
                ))}
              </div>
              <Select
                label="Intake"
                value={form.intake_id}
                onChange={(v) => setField("intake_id", v)}
                options={intakes.map((i) => ({ value: i.id, label: i.name }))}
                required
                disabled={!form.program_id}
              />
            </Section>
            <Section title="Your details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full name"
                  value={form.applicant_name}
                  onChange={(v) => setField("applicant_name", v)}
                  required
                />
                <Field
                  label="Email address"
                  type="email"
                  value={form.applicant_email}
                  onChange={(v) => setField("applicant_email", v)}
                  required
                />
                <Field
                  label="Phone number"
                  value={form.applicant_phone}
                  onChange={(v) => setField("applicant_phone", v)}
                  required
                />
                <Field
                  label="City"
                  value={form.city}
                  onChange={(v) => setField("city", v)}
                  required
                />
                <Field
                  label="Area"
                  value={form.area}
                  onChange={(v) => setField("area", v)}
                  required
                />
                <Field
                  label="Landmark"
                  value={form.landmark}
                  onChange={(v) => setField("landmark", v)}
                />
              </div>
            </Section>
            <Section title="Education and experience">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Education level"
                  value={form.education}
                  onChange={(v) => setField("education", v)}
                  required
                  options={[
                    "Secondary school",
                    "Certificate",
                    "Diploma",
                    "Bachelor degree",
                    "Other",
                  ].map((v) => ({ value: v, label: v }))}
                />
                <Select
                  label="Makeup experience"
                  value={form.experience}
                  onChange={(v) => setField("experience", v)}
                  required
                  options={[
                    "None",
                    "Beginner",
                    "Intermediate",
                    "Professional",
                  ].map((v) => ({ value: v, label: v }))}
                />
              </div>
            </Section>
            <Section title="Documents">
              <div className="grid gap-4 sm:grid-cols-2">
                <FileField
                  label="Identity document"
                  file={files.id_photo}
                  onChange={(file) =>
                    setFiles((f) => ({ ...f, id_photo: file }))
                  }
                  required
                />
                <FileField
                  label="Profile photo"
                  file={files.profile_photo}
                  onChange={(file) =>
                    setFiles((f) => ({ ...f, profile_photo: file }))
                  }
                  required
                />
                <FileField
                  label="Supporting document"
                  file={files.supporting_doc}
                  onChange={(file) => setFiles((f) => ({ ...f, supporting_doc: file }))}
                />
              </div>
            </Section>
          </div>
          <aside className="h-fit rounded-2xl bg-[#221712] p-6 text-white shadow-lg lg:sticky lg:top-6">
            <CreditCard className="mb-5 text-[#e5cb74]" />
            <h2 className="font-serif text-3xl">Ready to submit?</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              After submission you will be redirected to the secure payment
              page. The academy will use your email to create your student
              account after payment is confirmed.
            </p>
            {error && (
              <p className="mt-5 rounded-lg bg-red-900/50 p-3 text-sm text-red-200">
                {error}
              </p>
            )}
            <button
              disabled={busy}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#e5cb74] px-5 py-3 text-sm font-semibold text-[#221712] transition hover:bg-[#f0d989] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="animate-spin" size={17} /> Submitting…
                </>
              ) : (
                <>
                  Submit and pay <ArrowRight size={17} />
                </>
              )}
            </button>
            <p className="mt-4 text-center text-[11px] text-white/50">
              Your email cannot be changed by the academy after submission.
            </p>
          </aside>
        </form>
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-600"> *</span>}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#a87b52] focus:outline-none focus:ring-1 focus:ring-[#a87b52]"
      />
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}) {
  return (
    <label className="mt-5 block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-600"> *</span>}
      <select
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[#a87b52] focus:outline-none disabled:bg-gray-100"
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function FileField({ label, file, onChange, required }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600 hover:border-[#a87b52] hover:bg-[#fffaf2]">
      {" "}
      <FileUp className="shrink-0 text-[#a87b52]" size={20} />
      <span className="min-w-0">
        <span className="block font-medium text-gray-800">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </span>
        <span className="block truncate text-xs">
          {file?.name || "Choose PDF, JPG, PNG, DOC or DOCX"}
        </span>
      </span>
      <input
        required={required && !file}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </label>
  );
}
