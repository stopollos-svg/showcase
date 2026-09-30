import React, { useState } from 'react';
import { X, UserMinus, UserCheck, ShieldAlert, Check, UserPlus } from 'lucide-react';
import { Profile } from '../../types';
import { db } from '../../lib/mockEngine';
import { useApp } from '../../context/AppContext';

interface FollowersModalProps {
  profileId: string;
  initialTab?: 'followers' | 'following' | 'requests';
  isOpen: boolean;
  onClose: () => void;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  profileId,
  initialTab = 'followers',
  isOpen,
  onClose,
}) => {
  const { currentUser, removeFollower, followUser, unfollowUser, approveFollowRequest, viewProfile } = useApp();
  const [tab, setTab] = useState<'followers' | 'following' | 'requests'>(initialTab);

  if (!isOpen) return null;

  const isOwner = currentUser?.id === profileId;
  const followers = db.getFollowers(profileId, currentUser?.id);
  const following = db.getFollowing(profileId, currentUser?.id);
  const pendingRequests = isOwner ? db.getFollowRequests(profileId) : [];

  const handleRemove = async (followerId: string, name: string) => {
    if (confirm(`Remove ${name} from your followers list? They will no longer follow your business.`)) {
      await removeFollower(followerId);
    }
  };

  const handleApprove = async (followerId: string) => {
    await approveFollowRequest(followerId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-stone-900">Network & Community</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-stone-100 bg-stone-50/50 p-1">
          <button
            onClick={() => setTab('followers')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              tab === 'followers'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Followers ({followers.length})
          </button>
          <button
            onClick={() => setTab('following')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              tab === 'following'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Following ({following.length})
          </button>
          {isOwner && pendingRequests.length > 0 && (
            <button
              onClick={() => setTab('requests')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition relative ${
                tab === 'requests'
                  ? 'bg-white text-orange-700 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Requests ({pendingRequests.length})
              <span className="w-2 h-2 rounded-full bg-orange-600 inline-block ml-1" />
            </button>
          )}
        </div>

        {/* Body List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'followers' && (
            followers.length > 0 ? (
              followers.map((user: Profile) => (
                <div key={user.id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-stone-50 transition">
                  <button
                    onClick={() => {
                      onClose();
                      viewProfile(user.id);
                    }}
                    className="flex items-center gap-3 text-left min-w-0 flex-1"
                  >
                    <img
                      src={user.avatar_url}
                      alt={user.business_name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate">{user.business_name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{user.category}</p>
                    </div>
                  </button>

                  {/* If current user is the profile owner, they can REMOVE this follower! */}
                  {isOwner ? (
                    <button
                      onClick={() => handleRemove(user.id, user.business_name)}
                      className="px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-stone-200 hover:border-red-200 transition flex items-center gap-1 active:scale-95"
                      title="Remove from your followers"
                    >
                      <UserMinus className="w-3.5 h-3.5 text-red-500" />
                      <span>Remove</span>
                    </button>
                  ) : (
                    currentUser?.id !== user.id && (
                      <button
                        onClick={() => (user.is_following ? unfollowUser(user.id) : followUser(user.id))}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          user.is_following
                            ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        {user.is_following ? 'Following' : 'Follow'}
                      </button>
                    )
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-stone-400 text-xs">No followers yet.</div>
            )
          )}

          {tab === 'following' && (
            following.length > 0 ? (
              following.map((user: Profile) => (
                <div key={user.id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-stone-50 transition">
                  <button
                    onClick={() => {
                      onClose();
                      viewProfile(user.id);
                    }}
                    className="flex items-center gap-3 text-left min-w-0 flex-1"
                  >
                    <img
                      src={user.avatar_url}
                      alt={user.business_name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate">{user.business_name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{user.category}</p>
                    </div>
                  </button>

                  {currentUser?.id === profileId && (
                    <button
                      onClick={() => unfollowUser(user.id)}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition"
                    >
                      Unfollow
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-stone-400 text-xs">Not following any businesses yet.</div>
            )
          )}

          {tab === 'requests' && isOwner && (
            pendingRequests.length > 0 ? (
              pendingRequests.map((user: Profile) => (
                <div key={user.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-orange-50/50 border border-orange-100">
                  <button
                    onClick={() => {
                      onClose();
                      viewProfile(user.id);
                    }}
                    className="flex items-center gap-3 text-left min-w-0 flex-1"
                  >
                    <img
                      src={user.avatar_url}
                      alt={user.business_name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate">{user.business_name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{user.category}</p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleApprove(user.id)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700 transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => removeFollower(user.id)}
                      className="px-2 py-1 rounded-lg text-xs text-stone-500 hover:bg-stone-200 transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-stone-400 text-xs">No pending follow requests.</div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
