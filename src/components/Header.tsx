import React, { useState } from 'react';
import { 
  TrendingUp, 
  Cpu, 
  Users, 
  BarChart3, 
  Shield, 
  PlusCircle, 
  Settings, 
  DollarSign,
  Percent,
  CheckCircle2,
  Clock,
  CalendarDays
} from 'lucide-react';
import { BankrollSummary } from '../types';
import { formatCurrency } from '../utils/betCalculations';

interface HeaderProps {
  currentTab: 'weekly' | 'tracker' | 'predict' | 'props' | 'analytics' | 'teams';
  onSelectTab: (tab: 'weekly' | 'tracker' | 'predict' | 'props' | 'analytics' | 'teams') => void;
  bankrollSummary: BankrollSummary;
  onOpenAddBet: () => void;
  onUpdateBankrollSettings: (bankroll: number, unitSize: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  bankrollSummary,
  onOpenAddBet,
  onUpdateBankrollSettings
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempBankroll, setTempBankroll] = useState(bankrollSummary.startingBankroll.toString());
  const [tempUnitSize, setTempUnitSize] = useState(bankrollSummary.unitSize.toString());

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const bankrollNum = parseFloat(tempBankroll) || 5000;
    const unitSizeNum = parseFloat(tempUnitSize) || 100;
    onUpdateBankrollSettings(bankrollNum, unitSizeNum);
    setShowSettingsModal(false);
  };

  const isProfitPositive = bankrollSummary.netProfit >= 0;

  return (
    <header className="bg-slate-900 border-b border-slate-850 text-slate-100 sticky top-0 z-30 shadow-md">
      {/* Top Banner: Brand, Main Nav, and Quick CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-950/30">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  PFF <span className="text-emerald-400">SharpTrack</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Predictive Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Sports Betting Tracker &amp; PFF Predictive Edge Model
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              id="nav-tab-weekly"
              onClick={() => onSelectTab('weekly')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'weekly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-emerald-300" />
              Weekly Insights
            </button>

            <button
              id="nav-tab-tracker"
              onClick={() => onSelectTab('tracker')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'tracker'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Bet Tracker
              {bankrollSummary.pendingBets > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-900/80 text-emerald-300 font-bold">
                  {bankrollSummary.pendingBets}
                </span>
              )}
            </button>

            <button
              id="nav-tab-predict"
              onClick={() => onSelectTab('predict')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'predict'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-300" />
              PFF Edge Terminal
            </button>

            <button
              id="nav-tab-props"
              onClick={() => onSelectTab('props')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'props'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Prop Value Finder
            </button>

            <button
              id="nav-tab-analytics"
              onClick={() => onSelectTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'analytics'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics &amp; ROI
            </button>

            <button
              id="nav-tab-teams"
              onClick={() => onSelectTab('teams')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'teams'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              PFF Grades Matrix
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              id="btn-open-settings"
              onClick={() => setShowSettingsModal(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Bankroll & Unit Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              id="btn-header-add-bet"
              onClick={onOpenAddBet}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Log Bet</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Row */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800 scrollbar-none">
          <button
            onClick={() => onSelectTab('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              currentTab === 'weekly' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            Weekly Insights
          </button>
          <button
            onClick={() => onSelectTab('tracker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              currentTab === 'tracker' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            Bet Tracker
          </button>
          <button
            onClick={() => onSelectTab('predict')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              currentTab === 'predict' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            PFF Terminal
          </button>
          <button
            onClick={() => onSelectTab('props')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              currentTab === 'props' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            Prop Finder
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              currentTab === 'analytics' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            Analytics &amp; ROI
          </button>
          <button
            onClick={() => onSelectTab('teams')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              currentTab === 'teams' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            PFF Matrix
          </button>
        </div>
      </div>

      {/* Live Bankroll Ticker Strip */}
      <div className="bg-slate-950/80 border-t border-slate-800/80 py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-6 text-xs scrollbar-none">
          
          {/* Current Bankroll */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              Bankroll:
            </span>
            <span className="font-bold text-white tracking-wide">
              {formatCurrency(bankrollSummary.currentBankroll)}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              (1u = ${bankrollSummary.unitSize})
            </span>
          </div>

          {/* Net Profit & Units */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-400 font-medium">Net Profit:</span>
            <span className={`font-bold font-mono ${isProfitPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfitPositive ? '+' : ''}{formatCurrency(bankrollSummary.netProfit)}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              isProfitPositive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
            }`}>
              {bankrollSummary.unitsNetProfit > 0 ? '+' : ''}{bankrollSummary.unitsNetProfit}u
            </span>
          </div>

          {/* ROI % */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Percent className="w-3.5 h-3.5 text-slate-400" />
              ROI:
            </span>
            <span className={`font-bold font-mono ${bankrollSummary.roiPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {bankrollSummary.roiPercentage > 0 ? '+' : ''}{bankrollSummary.roiPercentage}%
            </span>
          </div>

          {/* Win Rate */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              Win Rate:
            </span>
            <span className="font-bold text-white font-mono">
              {bankrollSummary.winRate}%
            </span>
            <span className="text-[11px] text-slate-400">
              ({bankrollSummary.wonBets}W - {bankrollSummary.lostBets}L{bankrollSummary.pushedBets > 0 ? ` - ${bankrollSummary.pushedBets}P` : ''})
            </span>
          </div>

          {/* CLV Beat Rate */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-400 font-medium">CLV Beat %:</span>
            <span className="font-bold text-teal-300 font-mono">
              {bankrollSummary.clvBeatRate}%
            </span>
            <span className="text-[10px] text-slate-400 hidden lg:inline">
              (Beating market close)
            </span>
          </div>

          {/* Open Bets In Play */}
          <div className="flex items-center gap-1.5 shrink-0 text-amber-300 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{bankrollSummary.pendingBets} Open Bet{bankrollSummary.pendingBets === 1 ? '' : 's'}</span>
          </div>

        </div>
      </div>

      {/* Bankroll Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                Bankroll &amp; Unit Configuration
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Starting Bankroll ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={tempBankroll}
                    onChange={(e) => setTempBankroll(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Your base sports betting bankroll allocation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Standard Unit Size ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={tempUnitSize}
                    onChange={(e) => setTempUnitSize(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Standard 1.0 Unit (usually 1% to 2% of your overall bankroll).
                </p>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Unit Equivalent:</span>
                  <span className="font-bold text-white font-mono">
                    {((parseFloat(tempUnitSize) || 100) / (parseFloat(tempBankroll) || 5000) * 100).toFixed(1)}% of bankroll
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
