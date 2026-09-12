import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  HelpCircle, 
  Sparkles, 
  Check, 
  Calculator 
} from 'lucide-react';
import { Bet, BetType, Sportsbook, BetStatus } from '../types';
import { formatOdds, oddsToImpliedProbability, calculateProfit } from '../utils/betCalculations';
import { SAMPLE_UPCOMING_MATCHUPS } from '../data/pffData';

interface AddBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBet: (bet: Bet) => void;
  unitSize: number;
  initialBetData?: Partial<Bet>;
}

const SPORTSBOOKS: Sportsbook[] = [
  'DraftKings',
  'FanDuel',
  'BetMGM',
  'Caesars',
  'ESPN BET',
  'Circa',
  'Pinnacle',
  'Bet365',
  'Fanatics',
  'Other'
];

export const AddBetModal: React.FC<AddBetModalProps> = ({
  isOpen,
  onClose,
  onSaveBet,
  unitSize,
  initialBetData
}) => {
  const [matchup, setMatchup] = useState(initialBetData?.matchup || 'KC @ BAL');
  const [teamOrSelection, setTeamOrSelection] = useState(initialBetData?.teamOrSelection || '');
  const [betType, setBetType] = useState<BetType>(initialBetData?.betType || 'spread');
  const [marketLine, setMarketLine] = useState(initialBetData?.marketLine || '');
  const [odds, setOdds] = useState<number>(initialBetData?.odds ?? -110);
  const [stake, setStake] = useState<number>(initialBetData?.stake ?? unitSize);
  const [units, setUnits] = useState<number>(initialBetData?.units ?? 1.0);
  const [sportsbook, setSportsbook] = useState<Sportsbook>(initialBetData?.sportsbook || 'DraftKings');
  const [status, setStatus] = useState<BetStatus>(initialBetData?.status || 'pending');
  const [closingLine, setClosingLine] = useState(initialBetData?.closingLine || '');
  const [closingOdds, setClosingOdds] = useState<number | undefined>(initialBetData?.closingOdds);
  const [pffAdvantageNote, setPffAdvantageNote] = useState(initialBetData?.pffAdvantageNote || '');
  const [confidenceRating, setConfidenceRating] = useState<1 | 2 | 3 | 4 | 5>(initialBetData?.confidenceRating || 4);
  const [notes, setNotes] = useState(initialBetData?.notes || '');

  useEffect(() => {
    if (initialBetData) {
      if (initialBetData.matchup) setMatchup(initialBetData.matchup);
      if (initialBetData.teamOrSelection) setTeamOrSelection(initialBetData.teamOrSelection);
      if (initialBetData.betType) setBetType(initialBetData.betType);
      if (initialBetData.marketLine) setMarketLine(initialBetData.marketLine);
      if (initialBetData.odds !== undefined) setOdds(initialBetData.odds);
      if (initialBetData.stake !== undefined) setStake(initialBetData.stake);
      if (initialBetData.units !== undefined) setUnits(initialBetData.units);
      if (initialBetData.sportsbook) setSportsbook(initialBetData.sportsbook);
      if (initialBetData.status) setStatus(initialBetData.status);
      if (initialBetData.closingLine) setClosingLine(initialBetData.closingLine);
      if (initialBetData.closingOdds !== undefined) setClosingOdds(initialBetData.closingOdds);
      if (initialBetData.pffAdvantageNote) setPffAdvantageNote(initialBetData.pffAdvantageNote);
      if (initialBetData.confidenceRating) setConfidenceRating(initialBetData.confidenceRating);
      if (initialBetData.notes) setNotes(initialBetData.notes);
    }
  }, [initialBetData]);

  if (!isOpen) return null;

  const handleStakeChange = (val: number) => {
    setStake(val);
    setUnits(Math.round((val / unitSize) * 100) / 100);
  };

  const handleUnitsChange = (val: number) => {
    setUnits(val);
    setStake(Math.round(val * unitSize * 100) / 100);
  };

  const potentialProfit = calculateProfit(stake, odds);
  const impliedProb = oddsToImpliedProbability(odds);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let clvDiff: number | undefined = undefined;
    if (marketLine && closingLine) {
      const placedNum = parseFloat(marketLine.replace(/[^\d.-]/g, ''));
      const closingNum = parseFloat(closingLine.replace(/[^\d.-]/g, ''));
      if (!isNaN(placedNum) && !isNaN(closingNum)) {
        clvDiff = Math.abs(placedNum - closingNum);
      }
    }

    let profit: number | undefined = undefined;
    let payout: number | undefined = undefined;
    if (status === 'won') {
      profit = potentialProfit;
      payout = stake + potentialProfit;
    } else if (status === 'lost') {
      profit = -stake;
      payout = 0;
    } else if (status === 'push') {
      profit = 0;
      payout = stake;
    }

    const betRecord: Bet = {
      id: initialBetData?.id || `bet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: initialBetData?.date || new Date().toISOString().slice(0, 10),
      matchup,
      teamOrSelection: teamOrSelection.trim() || `${matchup} Pick`,
      league: 'NFL',
      betType,
      marketLine,
      odds,
      stake,
      units,
      sportsbook,
      status,
      profit,
      payout,
      closingLine: closingLine || undefined,
      closingOdds: closingOdds || undefined,
      clvDifference: clvDiff,
      pffAdvantageNote: pffAdvantageNote.trim() || undefined,
      confidenceRating,
      notes: notes.trim() || undefined,
      createdAt: initialBetData?.createdAt || Date.now()
    };

    onSaveBet(betRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl my-8 p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              {initialBetData?.id ? 'Edit Tracked Bet' : 'Log Sports Bet'}
            </h2>
            <p className="text-xs text-slate-400">
              Record stake, odds, sportsbook, and link PFF metric advantages to measure CLV.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          
          {/* Matchup & Bet Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Matchup Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                NFL Matchup
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={matchup}
                  onChange={(e) => setMatchup(e.target.value)}
                  placeholder="e.g. KC @ BAL, DET @ SF"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>
              <div className="flex gap-1 mt-1 overflow-x-auto pb-1 text-[11px] text-slate-400">
                <span className="shrink-0 text-slate-500">Preset:</span>
                {SAMPLE_UPCOMING_MATCHUPS.slice(0, 3).map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setMatchup(`${m.awayTeamCode} @ ${m.homeTeamCode}`)}
                    className="shrink-0 px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                  >
                    {m.awayTeamCode}@{m.homeTeamCode}
                  </button>
                ))}
              </div>
            </div>

            {/* Bet Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bet Type
              </label>
              <select
                value={betType}
                onChange={(e) => setBetType(e.target.value as BetType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="spread">Point Spread</option>
                <option value="total">Game Total (Over/Under)</option>
                <option value="moneyline">Moneyline</option>
                <option value="player_prop">Player Prop</option>
                <option value="team_total">Team Total</option>
                <option value="parlay">Parlay / Same Game Parlay</option>
                <option value="future">Future</option>
              </select>
            </div>
          </div>

          {/* Selection & Market Line */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Selection / Wager Name
              </label>
              <input
                type="text"
                value={teamOrSelection}
                onChange={(e) => setTeamOrSelection(e.target.value)}
                placeholder="e.g. Chiefs -2.5, Over 47.5, Lamar Jackson O 48.5 Rush Yds"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Line
              </label>
              <input
                type="text"
                value={marketLine}
                onChange={(e) => setMarketLine(e.target.value)}
                placeholder="e.g. -2.5, 47.5"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Odds, Stake, and Units */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                American Odds
              </label>
              <input
                type="number"
                value={odds}
                onChange={(e) => setOdds(parseInt(e.target.value) || -110)}
                className="w-full bg-slate-900 border border-slate-750 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Implied: {impliedProb.toFixed(1)}% ({formatOdds(odds)})
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Stake Amount ($)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs">$</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={stake}
                  onChange={(e) => handleStakeChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-750 rounded-lg pl-7 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  required
                />
              </div>
              <span className="text-[11px] text-emerald-400 mt-1 block">
                To Win: +${potentialProfit.toFixed(2)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Units (1u = ${unitSize})
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={units}
                onChange={(e) => handleUnitsChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-750 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Payout: ${(stake + potentialProfit).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Sportsbook & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sportsbook
              </label>
              <select
                value={sportsbook}
                onChange={(e) => setSportsbook(e.target.value as Sportsbook)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {SPORTSBOOKS.map((sb) => (
                  <option key={sb} value={sb}>{sb}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bet Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BetStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="pending">Pending (Active)</option>
                <option value="won">Won (Settled)</option>
                <option value="lost">Lost (Settled)</option>
                <option value="push">Push / Voided</option>
              </select>
            </div>
          </div>

          {/* Closing Line Value (CLV) Section */}
          <div className="border-t border-slate-800/80 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-teal-400" />
                Closing Line Value (CLV) Tracking
              </span>
              <span className="text-[11px] text-slate-400">
                Track how much line value you beat before kickoff
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Closing Market Line (Optional)
                </label>
                <input
                  type="text"
                  value={closingLine}
                  onChange={(e) => setClosingLine(e.target.value)}
                  placeholder="e.g. -3.5 (if you bet -2.5, you gained 1.0 pt CLV)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Closing Odds (Optional)
                </label>
                <input
                  type="number"
                  value={closingOdds ?? ''}
                  onChange={(e) => setClosingOdds(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="e.g. -125"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* PFF Advantage Note & Confidence */}
          <div className="border-t border-slate-800/80 pt-3 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                PFF Edge Factor / Analytical Rationale
              </label>
              <textarea
                value={pffAdvantageNote}
                onChange={(e) => setPffAdvantageNote(e.target.value)}
                placeholder="e.g. Lions OL #1 PFF run-blocking (90.8) vs SF depleted front. Pressure rate projection under 18%."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Confidence Rating:
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setConfidenceRating(star as any)}
                    className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                      confidenceRating >= star 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    ★ {star}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Save Bet
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
