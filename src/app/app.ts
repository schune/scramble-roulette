import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { TabBar } from './shared/tab-bar/tab-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, TabBar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
