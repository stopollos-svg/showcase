import React from 'react';
import {
  Sparkles,
  Edit3,
  Camera,
  BarChart2,
  Calendar,
  MessageCircle,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ArrowRight,
  Database,
  Eye,
  TrendingUp,
  Layers,
  MapPin,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OnboardingTourStep } from '../../types';

const TOUR_STEPS: OnboardingTourStep[] = [
  {
    id: 'step_profile',
    title: 'Craft Story & Profile Editor',
    badge: 'Feature 1 of 5 • Profile Studio',
    iconName: 'Edit3',
    description:
      'Customize your artisan business identity, craft specialty category, bio narrative, verified phone contact, and Kampala district coordinates so nearby patrons discover your workshop.',
    targetFeature: 'profile_editor',
    actionButtonText: 'Try Profile Editor',
    highlights: [
      'Set business category & location coordinates for GPS nearby radar',
      'Upload high-res artisan avatar and banner preview',
      'Enable verified phone & WhatsApp ordering for patrons',
    ],
  },
  {
    id: 'step_create_post',
    title: 'Showcase Creations & Media Studio',
    badge: 'Feature 2 of 5 • Content Creator',
    iconName: 'Camera',
    description:
      'Publish high-resolution craft photos, process videos up to 5 minutes, or ambient audio stories. Use the built-in image cropper, video trimming filters, and interactive polls.',
    targetFeature: 'create_post',
    actionButtonText: 'Open Post Creator',
    highlights: [
      '5-minute extended video duration with thumbnail capture',
      'Built-in aspect ratio image cropper (1:1, 4:5, 16:9)',
      'Quick polls, audio ambient layering, and scheduled publishing',
    ],
  },
  {
    id: 'step_insights',
    title: 'Business Insights & Reach Analytics',
    badge: 'Feature 3 of 5 • Analytics Dashboard',
    iconName: 'BarChart2',
    description:
      'Visualize 24-hour impression views, 30-day follower growth trends via Recharts, combined multi-post reach, and peak customer activity hours. Export data to CSV for offline bookkeeping.',
    targetFeature: 'insights_dashboard',
    actionButtonText: 'View Insights Dashboard',
    highlights: [
      'Daily follower growth trendlines and engagement velocity',
      'Combined reach calculator across multiple showcases',
      '1-Click CSV performance data export',
    ],
  },
  {
    id: 'step_events',
    title: 'Google Events Tracker & Showcases',
    badge: 'Feature 4 of 5 • Events & Google News',
    iconName: 'Calendar',
    description:
      'Host cuppings, pop-up markets, and masterclasses. Patrons can RSVP and add your events to Google Calendar, Apple Calendar, or Outlook with 1 click.',
    targetFeature: 'events_tracker',
    actionButtonText: 'Explore Events & News',
    highlights: [
      'Instant 1-Click Google Calendar web intent link generation',
      'Live attendee counters, RSVPs, and Apple iCal (.ics) exports',
      'Curated Google News updates on East African craft economy',
    ],
  },
  {
    id: 'step_messaging',
    title: 'Direct Messaging & Transaction Ledger',
    badge: 'Feature 5 of 5 • Customer Engagement',
    iconName: 'MessageCircle',
    description:
      'Chat one-on-one with patrons in real-time to confirm custom bespoke commissions, answer craft questions, and record orders into the tamper-evident PostgreSQL audit ledger.',
    targetFeature: 'messaging',
    actionButtonText: 'Go to Inbox & Messages',
    highlights: [
      'Real-time direct messaging with read receipts',
      'Direct order support ($) recorded into immutable ledger',
      'Append-only database logs ensuring complete accounting',
    ],
  },
];

export const OnboardingTourModal: React.FC = () => {
  const {
    isOnboardingTourOpen,
    tourStepIndex,
    nextTourStep,
    prevTourStep,
    skipOnboardingTour,
    completeOnboardingTour,
    setEditProfileModalOpen,
    openCreateModal,
    setActiveTab,
    currentUser,
  } = useApp();

  if (!isOnboardingTourOpen || !currentUser) return null;

  const currentStep = TOUR_STEPS[tourStepIndex] || TOUR_STEPS[0];
  const isFirst = tourStepIndex === 0;
  const isLast = tourStepIndex === TOUR_STEPS.length - 1;

  const handleActionClick = () => {
    if (currentStep.targetFeature === 'profile_editor') {
      setEditProfileModalOpen(true);
    } else if (currentStep.targetFeature === 'create_post') {
      openCreateModal();
    } else if (currentStep.targetFeature === 'insights_dashboard') {
      setActiveTab('insights');
    } else if (currentStep.targetFeature === 'events_tracker') {
      setActiveTab('events');
    } else if (currentStep.targetFeature === 'messaging') {
      setActiveTab('messages');
    }

    if (isLast) {
      completeOnboardingTour();
    } else {
      nextTourStep();
    }
  };

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'Edit3':
        return <Edit3 className="w-6 h-6 text-orange-600" />;
      case 'Camera':
        return <Camera className="w-6 h-6 text-orange-600" />;
      case 'BarChart2':
        return <BarChart2 className="w-6 h-6 text-orange-600" />;
      case 'Calendar':
        return <Calendar className="w-6 h-6 text-orange-600" />;
      case 'MessageCircle':
        return <MessageCircle className="w-6 h-6 text-orange-600" />;
      default:
        return <Sparkles className="w-6 h-6 text-orange-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Top Progress Bar */}
        <div className="w-full bg-stone-100 h-1.5 flex">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-full transition-all duration-300 ${
                idx <= tourStepIndex ? 'bg-orange-600' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-200 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-orange-600" />
              <span>Business Onboarding Tour</span>
            </span>
            <span className="text-[11px] text-stone-400 font-medium">
              Step {tourStepIndex + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            onClick={skipOnboardingTour}
            className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition"
            title="Skip onboarding tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              {getStepIcon(currentStep.iconName)}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider block">
                {currentStep.badge}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-snug mt-0.5">
                {currentStep.title}
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Key Feature Checklist */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 space-y-2">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              Core Capabilities:
            </span>
            <ul className="space-y-1.5">
              {currentStep.highlights.map((highlight, hIdx) => (
                <li key={hIdx} className="flex items-start gap-2 text-xs text-stone-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Database Persistence Note */}
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <Database className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>Progress automatically synced and retained in your business profile database</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={skipOnboardingTour}
            className="text-xs font-semibold text-stone-500 hover:text-stone-800 transition py-1.5 px-2"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {!isFirst && (
              <button
                onClick={prevTourStep}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-stone-200 hover:bg-white text-stone-700 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleActionClick}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-orange-300 hover:bg-orange-50 text-orange-800 transition flex items-center gap-1.5 active:scale-95 shadow-2xs"
            >
              <span>{currentStep.actionButtonText}</span>
              <ExternalLink className="w-3 h-3 text-orange-600" />
            </button>

            <button
              onClick={isLast ? completeOnboardingTour : nextTourStep}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1"
            >
              <span>{isLast ? 'Complete Tour' : 'Next'}</span>
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
