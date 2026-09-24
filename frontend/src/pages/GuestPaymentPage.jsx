import { useState } from "react";
import { ArrowRight, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { guestApplicationService } from "../services/applicationService";
import { toUserMessage } from "../services/api";

export default function GuestPaymentPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const application = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("bayn_guest_application") || "null",
      );
    } catch {
      return null;
    }
  })();
  const referenceNumber =
    application?.reference_number || `#${application?.id || "—"}`;

  const continuePayment = async () => {
    if (!application?.id || !application?.token)
      return setError(
        "Your application session is missing. Please start again.",
      );
    setBusy(true);
    setError("");
    try {
      await guestApplicationService.deferPayment(
        application.id,
        application.token,
      );
      navigate("/apply/payment-complete");
    } catch (err) {
      setError(
        toUserMessage(
          err,
          "Your application was saved, but payment could not be recorded.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fbf7f1] px-4 py-16">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm sm:p-12">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff5d7] text-[#9a7620]">
          <CreditCard size={28} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a87b52]">
          Step 2 · Payment
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[#221712]">
          Payment details
        </h1>
        <p className="mt-4 text-sm leading-6 text-gray-600">
          Your application has been received. Payment integration is being
          finalized, so you can continue this screen for now. Your application
          will remain visible to the academy as payment pending.
        </p>
        <div className="mt-7 rounded-xl border border-gray-200 bg-[#fafaf7] p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600" size={20} />
            <span className="text-sm font-medium text-gray-800">
              Application submitted and under review
            </span>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Application reference: {referenceNumber}.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Your application has been submitted and is now under review. A
            payment record is pending until the gateway is enabled.
          </p>
        </div>
        {error && (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          onClick={continuePayment}
          disabled={busy}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#221712] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3b2920] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" size={17} /> Saving…
            </>
          ) : (
            <>
              Continue <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>
    </main>
  );
}
