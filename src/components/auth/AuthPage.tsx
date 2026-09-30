import React, { useRef, useState } from 'react';
import {
  Building2,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Camera,
  LogIn,
  UserPlus,
  Compass,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BUSINESS_CATEGORIES } from '../../types';
import { compressImage } from '../../lib/media';
import { db } from '../../lib/mockEngine';

export const AuthPage: React.FC = () => {
  const { verifyOtp, sendOtp, switchAccount, setActiveTab, showToast } = useApp();

  const [tab, setTab] = useState<'signin' | 'signup' | 'demo'>('signin');
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

  const sampleAvatars = [
    { name: 'Coffee', url: '/src/assets/images/coffee_roaster_1790587302699.jpg' },
    { name: 'Ceramics', url: '/src/assets/images/ceramic_studio_1790587319737.jpg' },
    { name: 'Bakery', url: '/src/assets/images/bakery_pastry_1790587333429.jpg' },
    { name: 'Leather', url: '/src/assets/images/leather_tailor_1790587348791.jpg' },
  ];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const { dataUrl } = await compressImage(file, 800, 0.85);
      setAvatarUrl(dataUrl);
      showToast('Profile photo ready!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      showToast(authMethod === 'email' ? 'Enter your email address.' : 'Enter your mobile number.', 'error');
      return;
    }

    if (tab === 'signup' && !businessName.trim()) {
      showToast('Please enter your business name.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(authMethod, identifier.trim());
      setStep('otp');
      setOtpCode('123456');
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
        tab === 'signup'
          ? {
              businessName: businessName.trim() || (authMethod === 'email' ? identifier.split('@')[0] : 'My Business'),
              category,
              bio: bio.trim(),
              contact: contact.trim() || identifier.trim(),
              avatar_url: avatarUrl,
            }
          : undefined
      );
      if (success) {
        setActiveTab('home');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const allRegisteredProfiles = db.getAllProfiles();

  return (
    <div className="max-w-md mx-auto px-4 py-8 pb-28">
      {/* Brand & Introduction */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/25 mb-3">
          <Building2 className="w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl font-black text-stone-900 tracking-tight flex items-center justify-center gap-1.5">
          <span>Amapati</span>
          <span className="w-2 h-2 rounded-full bg-orange-600 inline-block" />
        </h1>
        <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
          The showcase social network for small businesses, artisan makers & craft studios.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="bg-stone-200/80 p-1 rounded-xl flex items-center mb-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setTab('signin');
            setStep('input');
          }}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
            tab === 'signin'
              ? 'bg-white text-stone-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <LogIn className="w-3.5 h-3.5 text-orange-600" />
          <span>Sign In</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('signup');
            setStep('input');
          }}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
            tab === 'signup'
              ? 'bg-white text-stone-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5 text-orange-600" />
          <span>Create Account</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('demo')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
            tab === 'demo'
              ? 'bg-white text-stone-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-orange-600" />
          <span>Quick Switch</span>
        </button>
      </div>

      {/* Tab 1: Sign In & Tab 2: Create Account Form */}
      {(tab === 'signin' || tab === 'signup') && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-stone-900">
              {tab === 'signin' ? 'Welcome Back' : 'Create Your Business Profile'}
            </h2>
            <p className="text-[11px] text-stone-500">
              {tab === 'signin'
                ? 'Sign in via Email or Phone OTP (code is 123456).'
                : 'Publish pictures, videos and audio of your work.'}
            </p>
          </div>

          {step === 'input' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Method Toggle: Email vs Phone */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMethod('email')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition ${
                    authMethod === 'email'
                      ? 'border-orange-600 bg-orange-50/60 text-orange-700'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('phone')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition ${
                    authMethod === 'phone'
                      ? 'border-orange-600 bg-orange-50/60 text-orange-700'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone OTP</span>
                </button>
              </div>

              {/* Business Name (Only on Signup) */}
              {tab === 'signup' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Copper Hearth Bakery"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Craft Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {BUSINESS_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Bio / Short Description
                    </label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell customers about your materials and process..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    />
                  </div>

                  {/* Avatar Picker / Upload */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Business Photo / Logo
                    </label>
                    <div className="flex items-center gap-3">
                      <img
                        src={avatarUrl}
                        alt="Preview"
                        className="w-12 h-12 rounded-xl object-cover border border-orange-500 shrink-0"
                      />
                      <div className="flex-1 flex gap-1.5 flex-wrap">
                        {sampleAvatars.map((sa) => (
                          <button
                            key={sa.name}
                            type="button"
                            onClick={() => setAvatarUrl(sa.url)}
                            className={`text-[10px] px-2 py-1 rounded-lg border font-medium transition ${
                              avatarUrl === sa.url
                                ? 'bg-orange-100 border-orange-400 text-orange-800'
                                : 'bg-stone-50 border-stone-200 text-stone-600'
                            }`}
                          >
                            {sa.name}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] px-2 py-1 rounded-lg border border-dashed border-stone-300 hover:border-orange-500 text-stone-600 flex items-center gap-1"
                        >
                          <Camera className="w-3 h-3 text-orange-600" />
                          <span>{isUploadingPhoto ? '...' : 'Upload'}</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Identifier Input */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {authMethod === 'email' ? 'Work Email' : 'Mobile Phone Number'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    {authMethod === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  </div>
                  <input
                    type={authMethod === 'email' ? 'email' : 'tel'}
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={authMethod === 'email' ? 'artisan@studio.com' : '+1 (555) 000-0000'}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Sending Code...' : 'Continue with One-Time Code'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            /* Step 2: OTP Verification */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                <span className="text-[11px] text-orange-900 block font-medium">
                  Verification code sent to <strong>{identifier}</strong>
                </span>
                <span className="text-[10px] text-orange-700 block mt-0.5">
                  Demo auto-code: <strong>123456</strong>
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 text-center">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center tracking-widest font-mono text-base font-bold py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="w-1/3 py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? 'Verifying...' : 'Verify & Enter'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 3: Quick Persona Switcher */}
      {tab === 'demo' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5 space-y-3">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-stone-900">Instant Demo Business Profiles</h2>
            <p className="text-[11px] text-stone-500">
              Tap any business to instantly switch session and test feeds, comments & messaging:
            </p>
          </div>

          <div className="space-y-2">
            {allRegisteredProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  switchAccount(p.id);
                  setActiveTab('home');
                }}
                className="w-full p-2.5 rounded-xl border border-stone-200 hover:border-orange-400 hover:bg-orange-50/40 text-left transition flex items-center justify-between gap-3 group active:scale-98"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={p.avatar_url}
                    alt={p.business_name}
                    className="w-9 h-9 rounded-xl object-cover border border-stone-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate group-hover:text-orange-600 transition-colors">
                      {p.business_name}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">{p.category}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-orange-600 shrink-0 flex items-center gap-1">
                  <span>Enter</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Guest Mode Alternative Link */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setActiveTab('discover')}
          className="text-xs text-stone-500 hover:text-stone-900 font-semibold inline-flex items-center gap-1.5 transition"
        >
          <Compass className="w-3.5 h-3.5 text-stone-400" />
          <span>Browse Showcases as Guest First</span>
        </button>
      </div>
    </div>
  );
};
