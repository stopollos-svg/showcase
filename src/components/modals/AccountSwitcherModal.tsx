import React, { useState } from 'react';
import { X, Building2, UserCheck, Plus, Check, ExternalLink, ArrowRight, ShieldCheck, LogOut, Edit3 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/mockEngine';
import { Profile } from '../../types';

export const AccountSwitcherModal: React.FC = () => {
  const {
    currentUser,
    isAccountSwitcherModalOpen,
    setAccountSwitcherModalOpen,
    switchAccount,
    openAuthModal,
    viewProfile,
    setEditProfileModalOpen,
    logout,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');

  if (!isAccountSwitcherModalOpen) return null;

  // Get all business profiles stored in the database
  const allProfiles = db.getAllProfiles();

  const filtered = allProfiles.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.business_name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const handleSelectAccount = (profile: Profile) => {
    switchAccount(profile.id);
    setAccountSwitcherModalOpen(false);
  };

  const handleCreateNew = () => {
    setAccountSwitcherModalOpen(false);
    openAuthModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-stone-900">Business Accounts</h3>
              <p className="text-[11px] text-stone-500">Switch active session or create new business</p>
            </div>
          </div>
          <button
            onClick={() => setAccountSwitcherModalOpen(false)}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Account Banner */}
        {currentUser ? (
          <div className="bg-stone-50 px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={currentUser.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
                alt={currentUser.business_name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border-2 border-orange-500 shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider block">
                  Current Active Session
                </span>
                <p className="text-xs font-bold text-stone-900 truncate">{currentUser.business_name}</p>
                <p className="text-[11px] text-stone-500 truncate">{currentUser.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAccountSwitcherModalOpen(false);
                  setEditProfileModalOpen(true);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 transition flex items-center gap-1"
                title="Edit business name and photo"
              >
                <Edit3 className="w-3 h-3 text-stone-500" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setAccountSwitcherModalOpen(false);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition flex items-center gap-1 active:scale-95"
                title="Log out of business session"
              >
                <LogOut className="w-3 h-3" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200 text-amber-900 text-xs">
            Not currently signed in to any business. Select an account below or create one.
          </div>
        )}

        {/* Search accounts */}
        <div className="p-3 border-b border-stone-100">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search business accounts..."
            className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* List of Accounts */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.map((profile) => {
            const isActive = currentUser?.id === profile.id;
            return (
              <div
                key={profile.id}
                className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-orange-50/70 border-orange-300'
                    : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectAccount(profile)}
                  className="flex items-center gap-3 text-left min-w-0 flex-1 group"
                >
                  <img
                    src={profile.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
                    alt={profile.business_name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0 group-hover:scale-105 transition"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate group-hover:text-orange-600 transition-colors">
                      {profile.business_name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                      <span>{profile.category}</span>
                      <span>·</span>
                      <span>{profile.posts_count || 0} showcases</span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isActive ? (
                    <span className="text-xs font-semibold text-orange-700 bg-white px-2.5 py-1 rounded-lg border border-orange-200">
                      Logged in
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectAccount(profile)}
                      className="px-3 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition active:scale-95 flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Switch</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAccountSwitcherModalOpen(false);
                      viewProfile(profile.id);
                    }}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                    title="View public profile"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between gap-2">
          <span className="text-[11px] text-stone-500">{allProfiles.length} businesses registered</span>
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Business</span>
          </button>
        </div>
      </div>
    </div>
  );
};
