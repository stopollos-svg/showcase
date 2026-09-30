import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  FileCheck,
  AlertTriangle,
  History,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/mockEngine';
import { Profile, Report, VerificationRequest } from '../../types';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    isStaff,
    staffRole,
    getReports,
    updateReportStatus,
    getVerificationRequests,
    approveVerification,
    rejectVerification,
    toggleVerifiedBadge,
    getActivityLogs,
    setActiveTab,
    showToast,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'overview' | 'reports' | 'verification' | 'users' | 'activity'>('overview');
  const [reportFilter, setReportFilter] = useState<'all' | 'open' | 'resolved' | 'dismissed'>('open');
  const [userSearch, setUserSearch] = useState('');

  // If user is not staff, show restricted access banner and switch button
  if (!isStaff) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center pb-28">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-display text-lg font-bold text-stone-900 mb-1">
          Staff & Moderator Portal
        </h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
          Access to the Amapati /admin moderation dashboard requires an assigned staff role (`admin` or `moderator`).
        </p>

        <div className="space-y-3 max-w-xs mx-auto">
          <button
            onClick={() => {
              // Switch to the seeded admin staff account
              const admin = db.getProfile('user_admin');
              if (admin) {
                db.createOrUpdateProfile(admin);
                useApp;
              }
              window.location.reload();
            }}
            className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition"
          >
            Log in as Amapati Staff Admin
          </button>
          <button
            onClick={() => setActiveTab('home')}
            className="w-full py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const reports: Report[] = getReports();
  const filteredReports = reports.filter((r) => {
    if (reportFilter === 'all') return true;
    return (r.status || 'open') === reportFilter;
  });

  const verificationRequests: VerificationRequest[] = getVerificationRequests();
  const allProfiles: Profile[] = db.getAllProfiles();
  const filteredProfiles = allProfiles.filter(
    (p) =>
      p.business_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(userSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(userSearch.toLowerCase())
  );

  const logs = getActivityLogs();

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold text-stone-900 flex items-center gap-1.5">
              <span>Amapati Staff Console</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold uppercase tracking-wider">
                {staffRole || 'admin'}
              </span>
            </h1>
            <p className="text-[11px] text-stone-500">
              Logged in as {currentUser?.business_name}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('home')}
          className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 bg-white border border-stone-200 px-3 py-1.5 rounded-xl shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Admin</span>
        </button>
      </div>

      {/* Nav Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none text-xs font-semibold">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-3.5 py-1.5 rounded-xl transition shrink-0 ${
            activeSection === 'overview'
              ? 'bg-stone-900 text-white'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSection('reports')}
          className={`px-3.5 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1.5 ${
            activeSection === 'reports'
              ? 'bg-stone-900 text-white'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span>Reports</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px]">
            {reports.filter((r) => (r.status || 'open') === 'open').length}
          </span>
        </button>
        <button
          onClick={() => setActiveSection('verification')}
          className={`px-3.5 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1.5 ${
            activeSection === 'verification'
              ? 'bg-stone-900 text-white'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span>Verifications</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px]">
            {verificationRequests.filter((v) => v.status === 'pending').length}
          </span>
        </button>
        <button
          onClick={() => setActiveSection('users')}
          className={`px-3.5 py-1.5 rounded-xl transition shrink-0 ${
            activeSection === 'users'
              ? 'bg-stone-900 text-white'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          Businesses ({allProfiles.length})
        </button>
        <button
          onClick={() => setActiveSection('activity')}
          className={`px-3.5 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1.5 ${
            activeSection === 'activity'
              ? 'bg-stone-900 text-white'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* 1. OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
              <span className="text-[11px] text-stone-500 font-semibold block">Open Reports</span>
              <span className="text-xl font-bold text-amber-600 mt-1 block">
                {reports.filter((r) => (r.status || 'open') === 'open').length}
              </span>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
              <span className="text-[11px] text-stone-500 font-semibold block">Pending Badges</span>
              <span className="text-xl font-bold text-blue-600 mt-1 block">
                {verificationRequests.filter((v) => v.status === 'pending').length}
              </span>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
              <span className="text-[11px] text-stone-500 font-semibold block">Businesses</span>
              <span className="text-xl font-bold text-stone-900 mt-1 block">
                {allProfiles.length}
              </span>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
              <span className="text-[11px] text-stone-500 font-semibold block">Audit Log Entries</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block">
                {logs.length}
              </span>
            </div>
          </div>

          {/* Quick Tasks */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
            <h3 className="text-xs font-bold text-stone-900 mb-2">Pending Staff Actions</h3>
            <div className="space-y-2 text-xs">
              {verificationRequests.filter((v) => v.status === 'pending').map((vr) => (
                <div
                  key={vr.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-stone-900">{vr.business_name}</span>
                    <span className="text-stone-500 block text-[11px]">{vr.category} · Proof submitted</span>
                  </div>
                  <button
                    onClick={() => setActiveSection('verification')}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg font-semibold text-[11px] hover:bg-blue-700"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. REPORTS QUEUE */}
      {activeSection === 'reports' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['all', 'open', 'resolved', 'dismissed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setReportFilter(st)}
                className={`text-[11px] font-semibold px-3 py-1 rounded-lg capitalize transition ${
                  reportFilter === st
                    ? 'bg-amber-100 text-amber-900 font-bold'
                    : 'bg-white border border-stone-200 text-stone-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-400">
              No reports in this category. Community is safe and peaceful!
            </div>
          ) : (
            filteredReports.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">
                    Reported {r.target_type.toUpperCase()} #{r.target_id.slice(-6)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : r.status === 'dismissed'
                        ? 'bg-stone-100 text-stone-600'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {r.status || 'open'}
                  </span>
                </div>

                <p className="text-stone-700 font-medium">
                  <strong>Reason:</strong> {r.reason}
                </p>
                {r.details && (
                  <p className="text-stone-500 text-[11px]">
                    <strong>Details:</strong> {r.details}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => updateReportStatus(r.id, 'resolved')}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] transition"
                  >
                    Resolve Violation
                  </button>
                  <button
                    onClick={() => updateReportStatus(r.id, 'dismissed')}
                    className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-semibold text-[11px] transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. VERIFICATION REQUESTS */}
      {activeSection === 'verification' && (
        <div className="space-y-3">
          {verificationRequests.map((vr) => (
            <div
              key={vr.id}
              className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <span>{vr.business_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-normal">
                      {vr.category}
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-500">Contact: {vr.contact}</p>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    vr.status === 'approved'
                      ? 'bg-blue-100 text-blue-800'
                      : vr.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {vr.status}
                </span>
              </div>

              {vr.notes && (
                <div className="bg-stone-50 rounded-xl p-2.5 text-[11px] text-stone-700">
                  <strong>Applicant Notes:</strong> {vr.notes}
                </div>
              )}

              {/* Proof Preview */}
              {vr.proof_url && (
                <div>
                  <span className="text-[11px] text-stone-500 font-semibold block mb-1">
                    Submitted Proof Document:
                  </span>
                  <img
                    src={vr.proof_url}
                    alt="Proof document"
                    className="w-full max-h-48 object-cover rounded-xl border border-stone-200"
                  />
                </div>
              )}

              {vr.status === 'pending' && (
                <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => approveVerification(vr.id)}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
                  >
                    Grant Verified Badge
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Rejection reason (sent to business):', 'Insufficient business registration proof');
                      if (reason) rejectVerification(vr.id, reason);
                    }}
                    className="py-1.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-semibold text-xs transition"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 4. BUSINESSES DIRECTORY */}
      {activeSection === 'users' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search businesses by name, category or ID..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-2xs">
            {filteredProfiles.map((p) => (
              <div key={p.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.avatar_url}
                    alt={p.business_name}
                    className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-stone-900 truncate flex items-center gap-1">
                      <span>{p.business_name}</span>
                      {p.is_verified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 fill-blue-100" />
                      )}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">{p.category} · {p.contact || 'No contact'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleVerifiedBadge(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      p.is_verified
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {p.is_verified ? 'Verified Badge ✓' : '+ Add Badge'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. AUDIT LOG (APPEND-ONLY) */}
      {activeSection === 'activity' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="font-bold text-xs text-stone-900">Append-Only Activity Audit Trail</h3>
            <span className="text-[10px] text-stone-400 font-mono">Immutable Log</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs flex items-start justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-stone-500 text-[11px]">
                      on {log.entity_type} ({log.entity_id.slice(0, 14)})
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 block mt-1 font-mono">
                    User: {log.user_id} · {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
