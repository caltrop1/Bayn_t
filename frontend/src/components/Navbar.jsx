import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const navRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const isAtTop = currentY < 10;

      setAtTop(isAtTop);

      if (isAtTop) {
        setVisible(true);
      } else if (currentY > lastScrollY.current) {
        // scrolling down — hide
        setVisible(false);
      } else {
        // scrolling up — show
        setVisible(true);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const desktopLinkClass = (path) =>
    `relative transition-colors duration-300 capitalize pb-0.5 after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-champagne-light after:transition-transform after:duration-300 hover:after:scale-x-100 ${
      isActive(path) ? 'text-white after:scale-x-100' : 'text-white/80 hover:text-white'
    }`;

  const mobileLinkClass = (path) =>
    `transition-colors duration-300 capitalize text-center ${isActive(path) ? 'text-white underline underline-offset-[6px] decoration-champagne decoration-2' : 'text-white/70 hover:text-white'}`;

  return (
    <div
      ref={navRef}
      className={`z-50 fixed top-0 left-0 right-0 flex justify-center transition-all duration-500 ease-in-out
        ${atTop ? 'pt-5' : 'pt-3'}
        ${!atTop && !visible ? '-translate-y-[150%] opacity-0' : 'translate-y-0 opacity-100'}
      `}
    >
      <nav
        className={`flex justify-between items-center px-6 rounded-full w-[90%] max-w-4xl text-white border backdrop-blur-xl transition-all duration-500 ease-in-out
          ${atTop
            ? 'py-3 border-white/25 bg-gradient-to-br from-espresso-soft/70 to-espresso/60 shadow-[0_8px_20px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.12)]'
            : 'py-2.5 border-white/30 bg-gradient-to-br from-espresso-soft/90 to-espresso/85 shadow-[0_10px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]'
          }`}
      >
        <Link to="/" className="flex flex-col items-start justify-center leading-none">
          <span className="text-xl font-serif tracking-wide">Lumière</span>
          <span className="text-[8px] uppercase tracking-[0.15em] text-white/90 mt-0.5">MAKEUP ACADEMY</span>
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6 text-xs font-medium text-white/90">
          <li><Link to="/about" className={desktopLinkClass('/about')}>about</Link></li>
          <li><Link to="/programs" className={desktopLinkClass('/programs')}>programs</Link></li>
          <li><Link to="/teachers" className={desktopLinkClass('/teachers')}>teachers</Link></li>
          <li><Link to="/gallery" className={desktopLinkClass('/gallery')}>gallery</Link></li>
          <li><Link to="/events" className={desktopLinkClass('/events')}>events</Link></li>
          <li><Link to="/contact" className={desktopLinkClass('/contact')}>contact</Link></li>
        </ul>

        <Link
          to="/apply"
          className="hidden md:block bg-champagne-light text-espresso px-6 py-2 rounded-full text-xs font-semibold uppercase hover:bg-champagne hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-[0_4px_14px_rgba(201,162,39,0.35)]"
        >
          Apply Now
        </Link>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white/70 hover:text-white focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-[72px] left-0 right-0 mx-auto w-[90%] bg-espresso-soft border border-white/10 rounded-2xl p-4 flex flex-col space-y-4 shadow-xl md:hidden z-40">
          <Link to="/about" className={mobileLinkClass('/about')} onClick={() => setIsOpen(false)}>about</Link>
          <Link to="/programs" className={mobileLinkClass('/programs')} onClick={() => setIsOpen(false)}>programs</Link>
          <Link to="/teachers" className={mobileLinkClass('/teachers')} onClick={() => setIsOpen(false)}>teachers</Link>
          <Link to="/gallery" className={mobileLinkClass('/gallery')} onClick={() => setIsOpen(false)}>gallery</Link>
          <Link to="/events" className={mobileLinkClass('/events')} onClick={() => setIsOpen(false)}>events</Link>
          <Link to="/contact" className={mobileLinkClass('/contact')} onClick={() => setIsOpen(false)}>contact</Link>
          <Link
            to="/apply"
            className="bg-champagne-light text-espresso px-6 py-2 rounded-full text-xs font-semibold uppercase w-full text-center hover:bg-champagne active:scale-[0.98] transition-all duration-200 inline-block"
            onClick={() => setIsOpen(false)}
          >
            Apply Now
          </Link>
        </div>
      )}
    </div>
  );
};

export default Navbar;
