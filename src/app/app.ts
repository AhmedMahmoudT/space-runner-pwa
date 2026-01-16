import { Component, signal } from '@angular/core';
import { GameContainerComponent } from './components/game-container/game-container';

@Component({
  selector: 'app-root',
  imports: [GameContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('space-runner');
}
