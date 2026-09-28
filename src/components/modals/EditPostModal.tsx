import React, { useState } from 'react';
import { X, Trash2, Check } from 'lucide-react';
import { Post } from '../../types';
import { useApp } from '../../context/AppContext';

interface EditPostModalProps {
  post: Post | null;
  onClose: () => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({ post, onClose }) => {
  const { updatePost, deletePost } = useApp();
  const [caption, setCaption] = useState(post?.caption || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!post) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updatePost(post.id, { caption: caption.trim() });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this showcase post? (It will be hidden from the feed and permanently kept in your audit history).')) {
      await deletePost(post.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-stone-900">Edit Post</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Edit Caption</label>
            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none text-xs leading-relaxed"
              maxLength={300}
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-stone-100">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-medium flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Post</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
