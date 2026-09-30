/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ViewTracker: Client-side batched view tracking with Intersection Observer
 *
 * Rules:
 * 1. Log a view when a post is at least 60% visible for 1+ second
 * 2. 24-hour client & server deduplication window
 * 3. Batch view events client-side and flush every few seconds (3s)
 */

type ViewBatchCallback = (postIds: string[]) => void | Promise<void>;

const STORAGE_KEY_PREFIX = 'amapati_views_v1_';
const FLUSH_INTERVAL_MS = 3000;
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

class ViewTrackerService {
  private queue: Set<string> = new Set();
  private flushTimer: any = null;
  private onFlushCallback: ViewBatchCallback | null = null;
  private timerMap: Map<string, any> = new Map();
  private observer: IntersectionObserver | null = null;

  constructor() {
    this.initVisibilityListener();
  }

  public setFlushHandler(callback: ViewBatchCallback) {
    this.onFlushCallback = callback;
  }

  /**
   * Checks if this viewer already viewed the post within the rolling 24-hour window
   */
  public hasViewedRecently(postId: string, viewerId?: string | null): boolean {
    try {
      const key = `${STORAGE_KEY_PREFIX}${viewerId || 'anon'}_${postId}`;
      const record = localStorage.getItem(key);
      if (!record) return false;
      const timestamp = parseInt(record, 10);
      if (isNaN(timestamp)) return false;
      return Date.now() - timestamp < DEDUPE_WINDOW_MS;
    } catch {
      return false;
    }
  }

  /**
   * Mark post as viewed locally to dedupe client-side
   */
  public markViewedLocally(postId: string, viewerId?: string | null) {
    try {
      const key = `${STORAGE_KEY_PREFIX}${viewerId || 'anon'}_${postId}`;
      localStorage.setItem(key, Date.now().toString());
    } catch {
      // ignore storage quota errors
    }
  }

  /**
   * Queue a post view for batched sending
   */
  public queueView(postId: string, viewerId?: string | null) {
    if (this.hasViewedRecently(postId, viewerId)) {
      return; // Deduped within 24 hours
    }

    this.markViewedLocally(postId, viewerId);
    this.queue.add(postId);

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, FLUSH_INTERVAL_MS);
    }
  }

  /**
   * Flush batched views immediately
   */
  public async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.queue.size === 0) return;

    const postIds = Array.from(this.queue);
    this.queue.clear();

    if (this.onFlushCallback) {
      try {
        await this.onFlushCallback(postIds);
      } catch (err) {
        console.warn('Failed to flush view tracking batch:', err);
      }
    }
  }

  /**
   * Set up an element for intersection observation
   * Threshold 0.6 = 60% visible
   * Dwell time: 1000ms (1 second) continuous
   */
  public observePost(
    element: HTMLElement,
    postId: string,
    viewerId?: string | null,
    onViewRecorded?: (postId: string) => void
  ): () => void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return () => {};
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            // Start dwell timer (1 second continuous visibility)
            if (!this.timerMap.has(postId)) {
              const timer = setTimeout(() => {
                this.queueView(postId, viewerId);
                onViewRecorded?.(postId);
                this.timerMap.delete(postId);
              }, 1000);
              this.timerMap.set(postId, timer);
            }
          } else {
            // Cancel timer if post leaves 60% viewport visibility before 1 second
            if (this.timerMap.has(postId)) {
              clearTimeout(this.timerMap.get(postId));
              this.timerMap.delete(postId);
            }
          }
        });
      },
      {
        threshold: [0.6],
      }
    );

    observer.observe(element);

    return () => {
      if (this.timerMap.has(postId)) {
        clearTimeout(this.timerMap.get(postId));
        this.timerMap.delete(postId);
      }
      observer.unobserve(element);
      observer.disconnect();
    };
  }

  private initVisibilityListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }
}

export const viewTracker = new ViewTrackerService();
