import React from 'react';
import {
  Bell,
  Check,
  Heart,
  MessageSquare,
  Reply,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppNotification } from '../../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    viewProfile,
    setActiveTab,
  } = useApp();

  if (!isOpen) return null;

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationRead(notif.id);
    onClose();
    if (notif.type === 'follow') {
      viewProfile(notif.actor_id);
    } else {
      setActiveTab('home');
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="w-3.5 h-3.5 text-orange-600" />;
      case 'reply':
        return <Reply className="w-3.5 h-3.5 text-blue-600" />;
      case 'mention':
        return <Sparkles className="w-3.5 h-3.5 text-purple-600" />;
      case 'like':
        return <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />;
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/90">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-600" />
            <h3 className="font-display font-bold text-sm text-stone-900">Notifications</h3>
            {unreadNotificationsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
                {unreadNotificationsCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadNotificationsCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="text-[11px] font-semibold text-orange-600 hover:text-orange-700"
              >
                Mark read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-stone-400 space-y-1">
              <Bell className="w-8 h-8 mx-auto text-stone-300 stroke-[1.5]" />
              <p className="text-xs font-bold text-stone-700">No notifications yet</p>
              <p className="text-[11px] text-stone-400">
                You'll receive alerts when businesses comment, reply, or mention you.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const actor = notif.actor;
              return (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full p-3 rounded-2xl text-left transition flex items-start gap-3 border ${
                    !notif.is_read
                      ? 'bg-orange-50/60 border-orange-200/80 hover:bg-orange-50'
                      : 'bg-white border-stone-100 hover:bg-stone-50'
                  }`}
                >
                  <div className="relative shrink-0 mt-0.5">
                    <img
                      src={actor?.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
                      alt={actor?.business_name || 'Business'}
                      className="w-8 h-8 rounded-full object-cover border border-stone-200"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-2xs">
                      {getIcon(notif.type)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs text-stone-900 truncate">
                        {actor?.business_name || 'Artisan Business'}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono shrink-0">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                  </div>

                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-orange-600 mt-2 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
