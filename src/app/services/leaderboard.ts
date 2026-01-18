import { Injectable, signal } from '@angular/core';
import { database, auth } from '../firebase.config';
import { ref, push, query, orderByChild, limitToLast, onValue, get } from 'firebase/database';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';

export interface LeaderboardEntry {
  id?: string;
  name: string;
  score: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  readonly leaderboard = signal<LeaderboardEntry[]>([]);
  readonly isOnline = signal<boolean>(navigator.onLine);
  readonly currentUser = signal<User | null>(null);
  readonly playerName = signal<string>('');

  private leaderboardRef = ref(database, 'leaderboard');

  constructor() {
    this.init();
  }

  private async init() {
    // Load saved player name
    const savedName = localStorage.getItem('space-runner-player-name');
    if (savedName) {
      this.playerName.set(savedName);
    }

    // Listen for online/offline status
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));

    // Anonymous auth
    onAuthStateChanged(auth, (user) => {
      this.currentUser.set(user);
      if (user) {
        // console.log('✅ Authenticated anonymously:', user.uid);
      }
    });

    try {
      await signInAnonymously(auth);
    } catch (error) {
      // console.warn('⚠️ Anonymous auth failed (offline?):', error);
    }

    // Subscribe to leaderboard updates
    this.subscribeToLeaderboard();
  }

  private subscribeToLeaderboard() {
    // Get top 100 scores to ensure we have enough entries after deduplication
    const topScoresQuery = query(this.leaderboardRef, orderByChild('score'), limitToLast(100));

    onValue(topScoresQuery, (snapshot) => {
      const entries: LeaderboardEntry[] = [];
      snapshot.forEach((child) => {
        entries.push({
          id: child.key ?? undefined,
          ...child.val(),
        });
      });

      // Deduplicate by player name - keep only the highest score per player
      const playerBestScores = new Map<string, LeaderboardEntry>();
      
      entries.forEach((entry) => {
        const playerName = entry.name.toLowerCase().trim();
        const existing = playerBestScores.get(playerName);
        
        if (!existing || entry.score > existing.score) {
          playerBestScores.set(playerName, entry);
        }
      });

      // Convert map to array and sort by score (descending)
      const uniqueEntries = Array.from(playerBestScores.values());
      uniqueEntries.sort((a, b) => b.score - a.score);
      
      // Take top 10 unique players
      const top10 = uniqueEntries.slice(0, 10);
      
      this.leaderboard.set(top10);
      // console.log('📊 Leaderboard updated:', top10.length, 'unique players (from', entries.length, 'total entries)');
    });
  }

  setPlayerName(name: string) {
    this.playerName.set(name);
    localStorage.setItem('space-runner-player-name', name);
  }

  async submitScore(score: number): Promise<boolean> {
    const name = this.playerName() || 'Anonymous';

    // Always save to localStorage first (offline support)
    this.saveScoreLocally(name, score);

    // Try to submit to Firebase
    if (!this.currentUser()) {
      // console.warn('⚠️ Not authenticated, score saved locally only');
      return false;
    }

    try {
      const entry: Omit<LeaderboardEntry, 'id'> = {
        name,
        score,
        timestamp: Date.now(),
      };

      await push(this.leaderboardRef, entry);
      // console.log('✅ Score submitted to Firebase:', score);
      return true;
    } catch (error) {
      // console.warn('⚠️ Failed to submit score (offline?):', error);
      return false;
    }
  }

  private saveScoreLocally(name: string, score: number) {
    const localScores = this.getLocalScores();
    localScores.push({ name, score, timestamp: Date.now() });
    // Keep only top 10 local scores
    localScores.sort((a, b) => b.score - a.score);
    localScores.splice(10);
    localStorage.setItem('space-runner-local-scores', JSON.stringify(localScores));
  }

  getLocalScores(): LeaderboardEntry[] {
    const saved = localStorage.getItem('space-runner-local-scores');
    return saved ? JSON.parse(saved) : [];
  }

  // Sync any pending local scores when coming back online
  async syncPendingScores() {
    if (!this.isOnline() || !this.currentUser()) return;

    const localScores = this.getLocalScores();
    const lastSyncTime = parseInt(localStorage.getItem('space-runner-last-sync') || '0', 10);

    const pendingScores = localScores.filter((s) => s.timestamp > lastSyncTime);

    for (const score of pendingScores) {
      try {
        await push(this.leaderboardRef, score);
      } catch {
        // Ignore individual failures
      }
    }

    localStorage.setItem('space-runner-last-sync', Date.now().toString());
    // console.log('🔄 Synced', pendingScores.length, 'pending scores');
  }
}
