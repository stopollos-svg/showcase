import React, { useState } from 'react';
import {
  HelpCircle,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  X,
  Vote,
  Users,
  Lightbulb,
  Check,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FeedbackSurvey, Profile } from '../../types';

interface UserFeedbackSurveyWidgetProps {
  business: Profile;
}

const SURVEY_TEMPLATES = [
  {
    category: 'Future Product Drop',
    question: 'Which new single-origin coffee roast should we feature on the brew bar next month?',
    options: [
      'Rwenzori Mountain Natural (Strawberry & Cacao)',
      'Bugisu Peaberry Honey Process (Brown Sugar & Lime)',
      'Zombo Arabica Washed (Jasmine & Bergamot)',
    ],
  },
  {
    category: 'New Menu Concept',
    question: 'What new seasonal dining creation would you like to see under the garden acacia canopy?',
    options: [
      'Whole Grilled Tilapia with Ginger Tamarind Glaze',
      'Slow-Smoked Kigezi Ribs with Sweet Plantain Mash',
      'Wood-Fired Garden Flatbread with Nile Herbs',
    ],
  },
  {
    category: 'Patron Workshop',
    question: 'Which artisan craft masterclass should we schedule for the next weekend session?',
    options: [
      'Hand-thrown Stoneware Pottery & Wheel Technique',
      'Traditional Bark Cloth Textile & Pattern Dyeing',
      'Specialty Espresso Cupping & Sensory Workshop',
    ],
  },
  {
    category: 'Bespoke Craft',
    question: 'What color palette should we produce for our upcoming hand-stitched leather drop?',
    options: [
      'Savannah Tan & Brass Hardware',
      'Deep Indigo & Waxed Linen',
      'Forest Olive & Matte Charcoal',
    ],
  },
];

