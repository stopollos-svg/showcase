import React, { useState } from 'react';
import { X, History, ChevronDown, ChevronRight, ShieldCheck, Database, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActivityLog } from '../../types';

export const ActivityLogModal: React.FC = () => {
  const { isActivityLogModalOpen, setActivityLogModalOpen, getActivityLogs } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isActivityLogModalOpen) return null;

  const logs = getActivityLogs();

  const getActionColor = (action: string) => {
    switch (action) {
      case 'signup':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'post_created':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'post_edited':
      case 'profile_updated':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'post_deleted':
      case 'follower_removed':
      case 'blocked':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'followed':
      case 'unfollowed':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      default:
        return 'text-stone-700 bg-stone-100 border-stone-200';
    }
  };

  const formatTimestamp = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-stone-900">Activity & Transaction Log</h3>
              <p className="text-[11px] text-stone-500">Append-Only Immutable Audit Trail</p>
            </div>
          </div>
          <button
            onClick={() => setActivityLogModalOpen(false)}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security / Trigger Notice */}
        <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-100 flex items-center gap-2 text-[11px] text-stone-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Every create, update, follow, remove, and delete is permanently logged with old & new state snapshots.
          </span>
        </div>

        {/* Log Entries List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {logs.length > 0 ? (
            logs.map((log) => {
              const isExpanded = expandedId === log.id;
              const hasDiff = Boolean(log.old_data || log.new_data);

              return (
                <div
                  key={log.id}
                  className="rounded-xl border border-stone-200 bg-white overflow-hidden transition-all shadow-xs"
                >
                  <div
                    onClick={() => hasDiff && setExpandedId(isExpanded ? null : log.id)}
                    className={`p-3 flex items-center justify-between gap-3 text-xs ${
                      hasDiff ? 'cursor-pointer hover:bg-stone-50/80' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border shrink-0 ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900 truncate">
                          Table: <span className="font-mono text-stone-600">{log.entity_type}</span> · ID: <span className="font-mono text-stone-500">{log.entity_id.slice(0, 12)}</span>
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span className="font-mono">{formatTimestamp(log.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {hasDiff && (
                      <div className="text-stone-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    )}
                  </div>

                  {/* Expandable JSON Snapshot View */}
                  {isExpanded && (
                    <div className="p-3 bg-stone-950 text-stone-300 font-mono text-[11px] border-t border-stone-800 space-y-2 overflow-x-auto">
                      {log.old_data && (
                        <div>
                          <span className="text-red-400 font-bold block mb-1">Old State (Previous Data):</span>
                          <pre className="p-2 rounded bg-stone-900 text-stone-300 text-[10px] leading-tight overflow-x-auto">
                            {JSON.stringify(log.old_data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.new_data && (
                        <div>
                          <span className="text-emerald-400 font-bold block mb-1">New State (Recorded Data):</span>
                          <pre className="p-2 rounded bg-stone-900 text-stone-300 text-[10px] leading-tight overflow-x-auto">
                            {JSON.stringify(log.new_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-stone-400 text-xs">
              No activity recorded yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <span>{logs.length} transactions stored</span>
          <button
            onClick={() => setActivityLogModalOpen(false)}
            className="px-4 py-1.5 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
