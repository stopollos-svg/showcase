import React, { useState } from 'react';
import {
  X,
  History,
  Shield,
  Database,
  Download,
  LogOut,
  Trash2,
  Lock,
  UserX,
  Sparkles,
  RefreshCw,
  Building2,
  Edit3,
  Camera,
  Plus,
  Flame,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/mockEngine';
import { Profile } from '../../types';
import { runTrendingAcceptanceTests, TestResult } from '../../lib/trendingTests';

export const SettingsModal: React.FC = () => {
  const {
    currentUser,
    isSettingsModalOpen,
    setSettingsModalOpen,
    setEditProfileModalOpen,
    setAccountSwitcherModalOpen,
    setActivityLogModalOpen,
    setSupabaseModalOpen,
    openAuthModal,
    logout,
    deleteAccount,
    unblockUser,
    isSupabaseLive,
    refreshFeed,
    showToast,
  } = useApp();

  const [activeSubView, setActiveSubView] = useState<'main' | 'blocked' | 'tests'>('main');
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  if (!isSettingsModalOpen || !currentUser) return null;

  const blockedUsers = db.getBlockedUsers(currentUser.id);

  const handleResetDemoData = () => {
    if (confirm('Reset demo showcases and artisan profiles to original clean state?')) {
      db.resetToDefault();
      refreshFeed();
      showToast('Reset to original sample businesses.');
      setSettingsModalOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setSettingsModalOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        `Are you sure you want to permanently delete your business account "${currentUser.business_name}"? All showcases and follower relationships will be deleted.`
      )
    ) {
      await deleteAccount();
      setSettingsModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-stone-900">
            {activeSubView === 'blocked'
              ? 'Blocked Users'
              : activeSubView === 'tests'
              ? 'Acceptance Test Suite'
              : 'Settings & Business Session'}
          </h3>
          <button
            onClick={() => {
              if (activeSubView !== 'main') setActiveSubView('main');
              else setSettingsModalOpen(false);
            }}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeSubView === 'main' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Active Business Account Card with Edit Shortcut */}
            <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/90 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={currentUser.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
                  alt={currentUser.business_name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border-2 border-orange-500 shadow-xs shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-bold text-stone-900 truncate text-sm">{currentUser.business_name}</p>
                  <p className="text-[11px] text-stone-600 truncate">{currentUser.category}</p>
                  <span className="text-[10px] text-orange-700 font-semibold block mt-0.5">
                    ● Active Business Session
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSettingsModalOpen(false);
                  setEditProfileModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-orange-300 hover:bg-orange-100 text-orange-800 font-semibold transition active:scale-95 shadow-2xs flex items-center gap-1.5 shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            {/* Section: Business Accounts & Management */}
            <div>
              <p className="font-bold uppercase tracking-wider text-stone-400 text-[10px] mb-2">
                Business Accounts & Profile
              </p>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setSettingsModalOpen(false);
                    setAccountSwitcherModalOpen(true);
                  }}
                  className="w-full p-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="font-semibold text-stone-800">View All Business Accounts</p>
                      <p className="text-[11px] text-stone-500">Switch active session or inspect other businesses</p>
                    </div>
                  </div>
                  <span className="text-xs text-stone-400">›</span>
                </button>

                <button
                  onClick={() => {
                    setSettingsModalOpen(false);
                    setEditProfileModalOpen(true);
                  }}
                  className="w-full p-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="font-semibold text-stone-800">Change Profile Picture & Name</p>
                      <p className="text-[11px] text-stone-500">Upload studio photo or rename business</p>
                    </div>
                  </div>
                  <span className="text-xs text-stone-400">›</span>
                </button>

                <button
                  onClick={() => {
                    setSettingsModalOpen(false);
                    openAuthModal();
                  }}
                  className="w-full p-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="font-semibold text-stone-800">Create New Business Account</p>
                      <p className="text-[11px] text-stone-500">Register a new email/phone and brand profile</p>
                    </div>
                  </div>
                  <span className="text-xs text-stone-400">›</span>
                </button>
              </div>
            </div>

            {/* Section: History & Auditing */}
            <div>
              <p className="font-bold uppercase tracking-wider text-stone-400 text-[10px] mb-2">
                Audit Trail & Database
              </p>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setSettingsModalOpen(false);
                    setActivityLogModalOpen(true);
                  }}
                  className="w-full p-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <History className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="font-semibold text-stone-800">Activity & Transaction Log</p>
                      <p className="text-[11px] text-stone-500">View permanent append-only change history</p>
                    </div>
                  </div>
                  <span className="text-xs text-stone-400">›</span>
                </button>

                <button
                  onClick={() => {
                    setSettingsModalOpen(false);
                    setSupabaseModalOpen(true);
                  }}
                  className="w-full p-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="font-semibold text-stone-800">Supabase Connection</p>
                      <p className="text-[11px] text-stone-500">
                        {isSupabaseLive ? 'Connected to live Supabase backend' : 'Using persistent local SQLite/Postgres engine'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-stone-400">›</span>
                </button>
              </div>
            </div>

            {/* Section: Safety & Moderation */}
            <div>
              <p className="font-bold uppercase tracking-wider text-stone-400 text-[10px] mb-2">
                Safety & Moderation
              </p>
              <button
                onClick={() => setActiveSubView('blocked')}
                className="w-full p-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <UserX className="w-4 h-4 text-stone-600" />
                  <div>
                    <p className="font-semibold text-stone-800">Blocked Accounts</p>
                    <p className="text-[11px] text-stone-500">{blockedUsers.length} blocked users</p>
                  </div>
                </div>
                <span className="text-xs text-stone-400">›</span>
              </button>
            </div>

            {/* Section: View Tracking & Trending Acceptance Tests */}
            <div>
              <p className="font-bold uppercase tracking-wider text-stone-400 text-[10px] mb-2">
                Ranking Engine & Diagnostics
              </p>
              <button
                onClick={() => {
                  const res = runTrendingAcceptanceTests();
                  setTestResults(res);
                  setActiveSubView('tests');
                }}
                className="w-full p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
                  <div>
                    <p className="font-semibold text-stone-900">Run View & Trending Tests</p>
                    <p className="text-[11px] text-stone-500">
                      Verify dedupe, decay math, 7-day cutoff & diversity rule
                    </p>
                  </div>
                </div>
                <span className="text-xs text-orange-600 font-bold">Run ›</span>
              </button>
            </div>

            {/* Section: App Tools & Account */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <button
                onClick={handleResetDemoData}
                className="w-full py-2.5 px-3 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 transition font-medium flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                <span>Reset Demo Showcases to Default</span>
              </button>

              {/* Log Out Button */}
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white transition font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of Business Session</span>
              </button>

              <button
                onClick={handleDeleteAccount}
                className="w-full py-2.5 px-3 rounded-xl text-red-600 hover:bg-red-50 transition font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account & Business Data</span>
              </button>
            </div>
          </div>
        ) : activeSubView === 'tests' ? (
          /* SubView: Acceptance Tests */
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-900">
                Phase Acceptance Test Suite
              </span>
              <button
                type="button"
                onClick={() => setTestResults(runTrendingAcceptanceTests())}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition"
              >
                Re-run All Tests
              </button>
            </div>

            <div className="space-y-2.5">
              {testResults.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    t.passed
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-red-50/70 border-red-200 text-red-950'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {t.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{t.name}</span>
                  </div>
                  <p className="text-[11px] opacity-90 pl-5.5 font-mono">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* SubView: Blocked Users */
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {blockedUsers.length > 0 ? (
              blockedUsers.map((user: Profile) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={user.avatar_url}
                      alt={user.business_name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-stone-900 truncate">{user.business_name}</p>
                      <p className="text-[10px] text-stone-500 truncate">{user.category}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => unblockUser(user.id)}
                    className="px-3 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold transition"
                  >
                    Unblock
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-stone-400 text-xs">
                You haven't blocked any accounts.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
