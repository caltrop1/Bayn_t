import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApplicationStepper from '../components/application/ApplicationStepper';
import { useApplication } from '../context/ApplicationContext';

const SelectedProgram = () => {
  const navigate = useNavigate();
  const { getSelectedProgram, intakes, formData, errors, updateField, validateStep, completeStep, saveStep, guest } = useApplication();
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState('');
  const program = getSelectedProgram();

  if (!program) {
    navigate(`${guest ? '/apply' : '/application'}/program`);
    return null;
  }

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 pb-16 flex flex-col items-center">
      <ApplicationStepper currentStep={1} />
      
      <div className="text-center mb-10 px-4">
        <h2 className="text-3xl sm:text-4xl md:text-[44px] font-serif leading-[1.1] text-[#111111] mb-4">
          Let's get your application<br />started
        </h2>
        <p className="text-[14px] text-gray-500">
          Complete a few simple steps to submit your application.
        </p>
      </div>

      <div className="w-full max-w-[800px] bg-[#eef1ed] rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        {/* Left Side: Image */}
        <div className="w-full md:w-1/2 h-[220px] sm:h-[300px] md:h-[450px]">
          <img 
            src={program.image} 
            alt={program.title} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Side: Content */}
        <div className="w-full md:w-1/2 p-5 sm:p-8 md:p-12 flex flex-col justify-center">
          <h3 className="text-2xl sm:text-[28px] font-serif text-[#111111] mb-4">
            {program.title}
          </h3>
          
          <div className="mb-8">
            <span className="inline-block px-3 py-1 text-[10px] uppercase tracking-wider text-[#526353] border border-[#a8b8a9] rounded-full bg-transparent">
              {program.level}
            </span>
          </div>
          
          <div className="space-y-6 mb-10">
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Intake<select value={formData.intakeId || ''} onChange={(e) => updateField('intakeId', e.target.value)} className="mt-2 w-full border rounded-lg p-3 text-sm"><option value="">Select an open intake</option>{intakes.map((intake) => <option key={intake.id} value={intake.id}>{intake.name} ({intake.start_date} – {intake.end_date})</option>)}</select>{errors.intakeId && <span className="text-red-600 text-xs">{errors.intakeId}</span>}</label>
            {/* Duration */}
            <div className="flex items-start">
              <svg className="w-5 h-5 text-gray-500 mr-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Duration</p>
                <p className="text-[14px] text-[#111111]">{program.duration}</p>
              </div>
            </div>
            
            <div className="h-[1px] w-full bg-gray-200/60"></div>
            
            {/* Category */}
            <div className="flex items-start">
              <svg className="w-5 h-5 text-gray-500 mr-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Category</p>
                <p className="text-[14px] text-[#111111]">{program.category}</p>
              </div>
            </div>
            
            <div className="h-[1px] w-full bg-gray-200/60"></div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <button 
              onClick={async () => { if (validateStep('selected')) { setBusy(true); setApiError(''); try { if (!guest) await saveStep('selected'); completeStep('selected'); navigate(`${guest ? '/apply' : '/application'}/location`); } catch (error) { setApiError(error.message || 'Your intake could not be saved. Please try again.'); } finally { setBusy(false); } } }}
              disabled={busy}
              className="bg-[#eec15b] hover:bg-[#d9af50] text-[#111111] text-[12px] font-bold uppercase tracking-wider py-3.5 px-8 rounded-full transition"
            >
              {busy ? 'Saving…' : 'Continue'}
            </button>
            <button 
              onClick={() => navigate(`${guest ? '/apply' : '/application'}/program`)}
              className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-800 transition underline underline-offset-4 w-full sm:w-auto text-center"
            >
              Change Program
            </button>
          </div>
          {apiError && <p role="alert" className="mt-3 text-sm text-red-600">{apiError}</p>}
        </div>
      </div>
    </div>
  );
};

export default SelectedProgram;
