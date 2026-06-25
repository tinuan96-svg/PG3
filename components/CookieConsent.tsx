'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShowBanner(false);
  };

  const rejectNonEssential = () => {
    localStorage.setItem('cookie_consent', 'essential_only');
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <>
          {/* Background overlay to dim the screen and prevent interaction with content behind */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-[3px]"
            onClick={rejectNonEssential}
          />

          {/* Centered Modal for Mobile to avoid overlapping floating buttons at the bottom */}
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto border border-gray-100 flex flex-col"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-3xl bg-[#0F2747]/5 flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-8 h-8 text-[#0F2747]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-[#0F2747] mb-3 leading-tight">
                  Privacy Settings
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  We use cookies to enhance your experience. By clicking "Accept All", you consent to our use of cookies.
                  <a href="/legal/cookie-policy" className="ml-1 font-semibold underline underline-offset-4 decoration-[#5FAE9B]/30 hover:decoration-[#5FAE9B]" style={{ color: '#5FAE9B' }}>
                    Learn more
                  </a>
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={acceptAll}
                    className="w-full py-4 rounded-2xl font-bold text-sm text-white shadow-lg transition-all active:scale-[0.97] hover:opacity-90"
                    style={{ backgroundColor: '#5FAE9B' }}
                  >
                    Accept All Cookies
                  </button>
                  <button
                    onClick={rejectNonEssential}
                    className="w-full py-4 rounded-2xl font-bold text-sm text-[#0F2747] bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.97]"
                  >
                    Essential Only
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
