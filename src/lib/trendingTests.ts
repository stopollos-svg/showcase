/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, LocalDatabase } from './mockEngine';
import { Post } from '../types';

export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

export function runTrendingAcceptanceTests(): TestResult[] {
  const results: TestResult[] = [];
  const testDb = new LocalDatabase();

  // --------------------------------------------------------------------------
  // TEST 1: Deduplication Window (Viewing same post 5 times in 1 sitting logs 1 view)
  // --------------------------------------------------------------------------
  try {
    const testPost = testDb.createPost({
      user_id: 'user_coffee',
      media_type: 'image',
      media_url: 'https://images.unsplash.com/photo-test',
      caption: 'Test Post for View Deduplication',
    });

    const initialViews = testPost.view_count || 0;
    const testViewerId = 'test_viewer_' + Date.now();

    // Attempt to view the same post 5 times in a row in one sitting
    const viewResults: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      const res = testDb.recordView(testPost.id, testViewerId);
      viewResults.push(res.recorded);
    }

    const recordedCount = viewResults.filter((r) => r === true).length;
    const updatedPost = testDb.getPosts().find((p) => p.id === testPost.id);
    const finalViews = updatedPost?.view_count || 0;

    const test1Passed = recordedCount === 1 && finalViews === initialViews + 1;
    results.push({
      name: '1. 24-Hour View Deduplication Window',
      passed: test1Passed,
      details: test1Passed
        ? `Passed: 5 consecutive view calls resulted in exactly 1 recorded view (recorded: ${recordedCount}, post view_count incremented from ${initialViews} to ${finalViews}).`
        : `Failed: Expected 1 recorded view, but recorded ${recordedCount} views.`,
    });
  } catch (err: any) {
    results.push({
      name: '1. 24-Hour View Deduplication Window',
      passed: false,
      details: `Exception: ${err.message}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 2: Decay Math (10-minute old post outranks 3-day old post with similar engagement)
  // --------------------------------------------------------------------------
  try {
    const now = Date.now();

    // Post A: 10 minutes ago
    const tenMinutesAgo = new Date(now - 10 * 60 * 1000).toISOString();
    const postA = testDb.createPost({
      user_id: 'user_ceramics',
      media_type: 'image',
      media_url: 'https://images.unsplash.com/photo-fresh',
      caption: 'Fresh Post (10m ago)',
    });
    // Set created_at to 10m ago and engagement
    testDb.updatePost(postA.id, 'user_ceramics', {
      created_at: tenMinutesAgo,
      like_count: 20,
      likes_count: 20,
      comment_count: 4,
      view_count: 50,
      share_count: 2,
      save_count: 3,
    });

    // Post B: 3 days ago (similar engagement totals)
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    const postB = testDb.createPost({
      user_id: 'user_bakery',
      media_type: 'image',
      media_url: 'https://images.unsplash.com/photo-old',
      caption: '3-Day Old Post with similar totals',
    });
    testDb.updatePost(postB.id, 'user_bakery', {
      created_at: threeDaysAgo,
      like_count: 22,
      likes_count: 22,
      comment_count: 5,
      view_count: 60,
      share_count: 3,
      save_count: 4,
    });

    // Recompute trending scores
    testDb.recomputeTrendingScores();

    const postAScore = testDb.getPosts().find((p) => p.id === postA.id)?.trending_score || 0;
    const postBScore = testDb.getPosts().find((p) => p.id === postB.id)?.trending_score || 0;

    const test2Passed = postAScore > postBScore;
    results.push({
      name: '2. Time Decay Math & Velocity Ranking',
      passed: test2Passed,
      details: test2Passed
        ? `Passed: 10-minute post (score: ${postAScore}) decisively outranks 3-day-old post (score: ${postBScore}) due to age decay denominator power(hours + 2, 1.5).`
        : `Failed: Expected post A (${postAScore}) to outrank post B (${postBScore}).`,
    });
  } catch (err: any) {
    results.push({
      name: '2. Time Decay Math & Velocity Ranking',
      passed: false,
      details: `Exception: ${err.message}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 3: 7-Day Cutoff (Posts older than 7 days NEVER appear in Discover trending)
  // --------------------------------------------------------------------------
  try {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const postOld = testDb.createPost({
      user_id: 'user_leather',
      media_type: 'image',
      media_url: 'https://images.unsplash.com/photo-archived',
      caption: 'Archived Post from 8 days ago',
    });
    testDb.updatePost(postOld.id, 'user_leather', {
      created_at: eightDaysAgo,
      like_count: 100,
      likes_count: 100,
      view_count: 500,
    });

    testDb.recomputeTrendingScores();

    const discoverFeed = testDb.getPosts({ feedType: 'discover' });
    const appearsInDiscover = discoverFeed.some((p) => p.id === postOld.id);

    // Should remain visible on user profile though!
    const authorProfilePosts = testDb.getPostsByUser('user_leather');
    const appearsOnProfile = authorProfilePosts.some((p) => p.id === postOld.id);

    const test3Passed = !appearsInDiscover && appearsOnProfile;
    results.push({
      name: '3. 7-Day Cutoff from Discover Trending',
      passed: test3Passed,
      details: test3Passed
        ? `Passed: 8-day-old post with 100 likes is excluded from Discover trending sort, but remains visible on author's profile (${authorProfilePosts.length} posts).`
        : `Failed: Post older than 7 days appeared in Discover (${appearsInDiscover}) or missing from profile (${appearsOnProfile}).`,
    });
  } catch (err: any) {
    results.push({
      name: '3. 7-Day Cutoff from Discover Trending',
      passed: false,
      details: `Exception: ${err.message}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 4: Account Diversity Rule (Max 2 slots per business in top 20 Discover slots)
  // --------------------------------------------------------------------------
  try {
    // Seed 10 trending posts for user_coffee
    const seededPostIds: string[] = [];
    for (let i = 0; i < 8; i++) {
      const p = testDb.createPost({
        user_id: 'user_coffee',
        media_type: 'image',
        media_url: 'https://images.unsplash.com/photo-diversity-' + i,
        caption: `High trending coffee post #${i}`,
      });
      testDb.updatePost(p.id, 'user_coffee', {
        created_at: new Date(Date.now() - (i + 1) * 3600 * 1000).toISOString(),
        like_count: 80 - i,
        likes_count: 80 - i,
        view_count: 200,
      });
      seededPostIds.push(p.id);
    }

    testDb.recomputeTrendingScores();

    const discoverTop20 = testDb.getPosts({ feedType: 'discover' }).slice(0, 20);
    const coffeeSlotsInTop20 = discoverTop20.filter((p) => p.user_id === 'user_coffee').length;

    const test4Passed = coffeeSlotsInTop20 <= 2;
    results.push({
      name: '4. Account Diversity Guardrail (Max 2 per business in Top 20)',
      passed: test4Passed,
      details: test4Passed
        ? `Passed: Despite having 8+ top-performing posts, user_coffee occupies exactly ${coffeeSlotsInTop20} slots in the top 20 Discover positions (diversity limit = 2).`
        : `Failed: user_coffee occupied ${coffeeSlotsInTop20} slots in top 20 (limit is 2).`,
    });
  } catch (err: any) {
    results.push({
      name: '4. Account Diversity Guardrail (Max 2 per business in Top 20)',
      passed: false,
      details: `Exception: ${err.message}`,
    });
  }

  return results;
}
