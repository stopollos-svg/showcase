/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/navigation/Navbar';
import { BottomNav } from './components/navigation/BottomNav';
import { FeedView } from './components/feed/FeedView';
import { DiscoverView } from './components/feed/DiscoverView';
import { EventsTrackerView } from './components/events/EventsTrackerView';
import { ProfileView } from './components/profile/ProfileView';
import { MessagesView } from './components/messages/MessagesView';
import { AuthPage } from './components/auth/AuthPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { BusinessInsightsDashboard } from './components/insights/BusinessInsightsDashboard';
import { CreatePostModal } from './components/modals/CreatePostModal';
import { EditPostModal } from './components/modals/EditPostModal';
import { EditProfileModal } from './components/profile/EditProfileModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ActivityLogModal } from './components/modals/ActivityLogModal';
import { AuthModal } from './components/modals/AuthModal';
import { AccountSwitcherModal } from './components/modals/AccountSwitcherModal';
import { SupabaseConfigModal } from './components/modals/SupabaseConfigModal';
import { ReportModal } from './components/modals/ReportModal';
import { OnboardingWizardModal } from './components/modals/OnboardingWizardModal';
import { OnboardingTourModal } from './components/modals/OnboardingTourModal';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { WriteReviewModal } from './components/modals/WriteReviewModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { ToastContainer } from './components/common/ToastContainer';
import { Post } from './types';

const MainApp: React.FC = () => {
  const { activeTab } = useApp();

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [reportingTarget, setReportingTarget] = useState<{
    type: 'post' | 'profile';
    post?: Post;
  } | null>(null);

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col font-sans">
      <OfflineIndicator />
      <ToastContainer />
      <Navbar />

      <main className={`flex-1 w-full mx-auto px-2 sm:px-4 ${activeTab === 'insights' || activeTab === 'admin' ? 'max-w-4xl' : 'max-w-2xl'}`}>
        {activeTab === 'home' && (
          <FeedView
            onEditPost={(post) => setEditingPost(post)}
            onReportPost={(post) => setReportingTarget({ type: 'post', post })}
          />
        )}

        {activeTab === 'discover' && (
          <DiscoverView
            onEditPost={(post) => setEditingPost(post)}
            onReportPost={(post) => setReportingTarget({ type: 'post', post })}
          />
        )}

        {activeTab === 'events' && <EventsTrackerView />}

        {activeTab === 'messages' && <MessagesView />}

        {activeTab === 'insights' && <BusinessInsightsDashboard />}

        {activeTab === 'profile' && (
          <ProfileView
            onEditPost={(post) => setEditingPost(post)}
            onReportPost={(post) => setReportingTarget({ type: 'post', post })}
          />
        )}

        {activeTab === 'auth' && <AuthPage />}

        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      <BottomNav />

      {/* Global Modals */}
      <CreatePostModal />
      <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} />
      <EditProfileModal />
      <SettingsModal />
      <ActivityLogModal />
      <AuthModal />
      <AccountSwitcherModal />
      <SupabaseConfigModal />
      <ReportModal target={reportingTarget} onClose={() => setReportingTarget(null)} />
      <OnboardingWizardModal />
      <OnboardingTourModal />
      <GlobalSearchModal />
      <WriteReviewModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
