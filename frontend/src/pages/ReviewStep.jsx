import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApplicationStepper from '../components/application/ApplicationStepper';
import { useApplication } from '../context/ApplicationContext';

const ReviewStep = () => {
  const navigate = useNavigate();
  const { formData, getSelectedProgram, completeStep, basePath } = useApplication();
  const [agreed, setAgreed] = useState(false);
  const program = getSelectedProgram();

  const experienceLabels = {
    no_experience: 'No Experience',
    some_experience: 'Some Experience',
    formal_experience: 'Formal / Professional Experience',
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 pb-16 flex flex-col items-center">
      <ApplicationStepper currentStep={5} />

      <div className="w-full mt-8">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[#a87b52] text-[10px] font-bold tracking-[0.15em] uppercase mb-4">
            REVIEW
          </p>
          <h2 className="text-[32px] md:text-[38px] font-serif leading-[1.1] text-[#111111] mb-3">
            Make sure everything looks<br />right.
          </h2>
          <p className="text-[13px] text-gray-500">
            Review your information before moving to payment.
          </p>
        </div>

        <div className="h-[1px] bg-gray-200 w-full mb-10"></div>

        {/* Location Information */}
        <div className="mb-10">
          <h3 className="text-[22px] font-serif text-[#111111] mb-6">
            Location
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 mb-4">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                CITY
              </p>
              <p className="text-[14px] text-[#111111]">{formData.city || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                AREA
              </p>
              <p className="text-[14px] text-[#111111]">{formData.area || '—'}</p>
            </div>
            {formData.landmark && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  LANDMARK
                </p>
                <p className="text-[14px] text-[#111111]">{formData.landmark}</p>
              </div>
            )}
          </div>
        </div>

        {/* Background */}
        <div className="mb-10">
          <h3 className="text-[22px] font-serif text-[#111111] mb-6">
            Background
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 mb-4">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                EDUCATION
              </p>
              <p className="text-[14px] text-[#111111]">{formData.education || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                EXPERIENCE
              </p>
              <p className="text-[14px] text-[#111111]">{experienceLabels[formData.experience] || '—'}</p>
            </div>
          </div>
        </div>

        {/* Program & Intake */}
        {program && (
          <div className="bg-[#f2f5f2] rounded-xl p-5 sm:p-8 mb-10">
            <h3 className="text-[20px] font-serif text-[#111111] mb-6">
              Program & Intake
            </h3>
            <div className="mb-5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                SELECTED PROGRAM
              </p>
              <p className="text-[14px] text-[#111111]">{program.title}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  DURATION
                </p>
                <p className="text-[14px] text-[#111111]">{program.duration}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  LEVEL
                </p>
                <p className="text-[14px] text-[#111111]">{program.level}</p>
              </div>
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="mb-12">
          <h3 className="text-[22px] font-serif text-[#111111] mb-6">
            Documents
          </h3>

          <div className="flex items-center space-x-2 mb-4">
            {formData.idDocument && formData.profilePhoto ? (
              <>
                <svg className="w-4 h-4 text-[#6b826d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                </svg>
                <p className="text-[13px] text-gray-600">Required documents complete</p>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                </svg>
                <p className="text-[13px] text-red-500">Required documents missing</p>
              </>
            )}
          </div>

          <div className="space-y-2">
            {formData.idDocument && (
              <div className="flex items-center space-x-2 min-w-0">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-[13px] text-gray-600 truncate">{formData.idDocument.name}</p>
              </div>
            )}
            {formData.profilePhoto && (
              <div className="flex items-center space-x-2 min-w-0">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-[13px] text-gray-600 truncate">{formData.profilePhoto.name}</p>
              </div>
            )}
            {formData.supportingDoc && (
              <div className="flex items-center space-x-2 min-w-0">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-[13px] text-gray-600 truncate">{formData.supportingDoc.name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="h-[1px] bg-gray-200 w-full mb-8"></div>

        {/* Confirm Checkbox */}
        <div className="flex items-start space-x-3 mb-12">
          <div
            onClick={() => setAgreed(!agreed)}
            className={`w-4 h-4 mt-0.5 flex-shrink-0 border rounded-md cursor-pointer transition-colors ${
              agreed ? 'bg-[#404c40] border-[#404c40]' : 'bg-white border-gray-400'
            }`}
          >
            {agreed && (
              <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <p className="text-[12px] text-gray-600 leading-relaxed cursor-pointer" onClick={() => setAgreed(!agreed)}>
            I confirm that the information I provided is accurate and I agree to the academy's application terms and privacy policy.
          </p>
        </div>

        {/* Bottom navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <button
            onClick={() => navigate(`${basePath}/documents`)}
            className="border border-gray-400 bg-transparent text-[#111111] text-[12px] font-medium uppercase tracking-wider py-3 px-6 sm:px-8 rounded-full hover:bg-gray-50 transition flex items-center justify-center w-full sm:w-auto"
          >
            <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <button
            disabled={!agreed}
            onClick={() => { completeStep('review'); navigate(`${basePath}/payment`); }}
            className={`text-[12px] font-medium uppercase tracking-wider py-3 px-6 sm:px-8 rounded-full transition flex items-center justify-center shadow-sm w-full sm:w-auto ${
              agreed
                ? 'bg-[#e6ca64] hover:bg-[#d6b74e] text-[#111111] cursor-pointer'
                : 'bg-[#e6ca64]/50 text-[#111111]/50 cursor-not-allowed'
            }`}
          >
            Continue to Payment
            <svg className="w-3.5 h-3.5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReviewStep;
