import React, { useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  Filter, 
  Download, 
  Check, 
  X, 
  RotateCcw, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  PlusCircle,
  Cpu,
  CalendarDays
} from 'lucide-react';
import { Bet, BetStatus, BetType, Sportsbook } from '../types';
import { formatCurrency, formatOdds, exportBetsToCSV } from '../utils/betCalculations';

interface BetTrackerProps {
  bets: Bet[];
  onUpdateBetStatus: (id: string, status: BetStatus) => void;
  onDeleteBet: (id: string) => void;
  onEditBet: (bet: Bet) => void;
  onOpenAddBet: () => void;
  onNavigateToPredict: () => void;
  onNavigateToWeekly?: () => void;
}

export const BetTracker: React.FC<BetTrackerProps> = ({
  bets,
  onUpdateBetStatus,
  onDeleteBet,
  onEditBet,
  onOpenAddBet,
  onNavigateToPredict,
  onNavigateToWeekly
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sportsbookFilter, setSportsbookFilter] = useState<string>('all');
  const [expandedBetId, setExpandedBetId] = useState<string | null>(null);

  // Filtered bets
  const filteredBets = bets.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (typeFilter !== 'all' && b.betType !== typeFilter) return false;
    if (sportsbookFilter !== 'all' && b.sportsbook !== sportsbookFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMatchup = b.matchup.toLowerCase().includes(q);
      const matchTeam = b.teamOrSelection.toLowerCase().includes(q);
      const matchNotes = (b.notes || '').toLowerCase().includes(q);
      const matchPff = (b.pffAdvantageNote || '').toLowerCase().includes(q);
      if (!matchMatchup && !matchTeam && !matchNotes && !matchPff) return false;
    }
    return true;
  });

  const pendingCount = bets.filter(b => b.status === 'pending').length;
  const wonCount = bets.filter(b => b.status === 'won').length;
  const lostCount = bets.filter(b => b.status === 'lost').length;

  const toggleExpand = (id: string) => {
    setExpandedBetId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-750 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All Bets ({bets.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-400" />
              Active Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('won')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'won'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Check className="w-3 h-3 text-emerald-400" />
              Won ({wonCount})
            </button>
            <button
              onClick={() => setStatusFilter('lost')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'lost'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-3 h-3 text-rose-400" />
              Lost ({lostCount})
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            {onNavigateToWeekly && (
              <button
                id="btn-tracker-to-weekly"
                onClick={onNavigateToWeekly}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                <span>Weekly Insights</span>
              </button>
            )}
            <button
              onClick={() => exportBetsToCSV(bets)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              title="Export Ledger to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onOpenAddBet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Bet</span>
            </button>
          </div>
        </div>

        {/* Search & Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team, player, matchup, or PFF notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
              >
                &times;
              </button>
            )}
          </div>

          {/* Bet Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Bet Types</option>
              <option value="spread">Point Spreads</option>
              <option value="total">Totals (Over/Under)</option>
              <option value="moneyline">Moneylines</option>
              <option value="player_prop">Player Props</option>
              <option value="parlay">Parlays</option>
            </select>
          </div>

          {/* Sportsbook Filter */}
          <div>
            <select
              value={sportsbookFilter}
              onChange={(e) => setSportsbookFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Sportsbooks</option>
              <option value="DraftKings">DraftKings</option>
              <option value="FanDuel">FanDuel</option>
              <option value="BetMGM">BetMGM</option>
              <option value="Caesars">Caesars</option>
              <option value="ESPN BET">ESPN BET</option>
              <option value="Circa">Circa</option>
              <option value="Pinnacle">Pinnacle</option>
            </select>
          </div>

        </div>
      </div>

      {/* Bets Ledger List */}
      <div className="space-y-3">
        {filteredBets.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
              <TrendingUp className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">No bets found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                {bets.length === 0 
                  ? "Start by tracking your first sports wager or browse the PFF Predictive Edge Terminal for +EV recommendations."
                  : "Try adjusting your search or active filter tabs above."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenAddBet}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Log Sports Bet
              </button>
              <button
                onClick={onNavigateToPredict}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Explore PFF Edges
              </button>
            </div>
          </div>
        ) : (
          filteredBets.map((bet) => {
            const isExpanded = expandedBetId === bet.id;
            const isWon = bet.status === 'won';
            const isLost = bet.status === 'lost';
            const isPending = bet.status === 'pending';
            const isPush = bet.status === 'push';

            return (
              <div
                key={bet.id}
                className={`bg-slate-900 border transition-all rounded-xl p-4 sm:p-5 shadow-xs ${
                  isWon
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : isLost
                    ? 'border-rose-500/20 hover:border-rose-500/40'
                    : isPending
                    ? 'border-amber-500/30 hover:border-amber-500/50'
                    : 'border-slate-800'
                }`}
              >
                {/* Main Card Grid */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Left: Matchup & Pick Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-800 text-slate-300">
                        {bet.matchup}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        bet.betType === 'spread' ? 'bg-sky-500/10 text-sky-300' :
                        bet.betType === 'total' ? 'bg-purple-500/10 text-purple-300' :
                        bet.betType === 'player_prop' ? 'bg-amber-500/10 text-amber-300' :
                        'bg-teal-500/10 text-teal-300'
                      }`}>
                        {bet.betType.replace('_', ' ')}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {bet.sportsbook} &bull; {bet.date}
                      </span>

                      {/* CLV Badge if available */}
                      {bet.clvDifference !== undefined && bet.clvDifference > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                          +{bet.clvDifference} CLV Beat
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        {bet.teamOrSelection}
                      </h3>
                      {bet.marketLine && (
                        <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {bet.marketLine}
                        </span>
                      )}
                    </div>

                    {/* Preview of PFF Advantage Note */}
                    {bet.pffAdvantageNote && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-md">{bet.pffAdvantageNote}</span>
                      </div>
                    )}
                  </div>

                  {/* Middle: Odds, Stake & Potential Payout */}
                  <div className="flex items-center gap-4 sm:gap-6 shrink-0 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800/80">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Odds</span>
                      <span className="text-xs sm:text-sm font-mono font-bold text-slate-200">
                        {formatOdds(bet.odds)}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Stake</span>
                      <span className="text-xs sm:text-sm font-mono font-bold text-white">
                        ${bet.stake}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        ({bet.units}u)
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Result</span>
                      {isWon ? (
                        <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400">
                          +${(bet.profit || 0).toFixed(2)}
                        </span>
                      ) : isLost ? (
                        <span className="text-xs sm:text-sm font-mono font-bold text-rose-400">
                          -${bet.stake.toFixed(2)}
                        </span>
                      ) : isPush ? (
                        <span className="text-xs sm:text-sm font-mono font-bold text-slate-400">
                          $0.00 (Push)
                        </span>
                      ) : (
                        <span className="text-xs sm:text-sm font-mono font-bold text-amber-400">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Settlement Buttons & Menu */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {isPending ? (
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                          onClick={() => onUpdateBetStatus(bet.id, 'won')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Mark Bet as WON"
                        >
                          <Check className="w-3 h-3" />
                          Won
                        </button>
                        <button
                          onClick={() => onUpdateBetStatus(bet.id, 'lost')}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Mark Bet as LOST"
                        >
                          <X className="w-3 h-3" />
                          Lost
                        </button>
                        <button
                          onClick={() => onUpdateBetStatus(bet.id, 'push')}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                          title="Mark as Push"
                        >
                          Push
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onUpdateBetStatus(bet.id, 'pending')}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Reopen as Pending"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Reopen</span>
                      </button>
                    )}

                    <button
                      onClick={() => onEditBet(bet)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Bet"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteBet(bet.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete Bet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleExpand(bet.id)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-in fade-in duration-100">
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400 font-medium">PFF Advantage Rationale:</span>
                        <p className="text-slate-200 mt-0.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          {bet.pffAdvantageNote || 'No specific PFF advantage tag recorded.'}
                        </p>
                      </div>
                      {bet.notes && (
                        <div>
                          <span className="text-slate-400 font-medium">Bet Notes:</span>
                          <p className="text-slate-300 mt-0.5">{bet.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Closing Market Line:</span>
                        <span className="font-mono text-white font-semibold">{bet.closingLine || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">CLV Point Differential:</span>
                        <span className={`font-mono font-bold ${
                          bet.clvDifference && bet.clvDifference > 0 ? 'text-teal-400' : 'text-slate-400'
                        }`}>
                          {bet.clvDifference !== undefined ? `+${bet.clvDifference} pts gained` : 'Not recorded'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Confidence Rating:</span>
                        <span className="text-amber-300 font-bold">
                          {'★'.repeat(bet.confidenceRating || 3)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Logged At:</span>
                        <span className="text-slate-400">{new Date(bet.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
