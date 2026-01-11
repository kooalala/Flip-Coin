
export type Side = 'HEADS' | 'TAILS';

export interface GameState {
  balance: number;
  betAmount: number;
  choice: Side | null;
  lastResult: Side | null;
  isFlipping: boolean;
  history: Side[];
  streak: number;
  wins: number;
  losses: number;
}

export interface FortuneResponse {
  message: string;
  advice: string;
}
