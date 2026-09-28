import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Copy, Check, FileCode, Server } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SupabaseConfigModal: React.FC = () => {
  const { isSupabaseModalOpen, setSupabaseModalOpen, supabaseConfig, updateSupabaseConfig, isSupabaseLive, showToast } =
    useApp();

  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [key, setKey] = useState(supabaseConfig.key || '');
  const [copiedMigration, setCopiedMigration] = useState(false);

  if (!isSupabaseModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseConfig(url.trim(), key.trim());
    setSupabaseModalOpen(false);
  };

  const handleDisconnect = () => {
    setUrl('');
    setKey('');
    updateSupabaseConfig('', '');
  };

  const handleCopyMigrationPath = () => {
    navigator.clipboard.writeText('supabase/migrations/20260928000000_init_amapati.sql');
    setCopiedMigration(true);
    showToast('Migration file path copied to clipboard!');
    setTimeout(() => setCopiedMigration(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-stone-900">Supabase Backend Setup</h3>
              <p className="text-[11px] text-stone-500">Postgres, Auth, Storage & Row Level Security</p>
            </div>
          </div>
          <button
            onClick={() => setSupabaseModalOpen(false)}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Status banner */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-3 ${
              isSupabaseLive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-stone-50 border-stone-200 text-stone-800'
            }`}
          >
            {isSupabaseLive ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Server className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">
                {isSupabaseLive ? 'Connected to live Supabase project' : 'Running in Local Engine mode'}
              </p>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                {isSupabaseLive
                  ? 'All auth, profiles, showcases, follows, and append-only activity logs are executing directly against your Supabase Postgres database.'
                  : 'Amapati is running with full functionality (auth, posts, follows, client-side compression, append-only activity logs) using a local in-browser persistent database. Connect your project below whenever you wish.'}
              </p>
            </div>
          </div>

          {/* Migration File Reference Card */}
          <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-orange-600" />
                <span className="font-bold text-stone-900">SQL Migration Files Included</span>
              </div>
              <button
                onClick={handleCopyMigrationPath}
                className="text-[11px] text-orange-700 font-semibold hover:underline flex items-center gap-1"
              >
                {copiedMigration ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copy Path</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-600 leading-normal">
              Production migration scripts with complete schema, RLS policies, append-only triggers, and storage bucket
              rules are ready at:
            </p>
            <ul className="list-disc list-inside font-mono text-[10px] text-stone-700 space-y-0.5">
              <li>supabase/migrations/20260928000000_init_amapati.sql</li>
              <li>supabase/storage.sql</li>
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Supabase Project URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Supabase Anon Public API Key</label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-stone-100">
              {isSupabaseLive && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-red-600 hover:underline font-medium text-xs"
                >
                  Disconnect Project
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setSupabaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold transition active:scale-95 shadow-sm"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
