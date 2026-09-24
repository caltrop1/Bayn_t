import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { publicService } from '../services/applicationService';

const Footer = () => {
  const [email, setEmail] = useState(''); const [message, setMessage] = useState('');
  const subscribe = async () => { try { await publicService.subscribe(email); setMessage('Subscribed.'); setEmail(''); } catch { setMessage('Please enter a valid email.'); } };
  return (
    <footer className="relative overflow-hidden bg-espresso text-cream">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-champagne/10 blur-[120px]"
      />

      {/* Main Footer */}
      <div className="relative z-10 mx-auto w-[90%] max-w-7xl py-20 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-16">
        {/* Left - Logo + Newsletter */}
        <div className="md:col-span-1">
          <p className="mb-6 font-script text-4xl italic text-champagne-light">Lumière</p>
          <p className="mb-4 text-[13px] leading-relaxed text-cream/60">
            Join our newsletter for new course dates and academy news.
          </p>
          <div className="mb-4 flex items-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-l-full border border-white/20 bg-transparent px-4 py-2.5 text-[13px] text-cream placeholder-white/50 outline-none transition focus:border-champagne"
            />
            <button className="whitespace-nowrap rounded-r-full bg-champagne px-5 py-2.5 text-[13px] font-semibold text-espresso transition-colors duration-300 hover:bg-champagne-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne-light">
              Subscribe
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-cream/40">
            By subscribing you agree to our Privacy Policy and consent to receive updates from our academy.
          </p>
        </div>

        {/* Academy Links */}
        <div>
          <h4 className="mb-6 text-[11px] font-bold uppercase tracking-[0.25em] text-champagne-light/90">Academy</h4>
          <ul className="space-y-4 text-[14px] text-cream/70">
            <li><Link to="/about" className="relative transition-colors duration-300 hover:text-cream after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-champagne after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100">About</Link></li>
            <li><Link to="/programs" className="relative transition-colors duration-300 hover:text-cream after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-champagne after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100">Programs</Link></li>
            <li><Link to="/teachers" className="relative transition-colors duration-300 hover:text-cream after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-champagne after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100">Teachers</Link></li>
            <li><Link to="/gallery" className="relative transition-colors duration-300 hover:text-cream after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-champagne after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100">Gallery</Link></li>
            <li><Link to="/events" className="relative transition-colors duration-300 hover:text-cream after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-champagne after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100">Events</Link></li>
          </ul>
        </div>

        {/* Admissions Links */}
        <div>
          <h4 className="mb-6 text-[11px] font-bold uppercase tracking-[0.25em] text-champagne-light/90">Admissions</h4>
          <ul className="space-y-4 text-[14px] text-cream/70">
            <li><Link to="/apply" className="relative transition-colors duration-300 hover:text-cream after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-champagne after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100">Apply Now</Link></li>
            <li><Link to="/faq" className="relative transition-colors duration-300 hover:text-cream after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-champagne after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100">FAQ</Link></li>
            <li><Link to="/contact" className="relative transition-colors duration-300 hover:text-cream after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-champagne after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100">Contact</Link></li>
            <li><Link to="/privacy-policy" className="relative transition-colors duration-300 hover:text-cream after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-champagne after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100">Privacy Policy</Link></li>
            <li><a href="#" className="relative transition-colors duration-300 hover:text-cream after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-champagne after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100">Terms of Service</a></li>
          </ul>
        </div>

        {/* Connect / Social */}
        <div>
          <h4 className="mb-6 text-[11px] font-bold uppercase tracking-[0.25em] text-champagne-light/90">Connect</h4>
          <ul className="space-y-4 text-[14px] text-cream/70">
            <li>
              <a href="#" className="group flex items-center space-x-3 transition-colors duration-300 hover:text-cream">
                <svg className="h-5 w-5 text-champagne-light/70 transition-colors duration-300 group-hover:text-champagne-light" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.003 4.388 10.974 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.047 24 18.076 24 12.073z" /></svg>
                <span>Facebook</span>
              </a>
            </li>
            <li>
              <a href="#" className="group flex items-center space-x-3 transition-colors duration-300 hover:text-cream">
                <svg className="h-5 w-5 text-champagne-light/70 transition-colors duration-300 group-hover:text-champagne-light" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                <span>Instagram</span>
              </a>
            </li>
            <li>
              <a href="#" className="group flex items-center space-x-3 transition-colors duration-300 hover:text-cream">
                <svg className="h-5 w-5 text-champagne-light/70 transition-colors duration-300 group-hover:text-champagne-light" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                <span>X</span>
              </a>
            </li>
            <li>
              <a href="#" className="group flex items-center space-x-3 transition-colors duration-300 hover:text-cream">
                <svg className="h-5 w-5 text-champagne-light/70 transition-colors duration-300 group-hover:text-champagne-light" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                <span>LinkedIn</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex w-[90%] max-w-7xl flex-col items-center justify-between py-6 text-[13px] text-cream/50 md:flex-row">
          <p>&copy; 2026 Lumière Makeup Academy. All rights reserved.</p>
          <div className="mt-4 flex space-x-6 md:mt-0">
            <Link to="/privacy-policy" className="underline underline-offset-2 transition-colors duration-300 hover:text-champagne-light">Privacy Policy</Link>
            <a href="#" className="underline underline-offset-2 transition-colors duration-300 hover:text-champagne-light">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
