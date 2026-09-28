import React, { useState } from 'react';
import { X, Flag, CheckCircle2 } from 'lucide-react';
import { Post, Profile } from '../../types';
import { useApp } from '../../context/AppContext';

interface ReportModalProps {
  target: { type: 'post' | 'profile'; post?: Post; profile?: Profile } | null;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Inappropriate or offensive media',
  'Misleading business claims or fake products',
  'Spam or repetitive commercial advertising',
  'Harassment or abusive conduct',
  'Intellectual property or copyright infringement',
  'Other safety concern',
];

export const ReportModal: React.FC<ReportModalProps> = ({ target, onClose }) => {
  const { reportTarget, showToast } = useApp();
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const targetId = target.type === 'post' ? target.post!.id : target.profile!.id;
      await reportTarget(target.type, targetId, selectedReason, details.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-amber-500" />
            <h3 className="font-display text-base font-bold text-stone-900">
              Report {target.type === 'post' ? 'Post' : 'Business'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          <p className="text-stone-600">
            Help us maintain a respectful marketplace for artisans. Why are you reporting this{' '}
            {target.type === 'post' ? 'showcase' : 'business account'}?
          </p>

          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  selectedReason === reason
                    ? 'bg-orange-50 border-orange-300 text-stone-900 font-semibold'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="text-orange-600 focus:ring-orange-500 h-4 w-4"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Additional Details (Optional)</label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none text-xs"
              maxLength={200}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold transition active:scale-95 shadow-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
