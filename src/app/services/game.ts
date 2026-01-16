import { Injectable, signal } from '@angular/core';
import { LeaderboardService } from './leaderboard';

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  readonly state = signal<GameState>(GameState.MENU);
  readonly score = signal<number>(0);
  readonly highScore = signal<number>(0);

  constructor(private leaderboardService: LeaderboardService) {
    this.loadHighScore();

    // Sync pending scores when coming back online
    window.addEventListener('online', () => {
      this.leaderboardService.syncPendingScores();
    });
  }

  startGame() {
    this.score.set(0);
    this.state.set(GameState.PLAYING);
  }

  endGame() {
    this.state.set(GameState.GAME_OVER);
    this.updateHighScore();
  }

  resetGame() {
    this.state.set(GameState.MENU);
    this.score.set(0);
  }

  incrementScore(amount: number = 1) {
    if (this.state() === GameState.PLAYING) {
      this.score.update((s) => s + amount);
    }
  }

  private loadHighScore() {
    const saved = localStorage.getItem('space-runner-highscore');
    if (saved) {
      this.highScore.set(parseInt(saved, 10));
    }
  }

  private updateHighScore() {
    const currentScore = this.score();

    if (currentScore > this.highScore()) {
      this.highScore.set(currentScore);
      localStorage.setItem('space-runner-highscore', currentScore.toString());
    }

    // Submit to leaderboard (for any score, not just high scores)
    if (currentScore > 0) {
      this.leaderboardService.submitScore(currentScore);
    }
  }
}
