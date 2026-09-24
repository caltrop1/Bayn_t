import React from 'react';
import { useNavigate } from 'react-router-dom';
import image1 from '../assets/image/image 1.webp';

const Application = ({ basePath = '/application' }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 py-8 flex justify-center">
      <div className="bg-white flex flex-col md:flex-row w-full shadow-[0_2px_15px_rgba(0,0,0,0.04)] md:min-h-[650px] border border-gray-100/50 rounded-2xl overflow-hidden">
        {/* Left Side: Image */}
        <div className="w-full md:w-1/2 relative h-[260px] sm:h-[320px] md:h-auto">
          <img 
            src={image1} 
            alt="Application portrait" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Side: Content */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 md:p-14 lg:pl-16 flex flex-col justify-center bg-white">
          <p className="text-[#a87b52] text-[10px] font-bold tracking-[0.15em] uppercase mb-4">
            Start Your Journey
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-[42px] font-serif leading-[1.05] text-[#111111] mb-5">
            Let's get your<br />application<br />started.
          </h2>
          <p className="text-[14px] text-gray-500 mb-10 leading-relaxed font-light pr-4">
            We'll guide you through a few simple steps. You can review your information before submitting.
          </p>

          <div className="space-y-5 mb-12">
            {[
              { num: '01', text: 'Choose program' },
              { num: '02', text: 'Tell us about yourself' },
              { num: '03', text: 'Upload documents' },
              { num: '04', text: 'Review' },
              { num: '05', text: 'Payment' }
            ].map((step) => (
              <div key={step.num} className="flex items-center space-x-4">
                <div className="w-[26px] h-[26px] rounded-full border border-gray-200 flex items-center justify-center text-[10px] text-gray-400">
                  {step.num}
                </div>
                <span className="text-[13px] text-gray-600 font-light">{step.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col space-y-4">
            <button 
              onClick={() => navigate(`${basePath}/program`)}
              className="bg-[#f9e076] hover:bg-[#ebd36d] text-[#111111] text-[13px] font-medium py-[14px] px-6 transition flex items-center justify-center w-full max-w-[220px] rounded-full"
            >
              Start Application
              <svg className="w-[14px] h-[14px] ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <button onClick={() => navigate(`${basePath}/program`)} className="bg-transparent border border-[#d2bba0] hover:bg-gray-50 text-[#8a6543] text-[13px] font-medium py-[14px] px-6 transition flex items-center justify-center w-full max-w-[280px] rounded-full">
              Continue an existing application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Application;
