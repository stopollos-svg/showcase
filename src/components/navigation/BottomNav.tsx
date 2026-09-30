import React from 'react';
import { Compass, Home, MessageCircle, Plus, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, openCreateModal, viewProfile, unreadMessagesCount } = useApp();

  const handleProfileClick = () => {
    if (currentUser) {
      viewProfile(currentUser.id);
    } else {
      setActiveTab('auth');
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 pb-safe shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
        {/* Tab 1: Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors group ${
            activeTab === 'home' ? 'text-orange-600' : 'text-stone-500 hover:text-stone-900'
          }`}
          aria-label="Home Feed"
        >
          <Home className={`w-5 h-5 transition-transform group-active:scale-90 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] font-semibold tracking-tight mt-1">Home</span>
        </button>

        {/* Tab 2: Discover */}
        <button
          onClick={() => setActiveTab('discover')}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors group ${
            activeTab === 'discover' ? 'text-orange-600' : 'text-stone-500 hover:text-stone-900'
          }`}
          aria-label="Discover Businesses"
        >
          <Compass className={`w-5 h-5 transition-transform group-active:scale-90 ${activeTab === 'discover' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] font-semibold tracking-tight mt-1">Discover</span>
        </button>

        {/* Tab 3: Post (+) Center Action Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={openCreateModal}
            className="w-11 h-11 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center shadow-md shadow-orange-600/25 active:scale-95 transition-transform"
            aria-label="Create Showcase Post"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: Messages / Inbox */}
        <button
          onClick={() => setActiveTab('messages')}
          className={`min-h-[44px] relative flex flex-col items-center justify-center transition-colors group ${
            activeTab === 'messages' ? 'text-orange-600' : 'text-stone-500 hover:text-stone-900'
          }`}
          aria-label="Direct Messages"
        >
          <div className="relative">
            <MessageCircle className={`w-5 h-5 transition-transform group-active:scale-90 ${activeTab === 'messages' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1.5 px-1 min-w-[14px] h-[14px] rounded-full bg-orange-600 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadMessagesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-tight mt-1">Inbox</span>
        </button>

        {/* Tab 5: Profile or Login */}
        <button
          onClick={handleProfileClick}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors group ${
            activeTab === 'profile' || activeTab === 'auth' ? 'text-orange-600' : 'text-stone-500 hover:text-stone-900'
          }`}
          aria-label="Business Profile"
        >
          {currentUser && currentUser.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt={currentUser.business_name}
              referrerPolicy="no-referrer"
              className={`w-5 h-5 rounded-full object-cover border ${
                activeTab === 'profile' ? 'border-orange-600 ring-2 ring-orange-200' : 'border-stone-300'
              }`}
            />
          ) : (
            <User className={`w-5 h-5 transition-transform group-active:scale-90 ${activeTab === 'auth' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          )}
          <span className="text-[10px] font-semibold tracking-tight mt-1">
            {currentUser ? 'Profile' : 'Sign In'}
          </span>
        </button>
      </div>
    </nav>
  );
};
