import React, { useRef, useState } from 'react';
import {
  X,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Building2,
  PlusCircle,
  LogIn,
  Upload,
  Camera,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BUSINESS_CATEGORIES } from '../../types';
import { db } from '../../lib/mockEngine';
import { compressImage } from '../../lib/media';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, sendOtp, verifyOtp, setAccountSwitcherModalOpen, showToast } = useApp();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [otpCode, setOtpCode] = useState('123456');

  // Business profile fields for create account
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState(BUSINESS_CATEGORIES[1].name);
  const [bio, setBio] = useState('');
  const [contact, setContact] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/src/assets/images/coffee_roaster_1790587302699.jpg');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const { dataUrl } = await compressImage(file, 800, 0.85);
      setAvatarUrl(dataUrl);
      showToast('Profile picture selected!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (!isAuthModalOpen) return null;

  const sampleAvatars = [
    { name: 'Coffee', url: '/src/assets/images/coffee_roaster_1790587302699.jpg' },
    { name: 'Ceramics', url: '/src/assets/images/ceramic_studio_1790587319737.jpg' },
    { name: 'Bakery', url: '/src/assets/images/bakery_pastry_1790587333429.jpg' },
    { name: 'Leather', url: '/src/assets/images/leather_tailor_1790587348791.jpg' },
  ];

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    if (mode === 'signup' && !businessName.trim()) {
      showToast('Please enter your business name.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(authMethod, identifier.trim());
      setStep('otp');
      setOtpCode('123456'); // pre-fill demo OTP for instant convenience
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    setIsLoading(true);
    try {
      const success = await verifyOtp(
        authMethod,
        identifier.trim(),
        otpCode.trim(),
        {
          businessName: businessName.trim() || (authMethod === 'email' ? identifier.split('@')[0] : 'My Business'),
          category,
          bio: bio.trim(),
          contact: contact.trim() || identifier.trim(),
          avatar_url: avatarUrl,
        }
      );
      if (success) {
        closeAuthModal();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSelect = (email: string, name: string) => {
    setIdentifier(email);
    setBusinessName(name);
    setStep('otp');
    setOtpCode('123456');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
              A
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-stone-900">
                {mode === 'signup' ? 'Create Business Account' : 'Business Sign In'}
              </h3>
              <p className="text-[10px] text-stone-500">
                {mode === 'signup' ? 'Showcase your craft on Amapati' : 'Access your business dashboard & feed'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs: Log In vs Create Account */}
        <div className="flex border-b border-stone-100 bg-stone-50/60 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setStep('input');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              mode === 'login' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setStep('input');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              mode === 'signup' ? 'bg-white text-orange-600 shadow-xs' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Step 1: Identifier Input */}
        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Method Toggle: Email vs Phone OTP */}
            <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setAuthMethod('email')}
                className={`py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition ${
                  authMethod === 'email' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email (Default)</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod('phone')}
                className={`py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition ${
                  authMethod === 'phone' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone (SMS OTP)</span>
              </button>
            </div>

            {/* If Create Account Mode: Gather Business Identity Fields */}
            {mode === 'signup' && (
              <div className="space-y-3 p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Copper Hill Roastery, Studio Terra"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Category / Craft</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    {BUSINESS_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Business Bio (Optional)</label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short description of your craftsmanship..."
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                {/* Profile Picture Selection */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1.5">Profile Picture / Logo</label>
                  <div className="flex items-center gap-3">
                    <div className="relative group shrink-0">
                      <img
                        src={avatarUrl}
                        alt="Avatar preview"
                        className="w-12 h-12 rounded-xl object-cover border-2 border-orange-500 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Upload photo"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-semibold transition active:scale-95 flex items-center gap-1 shadow-2xs"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{isUploadingPhoto ? 'Processing...' : 'Upload Photo'}</span>
                        </button>
                        <span className="text-[10px] text-stone-400">or pick studio:</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {sampleAvatars.map((item, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => setAvatarUrl(item.url)}
                            className={`w-6 h-6 rounded-lg overflow-hidden border-2 transition ${
                              avatarUrl === item.url ? 'border-orange-600 scale-105' : 'border-stone-200 opacity-60'
                            }`}
                            title={item.name}
                          >
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email or Phone field */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                {authMethod === 'email' ? 'Business Email Address *' : 'Mobile Phone Number (SMS OTP) *'}
              </label>
              <div className="relative">
                {authMethod === 'email' ? (
                  <input
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="artisan@yourstudio.com"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                ) : (
                  <input
                    type="tel"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                )}
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                A 6-digit one-time passcode will be verified for instant session login.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !identifier.trim()}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              {isLoading
                ? 'Sending...'
                : mode === 'signup'
                ? 'Continue to Verification'
                : 'Send One-Time Passcode'}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Helper: View existing registered accounts */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
              <span className="text-stone-500">Want to switch accounts?</span>
              <button
                type="button"
                onClick={() => {
                  closeAuthModal();
                  setAccountSwitcherModalOpen(true);
                }}
                className="text-orange-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>View All Accounts</span>
              </button>
            </div>

            {/* Quick demo sample businesses */}
            <div className="pt-1">
              <span className="text-[10px] text-stone-400 block text-center mb-1.5">Or log in as a sample artisan business:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('bella.roasters@craft.local', 'Bella Terra Roasters')}
                  className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 text-[11px] font-medium text-stone-700 truncate text-left"
                >
                  ☕ Bella Terra Roasters
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('nadia.ceramics@craft.local', 'Nadia Studio Ceramics')}
                  className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 text-[11px] font-medium text-stone-700 truncate text-left"
                >
                  🏺 Nadia Studio Ceramics
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="p-5 space-y-4 text-xs">
            <div className="text-center">
              <p className="text-stone-600">Enter the 6-digit verification code sent to:</p>
              <p className="font-bold text-stone-900 mt-0.5 font-mono text-sm">{identifier}</p>
              {businessName && (
                <p className="text-[11px] text-orange-600 font-medium mt-0.5">
                  Business: {businessName} ({category})
                </p>
              )}
            </div>

            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-xl font-mono font-bold py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1.5">
                <span>Demo test code: <strong className="text-orange-600 font-mono">123456</strong></span>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-stone-600 hover:underline"
                >
                  Change details
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length < 6}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold shadow-sm transition active:scale-95"
            >
              {isLoading ? 'Verifying...' : mode === 'signup' ? 'Complete Sign Up & Enter' : 'Verify & Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
