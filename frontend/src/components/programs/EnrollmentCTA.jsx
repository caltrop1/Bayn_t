import React from 'react';
import { Link } from 'react-router-dom';

const EnrollmentCTA = () => {
  return (
    <section className="px-4 sm:px-6 md:px-8 py-12 sm:py-20 max-w-[1240px] mx-auto w-full">
      <div className="bg-[#b38865] rounded-[24px] sm:rounded-[32px] md:rounded-[44px] py-12 sm:py-16 md:py-24 px-6 sm:px-10 flex flex-col items-center justify-center text-center shadow-sm">
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white font-normal leading-tight mb-8">
          Enrollment Now Open
        </h2>
        
        <Link to="/apply" className="bg-[#eec15b] hover:bg-[#d8ae52] text-[#1c1c1c] px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-[11px] sm:text-[12px] font-bold uppercase tracking-wider transition-colors shadow-sm inline-block whitespace-nowrap">
          Apply Now
        </Link>
      </div>
    </section>
  );
};

export default EnrollmentCTA;
