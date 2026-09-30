import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Clock,
  LogIn,
  MessageCircle,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/mockEngine';
import { Message, Profile } from '../../types';

export const MessagesView: React.FC = () => {
  const {
    currentUser,
    conversations,
    activeChatUserId,
    setActiveChatUserId,
    getChatMessages,
    sendMessage,
    canSendMessage,
    markConversationRead,
    simulateReply,
    viewProfile,
    setActiveTab,
    showToast,
  } = useApp();

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isNewChatModalOpen, setNewChatModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // If user is not logged in, show auth prompt
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center pb-28">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 mx-auto flex items-center justify-center mb-4 shadow-sm">
          <MessageCircle className="w-8 h-8" />
        </div>
        <h2 className="font-display text-lg font-bold text-stone-900 mb-1">
          Direct Messages for Businesses
        </h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
          Connect directly with local roasters, potters, bakers and artisans for orders, collaborations and trade inquiries.
        </p>
        <button
          onClick={() => setActiveTab('auth')}
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 inline-flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In or Create Account</span>
        </button>
      </div>
    );
  }

  const activeChatPartner: Profile | null = activeChatUserId ? db.getProfile(activeChatUserId) : null;
  const currentChatMessages: Message[] = activeChatUserId ? getChatMessages(activeChatUserId) : [];
  const sendEligibility = activeChatUserId ? canSendMessage(activeChatUserId) : { allowed: true };

  // Scroll to bottom of message thread
  useEffect(() => {
    if (activeChatUserId) {
      markConversationRead(activeChatUserId);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChatUserId, currentChatMessages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUserId || !messageInput.trim()) return;

    if (!sendEligibility.allowed) {
      showToast(sendEligibility.reason || 'Cannot send message.', 'error');
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(activeChatUserId, messageInput.trim());
      setMessageInput('');
      markConversationRead(activeChatUserId);
    } catch (err: any) {
      showToast(err.message || 'Failed to send message.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const allAvailableBusinesses = db.getAllProfiles(currentUser.id).filter((p) => p.id !== currentUser.id);

  const formatRelativeTime = (isoString: string) => {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  // --- 1. CONVERSATION THREAD VIEW ---
  if (activeChatPartner) {
    return (
      <div className="max-w-xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden my-3">
        {/* Chat Thread Header */}
        <header className="p-3 sm:p-4 border-b border-stone-100 flex items-center justify-between gap-3 bg-stone-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setActiveChatUserId(null)}
              className="p-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition"
              title="Back to inbox"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => viewProfile(activeChatPartner.id)}
              className="flex items-center gap-2.5 text-left min-w-0 group"
            >
              <img
                src={activeChatPartner.avatar_url}
                alt={activeChatPartner.business_name}
                className="w-9 h-9 rounded-full object-cover border border-stone-200 shrink-0"
              />
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 truncate group-hover:text-orange-600 transition-colors flex items-center gap-1">
                  <span>{activeChatPartner.business_name}</span>
                  {activeChatPartner.is_verified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 inline fill-blue-100" />
                  )}
                </h3>
                <p className="text-[11px] text-stone-500 truncate">{activeChatPartner.category}</p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => viewProfile(activeChatPartner.id)}
              className="px-2.5 py-1 text-[11px] font-semibold text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg transition"
            >
              Profile
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/30">
          {currentChatMessages.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-orange-600" />
              <p className="text-xs font-semibold text-stone-600">No messages yet</p>
              <p className="text-[11px] text-stone-400 max-w-xs mx-auto mt-0.5">
                Send an introductory message to inquire about products, orders, or collaboration.
              </p>
            </div>
          ) : (
            currentChatMessages.map((msg) => {
              const isMine = msg.sender_id === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      isMine
                        ? 'bg-orange-600 text-white rounded-br-xs shadow-2xs'
                        : 'bg-white border border-stone-200/90 text-stone-900 rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    <p className="break-words">{msg.content}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-1 px-1">
                    <span>{formatRelativeTime(msg.created_at)}</span>
                    {isMine && <span>· {msg.is_read ? 'Seen' : 'Sent'}</span>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Protection Notice: "Limit message sending when there is no reply in the inbox" */}
        {!sendEligibility.allowed && (
          <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-amber-900 text-xs">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Awaiting reply before next message</span>
                <span className="text-[11px] text-amber-800 leading-tight block mt-0.5">
                  To protect small businesses from spam, you can send another message once {activeChatPartner.business_name} responds.
                </span>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => simulateReply(activeChatPartner.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold text-[10px] rounded-lg transition active:scale-95"
                  >
                    <Sparkles className="w-3 h-3 text-orange-600" />
                    <span>Simulate {activeChatPartner.business_name} Reply (Test Inbox)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Bar */}
        <footer className="p-3 border-t border-stone-200/80 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={messageInput}
              disabled={!sendEligibility.allowed || isSending}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={
                sendEligibility.allowed
                  ? `Message ${activeChatPartner.business_name}...`
                  : `Waiting for ${activeChatPartner.business_name} to reply...`
              }
              maxLength={2000}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-stone-100 disabled:text-stone-400"
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || !sendEligibility.allowed || isSending}
              className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-40 transition active:scale-95 shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </footer>
      </div>
    );
  }

  // --- 2. INBOX LIST VIEW ---
  return (
    <div className="max-w-xl mx-auto px-4 py-4 pb-28">
      {/* Header with New Message button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-lg font-bold text-stone-900 flex items-center gap-1.5">
            <span>Business Inbox</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold">
              {conversations.length}
            </span>
          </h1>
          <p className="text-[11px] text-stone-500">
            One-on-one trade, custom commissions & direct inquiries
          </p>
        </div>

        <button
          onClick={() => setNewChatModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="font-display text-sm font-bold text-stone-900 mb-1">
            Your Inbox is Empty
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
            Start a direct message thread with any craft business to ask about materials, turnaround time, or stock.
          </p>
          <button
            onClick={() => setNewChatModalOpen(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Select a Business to Message</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200/90 divide-y divide-stone-100 shadow-sm overflow-hidden">
          {conversations.map((conv) => {
            const partner = conv.other_user;
            const isUnread = conv.unread_count > 0;
            const isMine = conv.last_message.sender_id === currentUser.id;

            return (
              <button
                key={partner.id}
                onClick={() => setActiveChatUserId(partner.id)}
                className={`w-full p-3.5 text-left flex items-start gap-3 hover:bg-stone-50/80 transition group ${
                  isUnread ? 'bg-orange-50/30' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={partner.avatar_url}
                    alt={partner.business_name}
                    className="w-11 h-11 rounded-full object-cover border border-stone-200"
                  />
                  {partner.is_verified && (
                    <span className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 fill-blue-100" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span
                      className={`text-xs truncate ${
                        isUnread ? 'font-black text-stone-950' : 'font-bold text-stone-800'
                      }`}
                    >
                      {partner.business_name}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono shrink-0">
                      {formatRelativeTime(conv.last_message.created_at)}
                    </span>
                  </div>

                  <p
                    className={`text-xs truncate ${
                      isUnread ? 'font-semibold text-stone-900' : 'text-stone-500'
                    }`}
                  >
                    {isMine && <span className="text-stone-400 mr-1">You:</span>}
                    {conv.last_message.content}
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 truncate">
                      {partner.category}
                    </span>
                    {!conv.can_send_next && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">
                        Waiting for reply
                      </span>
                    )}
                  </div>
                </div>

                {isUnread && (
                  <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-orange-600 mt-2" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* New Conversation Modal */}
      {isNewChatModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setNewChatModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white border border-stone-200 shadow-2xl p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <div>
                <h3 className="font-bold text-sm text-stone-900">Start New Message</h3>
                <p className="text-[11px] text-stone-500">Pick an artisan business to message</p>
              </div>
              <button
                onClick={() => setNewChatModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold p-1"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {allAvailableBusinesses.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setNewChatModalOpen(false);
                    setActiveChatUserId(b.id);
                  }}
                  className="w-full p-2.5 rounded-xl border border-stone-200 hover:border-orange-400 hover:bg-orange-50/40 text-left transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={b.avatar_url}
                      alt={b.business_name}
                      className="w-9 h-9 rounded-xl object-cover border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate group-hover:text-orange-600 transition-colors flex items-center gap-1">
                        <span>{b.business_name}</span>
                        {b.is_verified && (
                          <ShieldCheck className="w-3 h-3 text-blue-600 fill-blue-100" />
                        )}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">{b.category}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-orange-600 shrink-0">
                    Chat
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
