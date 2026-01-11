
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Side, GameState, FortuneResponse } from './types';
import Coin from './components/Coin';
import { getLuckAnalysis } from './services/geminiService';

/**
 * BackgroundDecoration Component
 * Renders multiple $ symbols that drift in circular patterns.
 * Uses pointer-events: none to stay non-interactive.
 */
const BackgroundDecoration: React.FC = () => {
  const symbols = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * (4 - 1.5) + 1.5}rem`,
      duration: `${Math.random() * (20 - 10) + 10}s`,
      delay: `-${Math.random() * 20}s`,
      radius: `${Math.random() * (100 - 40) + 40}px`,
      opacity: Math.random() * (0.2 - 0.05) + 0.05
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
      {symbols.map((s) => (
        <div
          key={s.id}
          className="floating-dollar"
          style={{
            left: s.left,
            top: s.top,
            fontSize: s.size,
            opacity: s.opacity,
            // CSS Variables passed to the keyframe animation
            // @ts-ignore
            '--drift-duration': s.duration,
            '--drift-delay': s.delay,
            '--drift-radius': s.radius,
          } as React.CSSProperties}
        >
          $
        </div>
      ))}
    </div>
  );
};

/**
 * ResultModal Component
 * Handles the popup overlay and display of flip results.
 */
interface ModalProps {
  isOpen: boolean;
  result: Side | null;
  isWin: boolean;
  onClose: () => void;
}

const ResultModal: React.FC<ModalProps> = ({ isOpen, result, isWin, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Dimmed Overlay */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center transform animate-in zoom-in-95 duration-300">
        <div className="mb-6">
          <div className={`text-5xl mb-4 ${isWin ? 'animate-bounce' : ''}`}>
            {isWin ? '🎉' : '❌'}
          </div>
          <h2 className={`text-3xl font-black mb-2 ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isWin ? 'YOU WIN!' : 'YOU LOSE!'}
          </h2>
          <p className="text-slate-400 font-medium">
            Coin landed on <span className="text-slate-100 font-bold uppercase">{result}</span>
          </p>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    balance: 1000,
    betAmount: 50,
    choice: 'HEADS',
    lastResult: null,
    isFlipping: false,
    history: [],
    streak: 0,
    wins: 0,
    losses: 0,
  });

  const [aiFortune, setAiFortune] = useState<FortuneResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isStreakAnimating, setIsStreakAnimating] = useState(false);

  const resetRound = useCallback(() => {
    setIsModalOpen(false);
    setState(prev => ({
      ...prev,
      choice: null, 
      lastResult: null,
    }));
  }, []);

  const flipCoin = useCallback(async () => {
    if (state.isFlipping) return;
    if (state.betAmount > state.balance) {
      setMessage("Insufficient balance! Reduce your bet.");
      return;
    }
    if (!state.choice) {
      setMessage("Pick a side first!");
      return;
    }

    setMessage(null);
    setIsModalOpen(false);
    setState(prev => ({ ...prev, isFlipping: true }));

    setTimeout(() => {
      const outcome: Side = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
      const isWin = outcome === state.choice;
      
      setState(prev => {
        const newBalance = isWin ? prev.balance + prev.betAmount : prev.balance - prev.betAmount;
        const newStreak = isWin ? prev.streak + 1 : 0;
        
        if (newStreak > prev.streak) {
          setIsStreakAnimating(true);
          setTimeout(() => setIsStreakAnimating(false), 600);
        }

        return {
          ...prev,
          balance: newBalance,
          lastResult: outcome,
          isFlipping: false,
          wins: isWin ? prev.wins + 1 : prev.wins,
          losses: isWin ? prev.losses : prev.losses + 1,
          streak: newStreak,
          history: [outcome, ...prev.history].slice(0, 10),
        };
      });

      setIsModalOpen(true);
    }, 1000);
  }, [state]);

  useEffect(() => {
    if (state.wins + state.losses > 0 && (state.wins + state.losses) % 3 === 0) {
      getLuckAnalysis(state.wins, state.losses, state.streak).then(setAiFortune);
    }
  }, [state.wins, state.losses, state.streak]);

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setState(prev => ({ ...prev, betAmount: Math.max(0, val) }));
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Layer: Animated Dollars */}
      <BackgroundDecoration />

      {/* Result Modal Overlay */}
      <ResultModal 
        isOpen={isModalOpen}
        result={state.lastResult}
        isWin={state.lastResult === state.choice}
        onClose={resetRound}
      />

      {/* Main UI Card */}
      <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative z-10">
        {/* Header / Stats */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent">
              Gemini Luck
            </h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Coin Mastery</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-emerald-400">${state.balance}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">Balance</div>
          </div>
        </div>

        {/* Game Area */}
        <div className="p-8 space-y-8">
          <Coin isFlipping={state.isFlipping} result={state.lastResult} />

          {/* Controls */}
          <div className="space-y-6">
            {/* Side Selection */}
            <div className="flex gap-4">
              <button 
                disabled={state.isFlipping}
                onClick={() => setState(prev => ({ ...prev, choice: 'HEADS' }))}
                className={`flex-1 py-4 rounded-2xl font-bold transition-all border-2 ${state.choice === 'HEADS' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'bg-slate-800 border-transparent text-slate-400 hover:bg-slate-700'}`}
              >
                Heads
              </button>
              <button 
                disabled={state.isFlipping}
                onClick={() => setState(prev => ({ ...prev, choice: 'TAILS' }))}
                className={`flex-1 py-4 rounded-2xl font-bold transition-all border-2 ${state.choice === 'TAILS' ? 'bg-slate-400/10 border-slate-400 text-slate-300 shadow-[0_0_20px_rgba(148,163,184,0.2)]' : 'bg-slate-800 border-transparent text-slate-400 hover:bg-slate-700'}`}
              >
                Tails
              </button>
            </div>

            {/* Bet Input */}
            <div className="relative group">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Bet Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input 
                  type="number" 
                  value={state.betAmount}
                  onChange={handleBetChange}
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-4 pl-8 pr-4 text-slate-100 font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Flip Button */}
            <button 
              disabled={state.isFlipping}
              onClick={flipCoin}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all transform active:scale-95 ${state.isFlipping ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1'}`}
            >
              {state.isFlipping ? 'FLIPPING...' : 'FLIP COIN'}
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-8 pb-8 space-y-4">
          {message && (
            <div className="text-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
              {message}
            </div>
          )}

          {/* AI Fortune Box */}
          {aiFortune && (
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex-shrink-0 flex items-center justify-center text-xs shadow-[0_0_10px_rgba(16,185,129,0.3)] text-white">✨</div>
              <div>
                <p className="text-xs text-emerald-300 italic leading-relaxed">"{aiFortune.message}"</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">— Gemini Oracle</p>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 py-4 border-t border-slate-800/50">
            <div className="text-center">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">Wins</div>
              <div className="text-slate-100 font-black">{state.wins}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">Losses</div>
              <div className="text-slate-100 font-black">{state.losses}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">Streak</div>
              <div 
                key={state.streak}
                className={`text-amber-400 font-black inline-block transition-transform ${isStreakAnimating ? 'animate-streak' : ''}`}
              >
                {state.streak}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
