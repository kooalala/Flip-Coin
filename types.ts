
export type Side = 'HEADS' | 'TAILS';

export interface HistoryEntry {
  id: string;
  choice: Side;
  result: Side;
  amount: number;
  isWin: boolean;
  timestamp: number;
  txHash?: string | null;
}

export interface GameState {
  balance: number;
  betAmount: number;
  choice: Side | null;
  lastResult: Side | null;
  isFlipping: boolean;
  history: HistoryEntry[];
  streak: number;
  wins: number;
  losses: number;
}

export interface FortuneResponse {
  message: string;
  advice: string;
}
