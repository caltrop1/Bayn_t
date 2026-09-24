import React from 'react';
import { useNavigate } from 'react-router-dom';
import ApplicationStepper from '../components/application/ApplicationStepper';
import SidebarSummary from '../components/application/SidebarSummary';
import { useApplication } from '../context/ApplicationContext';

const LocationStep = () => {
  const navigate = useNavigate();
  const { formData, errors, updateField, validateStep, completeStep, saveStep, basePath, guest } = useApplication();
  const [busy, setBusy] = React.useState(false);
  const [apiError, setApiError] = React.useState('');

  const handleContinue = async () => {
    if (validateStep('location')) {
      setBusy(true); setApiError('');
      try { await saveStep('location'); completeStep('location'); navigate(`${basePath}/experience`); }
      catch (error) { setApiError(error.message || 'Your information could not be saved. Please try again.'); }
      finally { setBusy(false); }
    }
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 pb-16">
      <ApplicationStepper currentStep={2} />

      <div className="flex flex-col md:flex-row gap-10 md:gap-12 lg:gap-20 mt-10">
        {/* Left Sidebar */}
        <SidebarSummary />

        {/* Right Form Content */}
        <div className="flex-1 flex flex-col pt-2">
          <p className="text-[10px] font-bold text-gray-500 tracking-[0.15em] uppercase mb-4">
            LOCATION
          </p>
          <h2 className="text-[28px] sm:text-[34px] md:text-[38px] font-serif leading-[1.1] text-[#111111] mb-3">
            Where do you currently<br />live?
          </h2>
          <p className="text-[13px] text-gray-500 mb-10">
            Tell us your city and area so we know where you're based.
          </p>

          <form className="space-y-8 flex-1" onSubmit={(e) => { e.preventDefault(); handleContinue(); }}>
            {guest && <>
              <div>
                <label className="block text-[11px] font-bold text-[#111111] tracking-wider mb-2">FULL NAME</label>
                <input type="text" required value={formData.applicantName} onChange={(e) => updateField('applicantName', e.target.value)} placeholder="Your full name" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#111111] tracking-wider mb-2">EMAIL ADDRESS</label>
                <input type="email" required value={formData.applicantEmail} onChange={(e) => updateField('applicantEmail', e.target.value)} placeholder="you@example.com" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" />
                <p className="text-[11px] text-gray-500 mt-2">This email becomes your academy login email if you are enrolled.</p>
              </div>
            </>}
            <div>
              <label className="block text-[11px] font-bold text-[#111111] tracking-wider mb-2">PHONE NUMBER</label>
              <input type="tel" required value={formData.applicantPhone} onChange={(e) => updateField('applicantPhone', e.target.value)} placeholder="Example: +251900000000" className="w-full border border-gray-300 rounded-sm px-4 py-3 text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" />
              <p className="text-[11px] text-gray-500 mt-2">We will use this number if the registrar needs to contact you.</p>
            </div>
            {/* City / Town */}
            <div>
              <label className="block text-[11px] font-bold text-[#111111] tracking-wider mb-2">
                CITY / TOWN
              </label>
              <input 
                type="text" 
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Example: Addis Ababa"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-0 transition-colors"
              />
              <p className="text-[11px] text-gray-500 mt-2">
                Enter the city or town where you currently live.
              </p>
            </div>

            {/* Area / Neighborhood */}
            <div>
              <label className="block text-[11px] font-bold text-[#111111] tracking-wider mb-2">
                AREA / NEIGHBORHOOD
              </label>
              <input 
                type="text" 
                value={formData.area}
                onChange={(e) => updateField('area', e.target.value)}
                placeholder="Example: Bole"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-0 transition-colors"
              />
              <p className="text-[11px] text-gray-500 mt-2">
                Enter your neighborhood or local area.
              </p>
            </div>

            {/* Landmark (Optional) */}
            <div>
              <label className="block text-[11px] font-bold text-[#111111] tracking-wider mb-2">
                LANDMARK OR ADDITIONAL DIRECTIONS (OPTIONAL)
              </label>
              <input 
                type="text" 
                value={formData.landmark}
                onChange={(e) => updateField('landmark', e.target.value)}
                placeholder="Example: Near Edna Mall"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-0 transition-colors"
              />
              <p className="text-[11px] text-gray-500 mt-2">
                Add a nearby landmark or any detail that helps describe your location.
              </p>
            </div>
          </form>

          {/* Bottom actions */}
          <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col">
            <p className="text-[10px] text-gray-400 text-center mb-8">
              Your progress is saved as you continue
            </p>
            
            <div className="flex flex-col gap-2 items-end w-full">
              {(errors.applicantName || errors.applicantEmail || errors.applicantPhone || errors.city || errors.area) && (
                <p className="text-[12px] text-red-500">
                  {errors.applicantName || errors.applicantEmail || errors.applicantPhone || errors.city || errors.area}
                </p>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center w-full">
                <button 
                  onClick={() => navigate(`${basePath}/selected`)}
                  className="border border-gray-400 bg-transparent text-[#111111] text-[12px] font-medium uppercase tracking-wider py-3 px-6 sm:px-8 rounded-full hover:bg-gray-50 transition flex items-center justify-center w-full sm:w-auto"
                >
                  <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
                <button 
                  onClick={handleContinue}
                  className="bg-[#e6ca64] hover:bg-[#d6b74e] text-[#111111] text-[12px] font-medium uppercase tracking-wider py-3 px-6 sm:px-8 rounded-full transition flex items-center justify-center shadow-sm w-full sm:w-auto"
                >
                  {busy ? 'Saving…' : 'Continue'}
                  <svg className="w-3.5 h-3.5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
              {apiError && <p role="alert" className="text-[12px] text-red-500">{apiError}</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default LocationStep;
