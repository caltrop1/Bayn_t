import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProgramCard from '../components/application/ProgramCard';
import { useApplication } from '../context/ApplicationContext';

const ProgramSelection = () => {
  const { formData, programs, loading, errors, updateField, validateStep, completeStep, ensureDraft, guest } = useApplication();
  const navigate = useNavigate();
  const [busy, setBusy] = React.useState(false);
  const [apiError, setApiError] = React.useState('');
  const handleContinue = async () => {
    if (validateStep('program')) {
      setBusy(true); setApiError('');
      try { if (!guest) await ensureDraft(); completeStep('program'); navigate(`${guest ? '/apply' : '/application'}/selected`); }
      catch (error) { setApiError(error.message || 'Your application could not be started. Please try again.'); }
      finally { setBusy(false); }
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-8 flex flex-col items-center">
      {/* Header Section */}
      <div className="text-center mb-10 mt-6">
        <p className="text-[#a87b52] text-[10px] font-bold tracking-[0.15em] uppercase mb-4">
          PROGRAM
        </p>
        <h2 className="text-3xl sm:text-[34px] md:text-[40px] font-serif leading-[1.1] text-[#111111] mb-3">
          Which program would you like to<br />apply for?
        </h2>
        <p className="text-[14px] text-gray-500">
          Choose the program that best matches your goals.
        </p>
      </div>

      {/* Cards List */}
      <div className="w-full space-y-4 mb-16">
        {loading && <p className="text-sm text-gray-500">Loading available programs…</p>}
        {!loading && !programs.length && <p className="text-sm text-red-600">No open programs are currently available.</p>}
        {programs.map((program) => (
          <ProgramCard
            key={program.id}
            title={program.title}
            description={program.description}
            duration={program.duration}
            level={program.level}
            image={program.image}
            isSelected={formData.programId === program.id}
            onClick={() => updateField('programId', program.id)}
          />
        ))}
      </div>

      {/* Footer Navigation */}
      <div className="w-full flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center pb-10">
        <button 
          onClick={() => navigate(guest ? '/apply' : '/application')}
          className="border border-gray-400 bg-transparent text-[#111111] text-[12px] font-medium uppercase tracking-wider py-3 px-6 sm:px-8 rounded-full hover:bg-gray-50 transition flex items-center justify-center w-full sm:w-auto"
        >
          <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          {errors.programId && (
            <p className="text-[12px] text-red-500">{errors.programId}</p>
          )}
          <button 
            onClick={handleContinue}
            disabled={busy}
            className="bg-[#dfbc55] hover:bg-[#d4b14d] text-[#111111] text-[12px] font-medium uppercase tracking-wider py-3 px-6 sm:px-8 rounded-full transition flex items-center justify-center shadow-sm w-full sm:w-auto"
          >
            {busy ? 'Saving…' : 'Continue'}
            <svg className="w-3.5 h-3.5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          {apiError && <p role="alert" className="text-[12px] text-red-500">{apiError}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProgramSelection;
