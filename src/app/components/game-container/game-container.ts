import { Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService, GameState } from '../../services/game';
import { ThreeService } from '../../services/three';
import { LeaderboardService } from '../../services/leaderboard';

@Component({
  selector: 'app-game-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-container.html',
  styleUrl: './game-container.scss',
})
export class GameContainerComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // Public properties for template
  GameState = GameState;

  constructor(
    public gameService: GameService,
    public leaderboardService: LeaderboardService,
    private threeService: ThreeService,
  ) {}

  ngOnInit() {
    this.threeService.init(this.canvasRef.nativeElement);
  }

  startGame() {
    this.gameService.startGame();
  }

  restartGame() {
    this.gameService.resetGame();
    this.threeService.reset();
    this.gameService.startGame();
  }

  setPlayerName(name: string) {
    if (name.trim()) {
      this.leaderboardService.setPlayerName(name.trim());
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.gameService.state() !== GameState.PLAYING) return;

    if (event.key === 'ArrowLeft' || event.key === 'a') {
      this.threeService.moveLeft();
    }
    if (event.key === 'ArrowRight' || event.key === 'd') {
      this.threeService.moveRight();
    }
  }
}
