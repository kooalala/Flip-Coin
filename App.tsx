
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Side, GameState, FortuneResponse, HistoryEntry } from './types';
import Coin from './components/Coin';
import { getLuckAnalysis } from './services/geminiService';

/**
 * Blockchain Configuration
 */
const CONTRACT_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
const NETWORK_NAME = "Base Sepolia";
const CHAIN_ID = 84532;
const EXPLORER_URL = "https://sepolia.basescan.org/tx/";

/**
 * Wallet Icons
 */
const WalletIcons = {
  MetaMask: () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M28.0667 4.2L29.6 11.2667L22.2667 8.33333L28.0667 4.2Z" fill="#E17D23" />
      <path d="M3.93333 4.2L2.4 11.2667L9.73333 8.33333L3.93333 4.2Z" fill="#E17D23" />
      <path d="M24.8 19.3333L22.2667 24.3333L22.4667 24.5333L25.3333 22.4667L24.8 19.3333Z" fill="#E17D23" />
      <path d="M7.2 19.3333L9.73333 24.3333L9.53333 24.5333L6.66667 22.4667L7.2 19.3333Z" fill="#E17D23" />
      <path d="M16 3.6L22.2667 8.33333L16 11.6667L9.73333 8.33333L16 3.6Z" fill="#E17D23" />
      <path d="M16 26.6L22.4 24.5333L21 28.4L16 26.6Z" fill="#E17D23" />
      <path d="M16 26.6L9.6 24.5333L11 28.4L16 26.6Z" fill="#E17D23" />
    </svg>
  ),
  OKX: () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="24" height="24" rx="4" fill="white" />
      <rect x="8" y="8" width="6.4" height="6.4" fill="black" />
      <rect x="17.6" y="8" width="6.4" height="6.4" fill="black" />
      <rect x="8" y="17.6" width="6.4" height="6.4" fill="black" />
      <rect x="17.6" y="17.6" width="6.4" height="6.4" fill="black" />
    </svg>
  ),
  Coinbase: () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#0052FF" />
      <rect x="10" y="10" width="12" height="12" rx="2" fill="white" />
    </svg>
  ),
};

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (provider: string) => void;
  isConnecting: boolean;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onSelect, isConnecting }) => {
  if (!isOpen) return null;

  const providers = [
    { name: 'MetaMask', icon: WalletIcons.MetaMask },
    { name: 'OKX Wallet', icon: WalletIcons.OKX },
    { name: 'Coinbase Wallet', icon: WalletIcons.Coinbase },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1">Base Sepolia Enabled</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          {isConnecting ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 font-medium">Authenticating Network...</p>
            </div>
          ) : (
            providers.map((p) => (
              <button
                key={p.name}
                onClick={() => onSelect(p.name)}
                className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-slate-900 p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <p.icon />
                  </div>
                  <span className="font-bold text-slate-200">{p.name}</span>
                </div>
                <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-emerald-500 transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>
        <div className="mt-6 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <p className="text-[10px] text-slate-400 leading-relaxed text-center font-medium">
            Deploying on <span className="text-indigo-400 font-bold">Base Sepolia</span> ensures fast transactions and near-zero fees.
          </p>
        </div>
      </div>
    </div>
  );
};

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

interface ModalProps {
  isOpen: boolean;
  result: Side | null;
  isWin: boolean;
  onClose: () => void;
  txHash?: string | null;
}

const ResultModal: React.FC<ModalProps> = ({ isOpen, result, isWin, onClose, txHash }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 w-full max-sm rounded-3xl shadow-2xl p-8 text-center transform animate-in zoom-in-95 duration-300">
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
        <div className="space-y-3 mb-8">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            PLAY AGAIN
          </button>
          {txHash && (
            <a 
              href={`${EXPLORER_URL}${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-2xl border border-slate-700 transition-all"
            >
              View on BaseScan
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const HistoryTab: React.FC<{ history: HistoryEntry[] }> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500">
        <svg className="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-medium">No flips yet. Start playing!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {history.map((entry) => (
        <div 
          key={entry.id} 
          className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between group hover:bg-slate-800/60 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${entry.isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {entry.isWin ? '✓' : '✕'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-tighter">
                  {entry.choice}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-40">vs</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                  {entry.result}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-black ${entry.isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
              {entry.isWin ? '+' : '-'}${entry.amount}
            </div>
            {entry.txHash && (
              <a 
                href={`${EXPLORER_URL}${entry.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest hover:underline"
              >
                Tx Link
              </a>
            )}
          </div>
        </div>
      ))}
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

  const [activeTab, setActiveTab] = useState<'GAME' | 'HISTORY'>('GAME');
  const [aiFortune, setAiFortune] = useState<FortuneResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isStreakAnimating, setIsStreakAnimating] = useState(false);

  // Wallet State
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [currentTxHash, setCurrentTxHash] = useState<string | null>(null);

  const connectWallet = (provider: string) => {
    setIsConnecting(true);
    setTimeout(() => {
      const mockAddress = `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`;
      setWalletAddress(mockAddress);
      setIsConnecting(false);
      setIsWalletModalOpen(false);
      setMessage(`Connected to ${provider}`);
    }, 1500);
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setCurrentTxHash(null);
  };

  const resetRound = useCallback(() => {
    setIsModalOpen(false);
    setTxStatus(null);
    setState(prev => ({
      ...prev,
      choice: null, 
      lastResult: null,
    }));
  }, []);

  const flipCoin = useCallback(async () => {
    if (state.isFlipping) return;
    if (state.betAmount > state.balance) {
      setMessage("Insufficient balance!");
      return;
    }
    if (!state.choice) {
      setMessage("Pick a side first!");
      return;
    }

    setMessage(null);
    setIsModalOpen(false);
    let localTxHash = null;
    
    // Blockchain Mode Logic
    if (walletAddress) {
      setTxStatus("Awaiting Signature...");
      await new Promise(r => setTimeout(r, 800));
      
      setTxStatus("Broadcasting to Base...");
      localTxHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join("");
      setCurrentTxHash(localTxHash);
      await new Promise(r => setTimeout(r, 1200));
      
      setTxStatus("Confirming Block...");
      await new Promise(r => setTimeout(r, 1000));
    }

    setTxStatus(null);
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

        const newHistoryEntry: HistoryEntry = {
          id: Math.random().toString(36).substr(2, 9),
          choice: prev.choice as Side,
          result: outcome,
          amount: prev.betAmount,
          isWin,
          timestamp: Date.now(),
          txHash: localTxHash
        };

        return {
          ...prev,
          balance: newBalance,
          lastResult: outcome,
          isFlipping: false,
          wins: isWin ? prev.wins + 1 : prev.wins,
          losses: isWin ? prev.losses : prev.losses + 1,
          streak: newStreak,
          history: [newHistoryEntry, ...prev.history].slice(0, 50),
        };
      });

      setIsModalOpen(true);
    }, 1000);
  }, [state, walletAddress]);

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
      <BackgroundDecoration />
      <ResultModal isOpen={isModalOpen} result={state.lastResult} isWin={state.lastResult === state.choice} onClose={resetRound} txHash={currentTxHash} />
      <WalletModal isOpen={isWalletModalOpen} isConnecting={isConnecting} onSelect={connectWallet} onClose={() => setIsWalletModalOpen(false)} />

      {/* Main UI Card */}
      <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative z-10 flex flex-col h-[660px]">
        
        {/* Header with Wallet Toggle */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/60 flex-shrink-0">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-amber-500 bg-clip-text text-transparent">
              Luck is Based
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[9px] text-slate-400 font-bold tracking-[0.2em] uppercase">Base Sepolia</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {walletAddress ? (
              <button onClick={disconnectWallet} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full hover:bg-emerald-500/20 transition-all">
                <div className="w-2 h-2 rounded-full bg-emerald-500 status-pulse"></div>
                <span className="text-[11px] font-bold text-emerald-400">{walletAddress}</span>
              </button>
            ) : (
              <button onClick={() => setIsWalletModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                Connect Wallet
              </button>
            )}
            <div className="text-right mt-1">
              <div className="text-2xl font-black text-emerald-400 leading-none">${state.balance}</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-2 flex-shrink-0">
          <div className="bg-slate-800/50 p-1 rounded-2xl flex gap-1 border border-slate-700/50">
            <button 
              onClick={() => setActiveTab('GAME')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'GAME' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Play
            </button>
            <button 
              onClick={() => setActiveTab('HISTORY')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              History
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden p-6 pt-0">
          {activeTab === 'GAME' ? (
            <div className="h-full flex flex-col space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="relative">
                {txStatus && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(99,102,241,0.3)]"></div>
                    <p className="text-[10px] font-bold text-indigo-400 bg-slate-900/80 px-4 py-2 rounded-full backdrop-blur-md border border-indigo-500/30 uppercase tracking-widest">
                      {txStatus}
                    </p>
                  </div>
                )}
                <div className={txStatus ? 'opacity-20 blur-sm grayscale' : 'transition-all duration-500'}>
                  <Coin isFlipping={state.isFlipping} result={state.lastResult} />
                </div>
              </div>

              <div className="space-y-3 pb-2">
                <div className="flex gap-2">
                  <button 
                    disabled={state.isFlipping || txStatus !== null}
                    onClick={() => setState(prev => ({ ...prev, choice: 'HEADS' }))}
                    className={`flex-1 py-3 rounded-2xl font-bold transition-all border-2 text-sm ${state.choice === 'HEADS' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'bg-slate-800 border-transparent text-slate-400 hover:bg-slate-700'}`}
                  >
                    Heads
                  </button>
                  <button 
                    disabled={state.isFlipping || txStatus !== null}
                    onClick={() => setState(prev => ({ ...prev, choice: 'TAILS' }))}
                    className={`flex-1 py-3 rounded-2xl font-bold transition-all border-2 text-sm ${state.choice === 'TAILS' ? 'bg-slate-400/10 border-slate-400 text-slate-300 shadow-[0_0_20px_rgba(148,163,184,0.2)]' : 'bg-slate-800 border-transparent text-slate-400 hover:bg-slate-700'}`}
                  >
                    Tails
                  </button>
                </div>

                <div className="relative">
                  <input 
                    disabled={state.isFlipping || txStatus !== null}
                    type="number" 
                    value={state.betAmount}
                    onChange={handleBetChange}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-slate-100 font-bold focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                </div>

                <button 
                  disabled={state.isFlipping || txStatus !== null}
                  onClick={flipCoin}
                  className={`w-full py-4 rounded-2xl font-black text-base transition-all transform active:scale-95 ${state.isFlipping || txStatus ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-0.5'}`}
                >
                  {txStatus ? 'BLOCKCHAIN CALL...' : state.isFlipping ? 'FLIPPING...' : walletAddress ? 'SUBMIT TRANSACTION' : 'FLIP COIN (PRACTICE)'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
              <HistoryTab history={state.history} />
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 pb-4 space-y-2 flex-shrink-0">
          {message && (
            <div className="text-center p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold uppercase tracking-widest">
              {message}
            </div>
          )}

          {aiFortune && activeTab === 'GAME' && !message && (
            <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex gap-3 items-start relative overflow-hidden group">
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex-shrink-0 flex items-center justify-center text-[10px] shadow-[0_0_10px_rgba(16,185,129,0.3)] text-white">✨</div>
              <div>
                <p className="text-[10px] text-emerald-300 italic leading-tight">"{aiFortune.message}"</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-4 pb-2 border-t border-slate-800/30">
            <div className="text-center">
              <div className="text-slate-500 text-[9px] font-bold uppercase tracking-tighter mb-0.5">Wins</div>
              <div className="text-slate-100 font-black text-base leading-none">{state.wins}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500 text-[9px] font-bold uppercase tracking-tighter mb-0.5">Losses</div>
              <div className="text-slate-100 font-black text-base leading-none">{state.losses}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500 text-[9px] font-bold uppercase tracking-tighter mb-0.5">Streak</div>
              <div key={state.streak} className={`text-amber-400 font-black text-base leading-none inline-block transition-transform ${isStreakAnimating ? 'animate-streak' : ''}`}>
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