export const UserFeedbackSurveyWidget: React.FC<UserFeedbackSurveyWidgetProps> = ({ business }) => {
  const {
    currentUser,
    getBusinessSurvey,
    saveBusinessSurvey,
    voteBusinessSurvey,
    deleteBusinessSurvey,
    showToast,
  } = useApp();

  const isOwner = currentUser?.id === business.id;
  const currentUserId = currentUser ? currentUser.id : 'guest_patron';

  // Live survey state
  const survey = getBusinessSurvey(business.id);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  // Form states for builder
  const [questionInput, setQuestionInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Future Product Drop');
  const [optionsInput, setOptionsInput] = useState<string[]>(['', '']);

  // Open modal/builder with current survey data or default template
  const handleOpenBuilder = (templateIdx?: number) => {
    if (templateIdx !== undefined && SURVEY_TEMPLATES[templateIdx]) {
      const tmpl = SURVEY_TEMPLATES[templateIdx];
      setQuestionInput(tmpl.question);
      setCategoryInput(tmpl.category);
      setOptionsInput([...tmpl.options]);
    } else if (survey) {
      setQuestionInput(survey.question);
      setCategoryInput(survey.category || 'Future Product Drop');
      setOptionsInput(survey.options.map((o) => o.text));
    } else {
      const defaultTmpl = SURVEY_TEMPLATES[0];
      setQuestionInput(defaultTmpl.question);
      setCategoryInput(defaultTmpl.category);
      setOptionsInput([...defaultTmpl.options]);
    }
    setIsEditing(true);
  };

  const handleAddOptionField = () => {
    if (optionsInput.length < 4) {
      setOptionsInput([...optionsInput, '']);
    }
  };

  const handleRemoveOptionField = (idx: number) => {
    if (optionsInput.length > 2) {
      setOptionsInput(optionsInput.filter((_, i) => i !== idx));
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...optionsInput];
    updated[idx] = val;
    setOptionsInput(updated);
  };

  const handleSaveSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) {
      showToast('Please specify a survey question.', 'error');
      return;
    }

    const cleanOptions = optionsInput.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      showToast('Please provide at least 2 voting options.', 'error');
      return;
    }

    saveBusinessSurvey({
      business_id: business.id,
      question: questionInput.trim(),
      category: categoryInput.trim() || 'Future Product Drop',
      options: cleanOptions.map((text, idx) => ({
        id: `opt_${idx + 1}_${Date.now()}`,
        text,
        votes: 0,
      })),
    });

    setIsEditing(false);
  };

  const handleVote = async (optionId: string) => {
    if (!survey) return;
    setIsSubmittingVote(true);
    try {
      await voteBusinessSurvey(survey.id, optionId);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const userVotedOptionId = survey?.voter_user_ids ? survey.voter_user_ids[currentUserId] : undefined;
  const hasVoted = Boolean(userVotedOptionId) || isOwner;

  // If no survey exists and not owner, don't show empty block
  if (!survey && !isOwner) {
    return null;
  }

  return (
    <div className="mb-4">
      {/* 1. If Owner and No Survey yet, show Creator Banner */}
      {!survey && isOwner && (
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-stone-50 border border-orange-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <span>Product Feedback Survey</span>
                  <span className="px-1.5 py-0.2 rounded bg-orange-200/80 text-orange-950 font-bold text-[9px] uppercase tracking-wider">
                    Follower Feedback
                  </span>
                </h3>
                <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                  Ask your followers & patrons what new roast, menu item, or craft drop they want next.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleOpenBuilder()}
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Survey</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Active Survey Card */}
      {survey && (
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs space-y-3 relative overflow-hidden group">
          {/* Subtle accent bar on top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400" />

          {/* Survey Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100/80 text-orange-900 border border-orange-200/60 uppercase tracking-wider">
                  <Vote className="w-3 h-3 text-orange-600" />
                  <span>{survey.category || 'Product Survey'}</span>
                </span>
                <span className="text-[11px] text-stone-400 font-medium">
                  • {survey.total_votes} {survey.total_votes === 1 ? 'vote' : 'patron votes'}
                </span>
                {userVotedOptionId && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    <Check className="w-2.5 h-2.5" />
                    <span>Voted</span>
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-stone-900 mt-1.5 leading-snug">
                {survey.question}
              </h3>
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleOpenBuilder()}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                  title="Edit or change survey"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteBusinessSurvey(survey.id)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Remove survey"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Survey Options List */}
          <div className="space-y-2 pt-1">
            {survey.options.map((option) => {
              const voteCount = option.votes || 0;
              const percentage =
                survey.total_votes > 0 ? Math.round((voteCount / survey.total_votes) * 100) : 0;
              const isSelected = userVotedOptionId === option.id;

              return (
                <div key={option.id} className="relative">
                  {hasVoted ? (
                    /* Results Mode (once voted or if business owner) */
                    <button
                      type="button"
                      onClick={() => !isOwner && handleVote(option.id)}
                      disabled={isSubmittingVote || isOwner}
                      className={`w-full p-2.5 sm:p-3 rounded-xl border text-left transition relative overflow-hidden flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-400/50'
                          : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100/60'
                      }`}
                    >
                      {/* Animated Progress Bar fill */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 transition-all duration-700 ${
                          isSelected ? 'bg-orange-200/50' : 'bg-stone-200/50'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />

                      {/* Content on top */}
                      <div className="relative z-10 min-w-0 flex items-center gap-2">
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                        )}
                        <span
                          className={`text-xs ${
                            isSelected
                              ? 'font-bold text-stone-900'
                              : 'font-medium text-stone-700'
                          }`}
                        >
                          {option.text}
                        </span>
                      </div>

                      <div className="relative z-10 flex items-center gap-2 shrink-0 font-mono text-xs">
                        <span className="text-[11px] text-stone-500 font-semibold">
                          {voteCount}
                        </span>
                        <span
                          className={`font-bold ${
                            isSelected ? 'text-orange-700' : 'text-stone-700'
                          }`}
                        >
                          {percentage}%
                        </span>
                      </div>
                    </button>
                  ) : (
                    /* Interactive Voting Mode */
                    <button
                      type="button"
                      onClick={() => handleVote(option.id)}
                      disabled={isSubmittingVote}
                      className="w-full p-2.5 sm:p-3 rounded-xl border border-stone-200 bg-white hover:border-orange-400 hover:bg-orange-50/40 text-left transition active:scale-[0.99] flex items-center justify-between gap-3 group/opt shadow-2xs"
                    >
                      <span className="text-xs font-semibold text-stone-800 group-hover/opt:text-orange-900">
                        {option.text}
                      </span>
                      <span className="w-5 h-5 rounded-full border border-stone-300 group-hover/opt:border-orange-500 flex items-center justify-center shrink-0">
                        <span className="w-2 h-2 rounded-full bg-orange-600 opacity-0 group-hover/opt:opacity-100 transition-opacity" />
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Survey Footer / Context */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500 flex-wrap gap-2">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-stone-400" />
              <span>Patron survey to shape upcoming products & menus</span>
            </span>

            {userVotedOptionId && !isOwner && (
              <span className="text-stone-400 text-[10px]">Tap another option to change vote</span>
            )}

            {isOwner && (
              <button
                onClick={() => handleOpenBuilder()}
                className="text-orange-600 hover:underline font-semibold ml-auto text-[11px]"
              >
                + Post New Question
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Survey Builder Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                  <Vote className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">
                    Create 1-Question Patron Survey
                  </h2>
                  <p className="text-[11px] text-stone-500">
                    Gather quick follower feedback on future craft & menu drops
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSurvey} className="overflow-y-auto p-5 space-y-4 text-xs">
              {/* Preset Inspiration Templates */}
              <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-950 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-600" />
                  <span>Quick Templates (Tap to fill):</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {SURVEY_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleOpenBuilder(idx)}
                      className="p-2 rounded-xl bg-white border border-orange-200/70 hover:border-orange-400 text-left transition group shadow-2xs"
                    >
                      <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wide block truncate">
                        {tmpl.category}
                      </span>
                      <span className="text-[11px] font-medium text-stone-800 line-clamp-2 mt-0.5">
                        {tmpl.question}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category / Badge */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Survey Topic / Badge <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  placeholder="e.g. Future Product Drop, New Menu Concept, Weekend Workshop"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs"
                />
              </div>

              {/* Question Input */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Question Prompt <span className="text-orange-600">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="e.g. Which new single-origin coffee roast should we feature on the brew bar next month?"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs resize-none"
                />
              </div>

              {/* Options list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-stone-800">
                    Voting Options (2 to 4 options) <span className="text-orange-600">*</span>
                  </label>
                  {optionsInput.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddOptionField}
                      className="text-orange-600 hover:text-orange-800 text-[11px] font-semibold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Option</span>
                    </button>
                  )}
                </div>

                {optionsInput.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}...`}
                      className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs"
                    />
                    {optionsInput.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOptionField(idx)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
                >
                  <Vote className="w-3.5 h-3.5" />
                  <span>Publish Survey</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
