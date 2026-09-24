import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApplicationStepper from '../components/application/ApplicationStepper';
import FileUploadZone from '../components/application/FileUploadZone';
import { useApplication } from '../context/ApplicationContext';

const DocumentsStep = () => {
  const navigate = useNavigate();
  const { formData, errors, updateField, validateStep, completeStep, uploadDocuments, basePath } = useApplication();
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleContinue = async () => {
    if (validateStep('documents')) {
      setBusy(true); setApiError('');
      try { await uploadDocuments(); completeStep('documents'); navigate(`${basePath}/review`); }
      catch (error) { setApiError(error.message || 'Your documents could not be uploaded. Please try again.'); }
      finally { setBusy(false); }
    }
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 pb-16 flex flex-col items-center">
      <ApplicationStepper currentStep={4} />

      <div className="w-full flex flex-col md:flex-row gap-10 md:gap-12 lg:gap-20 mt-10">

        {/* Left: Section header */}
        <div className="md:w-[260px] flex-shrink-0">
          <p className="text-[#a87b52] text-[10px] font-bold tracking-[0.15em] uppercase mb-4">
            DOCUMENTS
          </p>
          <h2 className="text-[28px] sm:text-[32px] md:text-[36px] font-serif leading-[1.1] text-[#111111] mb-4">
            Let's add your<br />documents.
          </h2>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            We just need a few documents to complete your application.
          </p>
        </div>

        {/* Right: Upload zones */}
        <div className="flex-1 space-y-10">

          {/* Identification */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-[11px] font-bold text-[#111111] tracking-wider uppercase">
                IDENTIFICATION
              </h4>
              <span className="text-[10px] font-semibold text-[#a87b52] tracking-wider uppercase border border-[#d2bba0] px-2 py-0.5 rounded-full">
                REQUIRED
              </span>
            </div>
            <p className="text-[13px] text-gray-500 mb-4">
              Government-issued ID. Upload a clear photo or scan of your ID.
            </p>
            <FileUploadZone
              icon="document"
              file={formData.idDocument}
              onFileChange={(f) => updateField('idDocument', f)}
            />
          </div>

          {/* Profile Photo */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-[11px] font-bold text-[#111111] tracking-wider uppercase">
                PROFILE PHOTO
              </h4>
              <span className="text-[10px] font-semibold text-[#a87b52] tracking-wider uppercase border border-[#d2bba0] px-2 py-0.5 rounded-full">
                REQUIRED
              </span>
            </div>
            <p className="text-[13px] text-gray-500 mb-4">
              Passport-style photo. Use a recent, clear photo of yourself.
            </p>
            <FileUploadZone
              icon="photo"
              file={formData.profilePhoto}
              onFileChange={(f) => updateField('profilePhoto', f)}
            />
          </div>

          {/* Supporting Document */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-[11px] font-bold text-[#111111] tracking-wider uppercase">
                SUPPORTING DOCUMENT
              </h4>
              <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase border border-gray-300 px-2 py-0.5 rounded-full">
                OPTIONAL
              </span>
            </div>
            <p className="text-[13px] text-gray-500 mb-4">
              Upload any additional document requested by the academy.
            </p>
            <FileUploadZone
              icon="document"
              file={formData.supportingDoc}
              onFileChange={(f) => updateField('supportingDoc', f)}
            />
          </div>

          {/* Bottom navigation */}
          <div className="pt-8 flex flex-col gap-2 items-end">
            {(errors.idDocument || errors.profilePhoto) && (
              <p className="text-[12px] text-red-500">
                {!errors.idDocument && errors.profilePhoto && errors.profilePhoto}
                {errors.idDocument && !errors.profilePhoto && errors.idDocument}
                {errors.idDocument && errors.profilePhoto && 'ID and profile photo are required'}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center w-full">
              <button
                onClick={() => navigate(`${basePath}/experience`)}
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
                {busy ? 'Uploading…' : 'Continue'}
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

export default DocumentsStep;
