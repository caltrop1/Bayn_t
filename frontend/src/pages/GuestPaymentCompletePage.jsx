import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { useMemo } from "react";

export default function GuestPaymentCompletePage() {
  const application = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("bayn_guest_application") || "null",
      );
    } catch {
      return null;
    }
  }, []);
  const referenceNumber =
    application?.reference_number || `#${application?.id || "—"}`;

  return (
    <main className="min-h-screen bg-[#fbf7f1] px-4 py-16">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm sm:p-12">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="text-emerald-600" size={38} />
        </div>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#a87b52]">
          Application received
        </p>
        <h1 className="mt-2 text-center font-serif text-4xl text-[#221712]">
          Application submitted and under review
        </h1>
        <p className="mt-4 text-center text-sm leading-6 text-gray-600">
          Thank you for applying. Your application has been submitted and is now
          under review. The academy will review your documents and contact you.
        </p>
        <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <ClipboardCheck
              className="mt-0.5 shrink-0 text-emerald-700"
              size={21}
            />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                What happens next?
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-800">
                Admissions will review your application. Payment is currently
                recorded as pending while payment integration is being
                finalized. If approved, the academy will contact you using the
                email and phone number you provided.
              </p>
              {referenceNumber && (
                <p className="mt-3 text-xs font-medium text-emerald-900">
                  Application reference: {referenceNumber}
                </p>
              )}
            </div>
          </div>
        </div>
        <a
          href="/"
          className="mt-7 inline-flex w-full justify-center rounded-full bg-[#221712] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3b2920]"
        >
          Return to website
        </a>
      </div>
    </main>
  );
}
