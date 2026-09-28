import React, { useState } from 'react';
import {
  Building2,
  Database,
  Edit3,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    openAuthModal,
    openCreateModal,
    setSettingsModalOpen,
    setAccountSwitcherModalOpen,
    setEditProfileModalOpen,
    setSupabaseModalOpen,
    logout,
    viewProfile,
    isSupabaseLive,
  } = useApp();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-stone-50/90 backdrop-blur-md border-b border-stone-200/80 transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-1.5 text-left group transition-transform active:scale-95"
        >
          <span className="font-display text-xl font-black tracking-tight text-stone-900 flex items-center">
            Amapati
            <span className="inline-block w-2 h-2 rounded-full bg-orange-600 ml-1 transform group-hover:scale-125 transition-transform" />
          </span>
        </button>

        {/* Zone 2: Quick Desktop Nav Links */}
        <nav className="hidden sm:flex items-center gap-6 text-xs font-semibold tracking-wide text-stone-600">
          <button
            onClick={() => setActiveTab('home')}
            className={`pb-0.5 border-b-2 transition-colors ${
              activeTab === 'home'
                ? 'border-orange-600 text-stone-900 font-bold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            Following
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`pb-0.5 border-b-2 transition-colors ${
              activeTab === 'discover'
                ? 'border-orange-600 text-stone-900 font-bold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            Discover
          </button>
        </nav>

        {/* Zone 3: Actions, Accounts & Auth */}
        <div className="flex items-center gap-2">
          {/* View Accounts Button */}
          <button
            onClick={() => setAccountSwitcherModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 hover:border-orange-300 text-stone-700 hover:text-orange-700 shadow-2xs transition active:scale-95"
            title="View registered business accounts & switch session"
          >
            <Building2 className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden sm:inline">Accounts</span>
          </button>

          {/* Supabase backend status pill */}
          <button
            onClick={() => setSupabaseModalOpen(true)}
            className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition ${
              isSupabaseLive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
            }`}
            title="Database Connection & Migration Status"
          >
            <Database className="w-3 h-3 text-orange-600" />
            <span>{isSupabaseLive ? 'Supabase Live' : 'Local DB'}</span>
          </button>

          {/* PWA Install Button */}
          <div className="hidden sm:block">
            <PWAInstallButton compact />
          </div>

          {/* Primary Action Button or Active Account Avatar Dropdown */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={openCreateModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Showcase</span>
              </button>

              {/* Account Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-stone-100 border border-stone-200/60 transition"
                  title="Business Account Menu"
                >
                  <img
                    src={currentUser.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
                    alt={currentUser.business_name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-lg object-cover border border-orange-500"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {isAccountMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl bg-white border border-stone-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs"
                    onClick={() => setIsAccountMenuOpen(false)}
                  >
                    <div className="px-3.5 py-2 border-b border-stone-100">
                      <p className="font-bold text-stone-900 truncate">{currentUser.business_name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{currentUser.category}</p>
                    </div>

                    <button
                      onClick={() => viewProfile(currentUser.id)}
                      className="w-full px-3.5 py-2 text-left font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-stone-500" />
                      <span>View My Profile</span>
                    </button>

                    <button
                      onClick={() => setEditProfileModalOpen(true)}
                      className="w-full px-3.5 py-2 text-left font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                      <span>Edit My Account & Photo</span>
                    </button>

                    <button
                      onClick={() => setAccountSwitcherModalOpen(true)}
                      className="w-full px-3.5 py-2 text-left font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <Building2 className="w-3.5 h-3.5 text-orange-600" />
                      <span>Switch / View Accounts</span>
                    </button>

                    <button
                      onClick={() => setSettingsModalOpen(true)}
                      className="w-full px-3.5 py-2 text-left font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-stone-500" />
                      <span>Settings & Activity Trail</span>
                    </button>

                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button
                        onClick={logout}
                        className="w-full px-3.5 py-2 text-left font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out of Session</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
              >
                <User className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
