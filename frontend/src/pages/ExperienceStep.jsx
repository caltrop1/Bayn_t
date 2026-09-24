import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApplicationStepper from '../components/application/ApplicationStepper';
import { useApplication } from '../context/ApplicationContext';

const educationOptions = [
  'High School',
  'Certificate',
  'Diploma',
  "Bachelor's Degree",
  "Master's Degree",
  'Other'
];

const experienceOptions = [
  {
    id: 'no_experience',
    title: 'NO EXPERIENCE',
    desc: "I'm completely new to professional makeup."
  },
  {
    id: 'some_experience',
    title: 'SOME EXPERIENCE',
    desc: "I've practiced makeup on myself or others."
  },
  {
    id: 'formal_experience',
    title: 'FORMAL OR PROFESSIONAL EXPERIENCE',
    desc: "I've taken makeup training or worked professionally."
  }
];

const ExperienceStep = () => {
  const navigate = useNavigate();
  const { formData, errors, updateField, validateStep, completeStep, saveStep, basePath } = useApplication();
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleContinue = async () => {
    if (validateStep('experience')) {
      setBusy(true); setApiError('');
      try { await saveStep('experience'); completeStep('experience'); navigate(`${basePath}/documents`); }
      catch (error) { setApiError(error.message || 'Your background information could not be saved. Please try again.'); }
      finally { setBusy(false); }
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 pb-16 flex flex-col items-center">
      <ApplicationStepper currentStep={3} />

      <div className="w-full bg-[#f8f8f8] rounded-xl p-5 sm:p-8 md:p-16">
        
        {/* Header */}
        <div className="mb-12">
          <p className="text-[#a87b52] text-[10px] font-bold tracking-[0.15em] uppercase mb-4">
            BACKGROUND
          </p>
          <h2 className="text-[28px] sm:text-[32px] md:text-[38px] font-serif leading-[1.1] text-[#111111] mb-3">
            Tell us a little about<br />your background.
          </h2>
          <p className="text-[14px] text-gray-500">
            This helps us understand your starting point and learning needs.
          </p>
        </div>

        {/* Education Section */}
        <div className="mb-14">
          <h4 className="text-[11px] font-bold text-[#111111] tracking-wider uppercase mb-2">
            EDUCATION
          </h4>
          <p className="text-[13px] text-gray-500 mb-6">
            What is your highest level of education?
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {educationOptions.map((edu) => {
              const isSelected = formData.education === edu;
              return (
                <div 
                  key={edu}
                  onClick={() => updateField('education', edu)}
                  className={`relative px-4 py-4 border rounded-lg cursor-pointer transition-colors text-center text-[13px] font-medium ${
                    isSelected 
                      ? 'bg-[#eef1ed] border-[#8a9f8b] text-[#111111]' 
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {edu}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-3.5 h-3.5 text-[#6b826d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Experience Section */}
        <div className="mb-14">
          <h4 className="text-[11px] font-bold text-[#111111] tracking-wider uppercase mb-2">
            MAKEUP EXPERIENCE
          </h4>
          <p className="text-[13px] text-[#111111] mb-1">
            Have you studied or practiced makeup before?
          </p>
          <p className="text-[11px] text-gray-500 mb-6">
            Choose the option that best describes your experience.
          </p>
          
          <div className="space-y-3">
            {experienceOptions.map((exp) => {
              const isSelected = formData.experience === exp.id;
              return (
                <div 
                  key={exp.id}
                  onClick={() => updateField('experience', exp.id)}
                  className={`relative flex items-center p-5 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-[#eef1ed] border-[#8a9f8b]' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="mr-5">
                    {isSelected ? (
                      <div className="w-4 h-4 rounded-full border-[4px] border-[#6b826d] bg-white"></div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-300 bg-white"></div>
                    )}
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-[#111111] tracking-wider uppercase mb-1">
                      {exp.title}
                    </h5>
                    <p className="text-[13px] text-gray-500">
                      {exp.desc}
                    </p>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <svg className="w-4 h-4 text-[#6b826d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="pt-8 border-t border-gray-200 flex flex-col">
          <p className="text-[10px] text-gray-400 text-center mb-8">
            Your progress is saved as you continue.
          </p>
          
          <div className="flex flex-col gap-2 items-end w-full">
            {(errors.education || errors.experience) && (
              <p className="text-[12px] text-red-500">
                {!errors.education && errors.experience && errors.experience}
                {errors.education && !errors.experience && errors.education}
                {errors.education && errors.experience && 'Education and experience are required'}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center w-full">
              <button 
                onClick={() => navigate(`${basePath}/location`)}
                className="border border-gray-400 bg-transparent text-[#111111] text-[12px] font-medium uppercase tracking-wider py-3 px-6 sm:px-8 rounded-full hover:bg-white transition flex items-center justify-center w-full sm:w-auto"
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
  );
};

export default ExperienceStep;
