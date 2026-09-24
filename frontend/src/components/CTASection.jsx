import React from 'react';
import { Link } from 'react-router-dom';
import { ctaData } from '../data/home/ctaData';
import Reveal from './Reveal';

const CTASection = () => {
  const { heading, description, cta } = ctaData;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-champagne via-[#d8b642] to-[#b28d24] py-24 md:py-32 px-6 text-center">
      <div className="grain-overlay" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-espresso/10 blur-[110px]"
      />

      <Reveal className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
        <h2 className="font-display text-5xl font-light leading-[1.05] tracking-[-0.01em] text-espresso md:text-6xl">
          {heading}
        </h2>
        <p className="mt-7 max-w-lg text-[15px] leading-relaxed text-espresso/75">
          {description}
        </p>
        <Link
          to="/apply"
          className="group relative mt-11 inline-flex items-center gap-3 overflow-hidden rounded-full bg-espresso px-9 py-4 text-sm font-semibold text-cream shadow-[0_16px_40px_-14px_rgba(34,23,18,0.6)] transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 focus-visible:ring-offset-champagne-light"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-full bg-cream transition-transform duration-400 ease-out group-hover:translate-x-0"
          />
          <span className="relative z-10 transition-colors duration-300 group-hover:text-espresso">
            {cta.label}
          </span>
          <svg
            className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </Reveal>
    </section>
  );
};

export default CTASection;
