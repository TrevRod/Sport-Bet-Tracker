import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  CheckCircle2, 
  DollarSign,
  Calculator,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { Bet, BankrollSummary } from '../types';
import { formatCurrency } from '../utils/betCalculations';

interface AnalyticsChartsProps {
  bets: Bet[];
  bankrollSummary: BankrollSummary;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  bets,
  bankrollSummary
}) => {
  // 1. Calculate Cumulative Profit Data over time (sorted by date)
  const settledBets = bets
    .filter(b => b.status === 'won' || b.status === 'lost' || b.status === 'push')
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  let runningProfit = 0;
  let runningUnits = 0;
  const cumulativeData = [
    { date: 'Start', profit: 0, units: 0, bankroll: bankrollSummary.startingBankroll }
  ];

  settledBets.forEach((b, idx) => {
    const p = b.profit || 0;
    runningProfit += p;
    runningUnits += p / bankrollSummary.unitSize;
    cumulativeData.push({
      date: `Bet ${idx + 1} (${b.date.slice(5)})`,
      profit: Math.round(runningProfit * 100) / 100,
      units: Math.round(runningUnits * 100) / 100,
      bankroll: Math.round((bankrollSummary.startingBankroll + runningProfit) * 100) / 100
    });
  });

  // 2. Breakdown by Bet Type
  const betTypes = ['spread', 'total', 'player_prop', 'moneyline'] as const;
  const typeLabels: Record<string, string> = {
    spread: 'Point Spread',
    total: 'Totals (O/U)',
    player_prop: 'Player Props',
    moneyline: 'Moneyline'
  };

  const typeData = betTypes.map(t => {
    const ofType = settledBets.filter(b => b.betType === t);
    const won = ofType.filter(b => b.status === 'won').length;
    const lost = ofType.filter(b => b.status === 'lost').length;
    const total = won + lost;
    const winRate = total > 0 ? Math.round((won / total) * 100) : 0;
    const profit = ofType.reduce((acc, b) => acc + (b.profit || 0), 0);

    return {
      type: typeLabels[t] || t,
      count: ofType.length,
      winRate,
      profit: Math.round(profit * 100) / 100,
      won,
      lost
    };
  }).filter(d => d.count > 0);

  // 3. Breakdown by Sportsbook
  const sportsbookMap: Record<string, { count: number, profit: number, won: number, total: number }> = {};
  settledBets.forEach(b => {
    if (!sportsbookMap[b.sportsbook]) {
      sportsbookMap[b.sportsbook] = { count: 0, profit: 0, won: 0, total: 0 };
    }
    sportsbookMap[b.sportsbook].count++;
    sportsbookMap[b.sportsbook].profit += b.profit || 0;
    if (b.status === 'won') sportsbookMap[b.sportsbook].won++;
    if (b.status === 'won' || b.status === 'lost') sportsbookMap[b.sportsbook].total++;
  });

  const sportsbookData = Object.keys(sportsbookMap).map(sb => ({
    sportsbook: sb,
    profit: Math.round(sportsbookMap[sb].profit * 100) / 100,
    winRate: sportsbookMap[sb].total > 0 ? Math.round((sportsbookMap[sb].won / sportsbookMap[sb].total) * 100) : 0
  }));

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Betting Performance &amp; ROI Analytics
            </h2>
            <p className="text-xs text-slate-400">
              Track your bankroll trajectory, win rates by wager category, and closing line edge generation.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Net Profit
          </span>
          <div className="text-2xl font-black text-white font-mono mt-1.5">
            {formatCurrency(bankrollSummary.netProfit)}
          </div>
          <div className="text-xs text-emerald-400 font-mono mt-1">
            {bankrollSummary.unitsNetProfit > 0 ? '+' : ''}{bankrollSummary.unitsNetProfit} Units Won
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
            Return on Investment (ROI)
          </span>
          <div className="text-2xl font-black text-teal-400 font-mono mt-1.5">
            {bankrollSummary.roiPercentage}%
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Across ${bankrollSummary.totalStaked.toFixed(0)} total volume
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
            Win Rate %
          </span>
          <div className="text-2xl font-black text-sky-400 font-mono mt-1.5">
            {bankrollSummary.winRate}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {bankrollSummary.wonBets} Wins / {bankrollSummary.lostBets} Losses
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            CLV Beat Rate
          </span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1.5">
            {bankrollSummary.clvBeatRate}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Positive closing line value generated
          </div>
        </div>
      </div>

      {/* Cumulative Profit Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Cumulative Bankroll Growth ($)
            </h3>
            <span className="text-xs text-slate-400">
              Session performance progression
            </span>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs text-slate-400 block">Current Balance</span>
            <span className="text-sm font-bold text-emerald-400">
              {formatCurrency(bankrollSummary.currentBankroll)}
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeData}>
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} tickFormatter={(v) => `$${v}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                formatter={(val: any) => [`$${val}`, 'Cumulative Profit']}
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke="#10b981" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#profitGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Win Rate by Bet Type & Sportsbook Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Breakdown by Bet Type */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800">
            Win Rate by Bet Type
          </h3>
          <div className="space-y-3">
            {typeData.map((d, i) => (
              <div key={i} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{d.type}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400">{d.won}W - {d.lost}L</span>
                    <span className="font-mono font-bold text-emerald-400">{d.winRate}%</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${d.winRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Net Profit: <strong className={d.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>${d.profit.toFixed(2)}</strong></span>
                  <span>{d.count} total bets</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown by Sportsbook */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800">
            Profit by Sportsbook ($)
          </h3>
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sportsbookData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="sportsbook" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(val: any) => [`$${val}`, 'Net Profit']}
                />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                  {sportsbookData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.profit >= 0 ? '#10b981' : '#f43f5e'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* CLV Educational & Strategy Guide Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Why Closing Line Value (CLV) Dictates Long-Term Win Rate
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          In professional sports betting, the betting market is at its most accurate right before kickoff when millions in sharp syndicate money have refined the line. 
          If you routinely place bets at lines better than the market closes at (e.g. taking Chiefs at +2.5 when it closes at +1.0), you possess a mathematically proven edge regardless of single-game bounce variance. 
          PFF unit mismatches (especially pass protection vs pass rush pressure rates) provide the earliest signals to bet before the broader market adjusts.
        </p>
      </div>

    </div>
  );
};
