import React, { useState, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Maximize2,
  Sparkles,
  Building2,
  MapPin,
  ShieldCheck,
  Palette,
  Layout,
  ExternalLink,
  QrCode,
  Share2,
} from 'lucide-react';
import { Profile } from '../../types';
import { useApp } from '../../context/AppContext';

interface BusinessQRCodeModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
}

type ThemeStyle = 'terracotta' | 'minimal' | 'charcoal';
type CardFormat = 'stand' | 'badge';

export const BusinessQRCodeModal: React.FC<BusinessQRCodeModalProps> = ({
  profile,
  isOpen,
  onClose,
}) => {
  const { showToast } = useApp();

  const [theme, setTheme] = useState<ThemeStyle>('terracotta');
  const [format, setFormat] = useState<CardFormat>('stand');
  const [boothNote, setBoothNote] = useState<string>('Artisan Market Table');
  const [customCta, setCustomCta] = useState<string>(
    'Scan to explore our craft showcases, origin stories & direct messages'
  );
  const [includeCenterLogo, setIncludeCenterLogo] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  // Real or deep link for the business profile
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://amapati.app';
  const profileUrl = `${origin}/#profile-${profile.id}`;
  const shortHandle = `@${profile.id.replace('user_', '')}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      setIsCopied(true);
      showToast('Profile link copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2200);
    }
  };

  const handleDownloadPNG = () => {
    if (!canvasRef.current) {
      showToast('Preparing download...', 'info');
      return;
    }
    try {
      const qrCanvas = canvasRef.current;
      // Create an offscreen composite canvas to draw the full market tabletop card
      const width = format === 'stand' ? 800 : 700;
      const height = format === 'stand' ? 1100 : 700;
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const ctx = offscreen.getContext('2d');

      if (!ctx) return;

      // Background styling
      if (theme === 'charcoal') {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(0, 0, width, height);
      } else if (theme === 'terracotta') {
        ctx.fillStyle = '#fafaf9';
        ctx.fillRect(0, 0, width, height);
        // Terracotta accent border
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 14;
        ctx.strokeRect(7, 7, width - 14, height - 14);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#e7e5e4';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, width - 4, height - 4);
      }

      // Draw Header Text
      ctx.textAlign = 'center';

      if (format === 'stand') {
        // Brand Header Badge
        ctx.fillStyle = theme === 'charcoal' ? '#ea580c' : '#c2410c';
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('AMAPATI ARTISAN SHOWCASE', width / 2, 80);

        // Business Name
        ctx.fillStyle = theme === 'charcoal' ? '#ffffff' : '#0c0a09';
        ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(profile.business_name, width / 2, 145);

        // Category & Location
        ctx.fillStyle = theme === 'charcoal' ? '#a8a29e' : '#78716c';
        ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const subtitle = `${profile.category} · ${profile.location || 'Local Workshop'}`;
        ctx.fillText(subtitle, width / 2, 185);

        if (boothNote.trim()) {
          ctx.fillStyle = theme === 'charcoal' ? '#ea580c' : '#c2410c';
          ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(`• ${boothNote.trim().toUpperCase()} •`, width / 2, 225);
        }

        // QR Code Box Container
        const qrSize = 460;
        const qrX = (width - qrSize) / 2;
        const qrY = 280;

        ctx.fillStyle = '#ffffff';
        ctx.roundRect
          ? ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 24)
          : ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
        ctx.fill();
        ctx.strokeStyle = '#e7e5e4';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

        // CTA Text
        ctx.fillStyle = theme === 'charcoal' ? '#e7e5e4' : '#1c1917';
        ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(customCta, width / 2, 830, width - 80);

        // Short link & Instructions
        ctx.fillStyle = theme === 'charcoal' ? '#ea580c' : '#c2410c';
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`amapati.app/${shortHandle}`, width / 2, 900);

        ctx.fillStyle = theme === 'charcoal' ? '#78716c' : '#a8a29e';
        ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Open your phone camera to scan', width / 2, 940);
      } else {
        // Square Badge Format
        ctx.fillStyle = theme === 'charcoal' ? '#ffffff' : '#0c0a09';
        ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(profile.business_name, width / 2, 85);

        ctx.fillStyle = theme === 'charcoal' ? '#a8a29e' : '#78716c';
        ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(profile.category, width / 2, 120);

        const qrSize = 360;
        const qrX = (width - qrSize) / 2;
        const qrY = 160;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32);
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

        ctx.fillStyle = theme === 'charcoal' ? '#ea580c' : '#c2410c';
        ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`amapati.app/${shortHandle}`, width / 2, 590);

        ctx.fillStyle = theme === 'charcoal' ? '#78716c' : '#a8a29e';
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Scan to view artisan showcases', width / 2, 630);
      }

      // Download triggered
      const sanitizedName = profile.business_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `${sanitizedName}_amapati_market_stand.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = offscreen.toDataURL('image/png');
      link.click();
      showToast('Market stand QR image downloaded!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate image file.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Hidden offscreen canvas used to render high-res PNG for download */}
      <div className="hidden">
        <QRCodeCanvas
          ref={canvasRef}
          value={profileUrl}
          size={512}
          level="H"
          marginSize={2}
          imageSettings={
            includeCenterLogo && profile.avatar_url
              ? {
                  src: profile.avatar_url,
                  height: 90,
                  width: 90,
                  excavate: true,
                }
              : undefined
          }
        />
      </div>

      <div
        className={`w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh] ${
          isFullscreen ? 'fixed inset-0 max-w-none rounded-none z-50 max-h-none' : ''
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 shadow-2xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <span>Artisan Market QR Stand</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-700 font-semibold">
                  Print & Display
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                Tabletop signage for farmers markets, pop-ups, and studio tasting rooms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Tabletop Tablet Display Mode'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Customization Options Bar */}
          {!isFullscreen && (
            <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Theme Selector */}
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="font-bold text-stone-700">Theme:</span>
                  <div className="flex items-center bg-white p-0.5 rounded-xl border border-stone-200">
                    <button
                      onClick={() => setTheme('terracotta')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        theme === 'terracotta'
                          ? 'bg-orange-600 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Terracotta
                    </button>
                    <button
                      onClick={() => setTheme('minimal')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        theme === 'minimal'
                          ? 'bg-stone-900 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Minimal
                    </button>
                    <button
                      onClick={() => setTheme('charcoal')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        theme === 'charcoal'
                          ? 'bg-stone-800 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Charcoal
                    </button>
                  </div>
                </div>

                {/* Format Selector */}
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="font-bold text-stone-700">Format:</span>
                  <div className="flex items-center bg-white p-0.5 rounded-xl border border-stone-200">
                    <button
                      onClick={() => setFormat('stand')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        format === 'stand'
                          ? 'bg-orange-600 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Table Stand (5×7)
                    </button>
                    <button
                      onClick={() => setFormat('badge')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        format === 'badge'
                          ? 'bg-orange-600 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Square Tag / Box
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Customization Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-stone-200/60">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Event / Booth Label
                  </label>
                  <input
                    type="text"
                    value={boothNote}
                    onChange={(e) => setBoothNote(e.target.value)}
                    placeholder="e.g. Booth #14 · Saturday Market"
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Call-to-Action Subtitle
                  </label>
                  <input
                    type="text"
                    value={customCta}
                    onChange={(e) => setCustomCta(e.target.value)}
                    placeholder="e.g. Scan for roasted beans & artisan menu"
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tabletop Card Display Area */}
          <div className="flex justify-center">
            <div
              ref={printAreaRef}
              className={`transition-all duration-200 text-center select-none shadow-xl ${
                format === 'stand'
                  ? 'w-full max-w-[340px] sm:max-w-[380px] p-6 sm:p-8 rounded-3xl'
                  : 'w-full max-w-[320px] p-6 rounded-3xl'
              } ${
                theme === 'charcoal'
                  ? 'bg-stone-900 text-white border-2 border-stone-800'
                  : theme === 'terracotta'
                  ? 'bg-stone-50/90 text-stone-900 border-4 border-orange-600'
                  : 'bg-white text-stone-900 border border-stone-300'
              }`}
            >
              {/* Card Wordmark & Header */}
              <div className="mb-4">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span className="font-display text-xs font-black tracking-widest uppercase text-orange-600">
                    Amapati Artisan
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                </div>

                <div className="flex justify-center mb-2.5">
                  <img
                    src={profile.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
                    alt={profile.business_name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-orange-500/20"
                  />
                </div>

                <h3 className="font-display text-xl font-black tracking-tight flex items-center justify-center gap-1.5">
                  <span>{profile.business_name}</span>
                  {profile.is_verified && (
                    <ShieldCheck className="w-4 h-4 text-blue-500 fill-blue-100" />
                  )}
                </h3>

                <p
                  className={`text-xs mt-0.5 ${
                    theme === 'charcoal' ? 'text-stone-400' : 'text-stone-600'
                  }`}
                >
                  {profile.category} · {profile.location || 'Local Workshop'}
                </p>

                {boothNote.trim() && (
                  <div className="mt-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold tracking-wide uppercase border border-orange-200">
                      {boothNote.trim()}
                    </span>
                  </div>
                )}
              </div>

              {/* The Scannable QR Code Frame */}
              <div className="my-4 flex justify-center">
                <div className="p-4 bg-white rounded-2xl border-2 border-stone-200/80 shadow-md">
                  <QRCodeSVG
                    value={profileUrl}
                    size={format === 'stand' ? 200 : 170}
                    level="H"
                    includeMargin={false}
                    imageSettings={
                      includeCenterLogo && profile.avatar_url
                        ? {
                            src: profile.avatar_url,
                            height: 38,
                            width: 38,
                            excavate: true,
                          }
                        : undefined
                    }
                  />
                </div>
              </div>

              {/* Call to Action and URL display */}
              <div className="space-y-1.5">
                <p
                  className={`text-xs font-semibold leading-snug px-2 ${
                    theme === 'charcoal' ? 'text-stone-300' : 'text-stone-800'
                  }`}
                >
                  {customCta}
                </p>

                <div className="pt-2 border-t border-stone-200/60 mt-3">
                  <p className="font-mono text-sm font-bold text-orange-600 tracking-tight">
                    amapati.app/{shortHandle}
                  </p>
                  <p
                    className={`text-[10px] mt-0.5 ${
                      theme === 'charcoal' ? 'text-stone-500' : 'text-stone-400'
                    }`}
                  >
                    Open camera on iPhone or Android to scan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Download & Print Actions */}
        <div className="p-4 border-t border-stone-200/80 bg-stone-50 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-white text-stone-700 font-semibold transition flex items-center gap-1.5 active:scale-95 shadow-2xs"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Link Copied' : 'Copy Link'}</span>
            </button>

            <label className="hidden sm:flex items-center gap-1.5 cursor-pointer ml-2 text-stone-600 text-xs">
              <input
                type="checkbox"
                checked={includeCenterLogo}
                onChange={(e) => setIncludeCenterLogo(e.target.checked)}
                className="rounded border-stone-300 text-orange-600 focus:ring-orange-500"
              />
              <span>Avatar in center</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 text-xs font-semibold shadow-2xs transition active:scale-95 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-stone-600" />
              <span>Print Stand</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Download Market Sign (PNG)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
