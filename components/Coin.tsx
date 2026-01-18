
import React from 'react';
import { Side } from '../types';

interface CoinProps {
  isFlipping: boolean;
  result: Side | null;
}

const Coin: React.FC<CoinProps> = ({ isFlipping, result }) => {
  // We use CSS transforms for the 3D effect.
  // Heads is 0deg, Tails is 180deg.
  // When flipping, we add a random number of full rotations.
  const rotation = isFlipping 
    ? 1800 + Math.random() * 360 
    : (result === 'TAILS' ? 180 : 0);

  return (
    <div className="perspective w-48 h-48 mx-auto mt-4 mb-2 relative group cursor-pointer">
      <div 
        className="coin w-full h-full relative"
        style={{ transform: `rotateY(${rotation}deg)` }}
      >
        {/* Heads Side */}
        <div className="coin-face absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 border-4 border-yellow-700 shadow-2xl flex items-center justify-center">
          <div className="text-yellow-900 font-black text-6xl select-none">H</div>
          <div className="absolute inset-2 rounded-full border border-yellow-400 opacity-30"></div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-yellow-800 text-xs font-bold tracking-widest uppercase">Heads</div>
        </div>

        {/* Tails Side */}
        <div className="coin-face coin-back absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 border-4 border-slate-600 shadow-2xl flex items-center justify-center">
          <div className="text-slate-800 font-black text-6xl select-none">T</div>
          <div className="absolute inset-2 rounded-full border border-slate-300 opacity-30"></div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-slate-700 text-xs font-bold tracking-widest uppercase">Tails</div>
        </div>
      </div>
      
      {/* Shadow Effect */}
      <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/40 blur-xl rounded-full transition-all duration-700 ${isFlipping ? 'scale-150 opacity-20' : 'scale-100 opacity-40'}`}></div>
    </div>
  );
};

export default Coin;
