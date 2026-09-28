import React, { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If running in standalone mode, hide button
  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 font-medium transition-colors ${
          compact
            ? 'px-2.5 py-1 text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-md border border-orange-200'
            : 'px-3 py-1.5 text-xs bg-stone-900 text-white hover:bg-stone-800 rounded-md shadow-sm'
        }`}
        title="Install Amapati on your device"
      >
        <Download className="w-3.5 h-3.5 text-orange-500" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 font-medium transition-colors ${
            compact
              ? 'px-2.5 py-1 text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-md border border-orange-200'
              : 'px-3 py-1.5 text-xs bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-md'
          }`}
          title="Install on iOS"
        >
          <Share2 className="w-3.5 h-3.5 text-orange-600" />
          <span>Install PWA</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-sm">
                    A
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">Install Amapati</h3>
                    <p className="text-xs text-stone-500">Add to iPhone or iPad Home Screen</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-stone-600">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-800 font-semibold shrink-0">
                    1
                  </span>
                  <p>
                    Tap the <strong className="text-stone-900">Share button</strong> (square with arrow up) at the
                    bottom of Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-800 font-semibold shrink-0">
                    2
                  </span>
                  <p>
                    Scroll down in the share sheet and tap <strong className="text-stone-900">Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-800 font-semibold shrink-0">
                    3
                  </span>
                  <p>Enjoy quick full-screen access to business showcases even offline.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-orange-600 py-2.5 text-xs font-semibold text-white hover:bg-orange-700 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
