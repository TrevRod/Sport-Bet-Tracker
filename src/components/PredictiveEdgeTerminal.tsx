import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Sparkles, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  PlusCircle, 
  RefreshCw, 
  Sliders, 
  Layers,
  ArrowRight,
  Flame,
  Award
} from 'lucide-react';
import { PFFTeamGrades, NFLGameMatchup, PredictiveAnalysisResult, Bet } from '../types';
import { NFL_TEAMS_PFF, SAMPLE_UPCOMING_MATCHUPS } from '../data/pffData';

interface PredictiveEdgeTerminalProps {
  onQuickLogBet: (betDraft: Partial<Bet>) => void;
  unitSize: number;
}

export const PredictiveEdgeTerminal: React.FC<PredictiveEdgeTerminalProps> = ({
  onQuickLogBet,
  unitSize
}) => {
  const [selectedMatchupId, setSelectedMatchupId] = useState<string>(SAMPLE_UPCOMING_MATCHUPS[0].id);
  const [customHomeCode, setCustomHomeCode] = useState<string>('BAL');
  const [customAwayCode, setCustomAwayCode] = useState<string>('KC');
  const [isCustomMatchup, setIsCustomMatchup] = useState<boolean>(false);
  const [customSpread, setCustomSpread] = useState<number>(-2.5);
  const [customTotal, setCustomTotal] = useState<number>(47.5);

  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<PredictiveAnalysisResult | null>(null);
  const [showTweaker, setShowTweaker] = useState<boolean>(false);

  // Editable grades state for "What If" scenarios
  const [tweakedHomeGrades, setTweakedHomeGrades] = useState<PFFTeamGrades | null>(null);
  const [tweakedAwayGrades, setTweakedAwayGrades] = useState<PFFTeamGrades | null>(null);
  const [scenarioNote, setScenarioNote] = useState<string>('');

  const currentMatchup = isCustomMatchup
    ? {
        id: `custom-${customAwayCode}-${customHomeCode}`,
        week: 1,
        gameTime: 'Custom Matchup',
        homeTeamCode: customHomeCode,
        awayTeamCode: customAwayCode,
        venue: `${NFL_TEAMS_PFF[customHomeCode]?.city || 'Home'} Stadium`,
        dome: false,
        marketSpread: customSpread,
        marketTotal: customTotal,
        marketHomeML: customSpread < 0 ? -135 : +115,
        marketAwayML: customSpread < 0 ? +115 : -135,
        publicBetPercentSpreadHome: 52,
        sharpMoneyPercentSpreadHome: 61
      }
    : SAMPLE_UPCOMING_MATCHUPS.find(m => m.id === selectedMatchupId) || SAMPLE_UPCOMING_MATCHUPS[0];

  const homeTeam = tweakedHomeGrades || NFL_TEAMS_PFF[currentMatchup.homeTeamCode] || NFL_TEAMS_PFF['BAL'];
  const awayTeam = tweakedAwayGrades || NFL_TEAMS_PFF[currentMatchup.awayTeamCode] || NFL_TEAMS_PFF['KC'];

  // Fetch prediction on matchup change
  const fetchPrediction = async (forceGemini: boolean = false) => {
    setLoadingAI(true);
    try {
      const response = await fetch('/api/predict/matchup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeamCode: homeTeam.teamCode,
          awayTeamCode: awayTeam.teamCode,
          matchupId: currentMatchup.id,
          marketSpread: currentMatchup.marketSpread,
          marketTotal: currentMatchup.marketTotal,
          marketHomeML: currentMatchup.marketHomeML,
          marketAwayML: currentMatchup.marketAwayML,
          customContext: scenarioNote || undefined,
          customHomePff: tweakedHomeGrades || undefined,
          customAwayPff: tweakedAwayGrades || undefined
        })
      });

      const data = await response.json();
      if (data.success && data.prediction) {
        setAiAnalysisResult(data.prediction);
      }
    } catch (err) {
      console.error('Failed to fetch predictive analysis:', err);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    fetchPrediction(false);
  }, [selectedMatchupId, customHomeCode, customAwayCode, isCustomMatchup]);

  const handleApplyTweaks = () => {
    fetchPrediction(true);
  };

  const handleResetTweaks = () => {
    setTweakedHomeGrades(null);
    setTweakedAwayGrades(null);
    setScenarioNote('');
    fetchPrediction(false);
  };

  // 1-Click Bet Logger helper
  const handleBetEdgeClick = (edge: PredictiveAnalysisResult['bestBetEdges'][0]) => {
    const isOver = edge.pick.toLowerCase().includes('over');
    const isUnder = edge.pick.toLowerCase().includes('under');
    let betType = edge.type;
    let marketLine = edge.marketLine;
    let teamOrSelection = edge.pick;

    onQuickLogBet({
      matchup: `${awayTeam.teamCode} @ ${homeTeam.teamCode}`,
      teamOrSelection,
      betType,
      marketLine,
      odds: -110,
      stake: edge.recommendedUnits * unitSize,
      units: edge.recommendedUnits,
      sportsbook: 'DraftKings',
      status: 'pending',
      pffAdvantageNote: edge.pffRationale,
      confidenceRating: edge.confidence === 'High' ? 5 : edge.confidence === 'Medium' ? 4 : 3,
      notes: `PFF Predictive Model identified +${edge.evPercentage}% EV edge. True line: ${edge.modelFairLine}.`
    });
  };

  const handleBetPropClick = (prop: PredictiveAnalysisResult['playerPropEdges'][0]) => {
    onQuickLogBet({
      matchup: `${awayTeam.teamCode} @ ${homeTeam.teamCode}`,
      teamOrSelection: `${prop.player} ${prop.recommendation} ${prop.line} ${prop.prop}`,
      betType: 'player_prop',
      marketLine: `${prop.recommendation === 'OVER' ? 'O' : 'U'} ${prop.line}`,
      odds: parseInt(prop.odds) || -110,
      stake: 1.0 * unitSize,
      units: 1.0,
      sportsbook: 'FanDuel',
      status: 'pending',
      pffAdvantageNote: `${prop.pffFactor} (Model projection: ${prop.modelProjection})`,
      confidenceRating: 4,
      notes: `PFF Prop Model projected +${prop.edgePercentage}% EV.`
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Matchup Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Cpu className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                PFF Predictive Analytics &amp; +EV Model
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Simulates game outcomes and extracts sharp market discrepancies using Pro Football Focus trench, coverage, and EPA metrics.
            </p>
          </div>

          {/* Matchup Mode Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustomMatchup(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isCustomMatchup 
                  ? 'bg-slate-800 text-white border border-slate-700' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Slate Matchups
            </button>
            <button
              onClick={() => setIsCustomMatchup(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isCustomMatchup 
                  ? 'bg-slate-800 text-white border border-slate-700' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Custom Matchup Builder
            </button>
            <button
              onClick={() => fetchPrediction(true)}
              disabled={loadingAI}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAI ? 'animate-spin' : ''}`} />
              <span>{loadingAI ? 'Simulating...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Matchup Picker Tabs or Custom Pickers */}
        {!isCustomMatchup ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2">
            {SAMPLE_UPCOMING_MATCHUPS.map((m) => {
              const isSelected = m.id === selectedMatchupId;
              const away = NFL_TEAMS_PFF[m.awayTeamCode];
              const home = NFL_TEAMS_PFF[m.homeTeamCode];
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatchupId(m.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/20'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Wk {m.week}</span>
                    <span>{m.gameTime}</span>
                  </div>
                  <div className="font-bold text-xs text-white flex items-center justify-between">
                    <span>{away?.teamCode} @ {home?.teamCode}</span>
                    <span className="font-mono text-emerald-400 text-[11px]">
                      {m.marketSpread > 0 ? `+${m.marketSpread}` : m.marketSpread}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>O/U {m.marketTotal}</span>
                    <span className="text-teal-400">Sharp {m.sharpMoneyPercentSpreadHome}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Away Team</label>
              <select
                value={customAwayCode}
                onChange={(e) => setCustomAwayCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold"
              >
                {Object.values(NFL_TEAMS_PFF).map((t) => (
                  <option key={t.teamCode} value={t.teamCode}>{t.city} {t.teamName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Home Team</label>
              <select
                value={customHomeCode}
                onChange={(e) => setCustomHomeCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold"
              >
                {Object.values(NFL_TEAMS_PFF).map((t) => (
                  <option key={t.teamCode} value={t.teamCode}>{t.city} {t.teamName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Market Spread (Home)</label>
              <input
                type="number"
                step="0.5"
                value={customSpread}
                onChange={(e) => setCustomSpread(parseFloat(e.target.value) || -2.5)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Market Total</label>
              <input
                type="number"
                step="0.5"
                value={customTotal}
                onChange={(e) => setCustomTotal(parseFloat(e.target.value) || 47.5)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Matchup Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Away Team Profile */}
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-md"
              style={{ backgroundColor: awayTeam.primaryColor }}
            >
              {awayTeam.logoEmoji}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AWAY</span>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {awayTeam.city} {awayTeam.teamName}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {awayTeam.record} &bull; PFF Overall: <span className="font-bold text-white">{awayTeam.overallGrade}</span>
              </p>
            </div>
          </div>

          {/* Center Market Line & Total */}
          <div className="text-center bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">
              {currentMatchup.venue} {currentMatchup.dome ? '(Indoor Dome)' : '(Outdoor)'}
            </div>
            <div className="flex items-center justify-center gap-4 my-1.5">
              <div className="font-mono">
                <span className="text-[10px] text-slate-400 block uppercase">Consensus Line</span>
                <span className="text-sm font-bold text-white">
                  {homeTeam.teamName} {currentMatchup.marketSpread > 0 ? `+${currentMatchup.marketSpread}` : currentMatchup.marketSpread}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div className="font-mono">
                <span className="text-[10px] text-slate-400 block uppercase">Game Total</span>
                <span className="text-sm font-bold text-white">
                  {currentMatchup.marketTotal}
                </span>
              </div>
            </div>
            <div className="flex justify-center items-center gap-3 text-[10px] text-slate-400">
              <span>Public: {currentMatchup.publicBetPercentSpreadHome}% {homeTeam.teamCode}</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-teal-400 font-bold">Sharps: {currentMatchup.sharpMoneyPercentSpreadHome}%</span>
            </div>
          </div>

          {/* Home Team Profile */}
          <div className="flex items-center justify-end gap-3 text-right">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HOME</span>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {homeTeam.city} {homeTeam.teamName}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {homeTeam.record} &bull; PFF Overall: <span className="font-bold text-white">{homeTeam.overallGrade}</span>
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-md"
              style={{ backgroundColor: homeTeam.primaryColor }}
            >
              {homeTeam.logoEmoji}
            </div>
          </div>

        </div>
      </div>

      {/* Model vs Market Predictive Comparison Grid */}
      {aiAnalysisResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Projected Score */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Projected Score
            </span>
            <div className="mt-2 text-xl font-black text-white font-mono flex items-center justify-between">
              <span>{awayTeam.teamCode} {aiAnalysisResult.awayScorePredicted}</span>
              <span className="text-xs text-slate-500 font-normal">vs</span>
              <span>{homeTeam.teamCode} {aiAnalysisResult.homeScorePredicted}</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Win Prob: {homeTeam.teamCode} <span className="font-bold text-emerald-400">{aiAnalysisResult.homeWinProbability}%</span> | {awayTeam.teamCode} {aiAnalysisResult.awayWinProbability}%
            </div>
          </div>

          {/* Model Spread vs Market Spread */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              Model Fair Spread
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-teal-400 font-mono">
                {homeTeam.teamName} {aiAnalysisResult.predictedSpread > 0 ? `+${aiAnalysisResult.predictedSpread}` : aiAnalysisResult.predictedSpread}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Mkt: {currentMatchup.marketSpread > 0 ? `+${currentMatchup.marketSpread}` : currentMatchup.marketSpread}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-300">
              Edge: <span className="font-bold text-teal-300 font-mono">
                {Math.abs(currentMatchup.marketSpread - aiAnalysisResult.predictedSpread).toFixed(1)} pts
              </span> on {currentMatchup.marketSpread - aiAnalysisResult.predictedSpread > 0 ? homeTeam.teamCode : awayTeam.teamCode}
            </div>
          </div>

          {/* Model Total vs Market Total */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Model Fair Total
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-purple-400 font-mono">
                {aiAnalysisResult.predictedTotal}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Mkt: {currentMatchup.marketTotal}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-300">
              Edge: <span className="font-bold text-purple-300 font-mono">
                {Math.abs(aiAnalysisResult.predictedTotal - currentMatchup.marketTotal).toFixed(1)} pts
              </span> towards {aiAnalysisResult.predictedTotal > currentMatchup.marketTotal ? 'OVER' : 'UNDER'}
            </div>
          </div>

          {/* Model Confidence */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              PFF Confidence Score
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {aiAnalysisResult.confidenceScore}/100
              </span>
              <span className="text-xs text-emerald-400 font-bold">
                HIGH CONVICTION
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 truncate">
              {aiAnalysisResult.weatherOrSituationFactor}
            </div>
          </div>

        </div>
      )}

      {/* Recommended +EV Bet Edges (Actionable Picks) */}
      {aiAnalysisResult && aiAnalysisResult.bestBetEdges.length > 0 && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                <Flame className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Recommended +EV Betting Edges
              </h3>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono font-semibold">
              Based on PFF Grade Differentials
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {aiAnalysisResult.bestBetEdges.map((edge, idx) => (
              <div 
                key={idx}
                className="bg-slate-950/80 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl p-4 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white tracking-tight">
                        {edge.pick}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 font-mono">
                        +{edge.evPercentage}% EV
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">
                      Market: <span className="text-slate-200">{edge.marketLine}</span> | Model: <span className="text-teal-300 font-bold">{edge.modelFairLine}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBetEdgeClick(edge)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Bet Edge ({edge.recommendedUnits}u)</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                  {edge.pffRationale}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Confidence: <strong className="text-amber-400">{edge.confidence}</strong></span>
                  <span>Rec Stake: <strong className="text-white">${edge.recommendedUnits * unitSize}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PFF Unit Grade Comparison: Trenches, Secondary & EPA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Head-to-Head PFF Unit Grades
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Green bar indicates decisive unit mismatch
          </span>
        </div>

        <div className="space-y-3.5 pt-1">
          
          {/* Passing vs Coverage */}
          <UnitGradeRow
            title="Passing Grade vs Secondary Coverage"
            leftLabel={`${awayTeam.teamCode} Pass: ${awayTeam.passingGrade}`}
            rightLabel={`${homeTeam.teamCode} Cov: ${homeTeam.coverageGrade}`}
            leftVal={awayTeam.passingGrade}
            rightVal={homeTeam.coverageGrade}
            subnote={`${awayTeam.city} Passing vs ${homeTeam.city} Pass Defense`}
          />

          {/* Pass Protection vs Pass Rush */}
          <UnitGradeRow
            title="Offensive Line Pass Block vs Defensive Front Pass Rush"
            leftLabel={`${awayTeam.teamCode} Pass Block: ${awayTeam.passBlockGrade}`}
            rightLabel={`${homeTeam.teamCode} Pass Rush: ${homeTeam.passRushGrade}`}
            leftVal={awayTeam.passBlockGrade}
            rightVal={homeTeam.passRushGrade}
            subnote={`Pressure Rate Differential: ${awayTeam.pressureRateAllowed}% allowed vs ${homeTeam.pressureRateGenerated}% generated`}
          />

          {/* Run Game vs Run Defense */}
          <UnitGradeRow
            title="Rushing Offense vs Run Defense Front"
            leftLabel={`${awayTeam.teamCode} Run: ${awayTeam.runGrade}`}
            rightLabel={`${homeTeam.teamCode} Run Def: ${homeTeam.runDefenseGrade}`}
            leftVal={awayTeam.runGrade}
            rightVal={homeTeam.runDefenseGrade}
            subnote={`${awayTeam.city} RB Room vs ${homeTeam.city} Front Seven`}
          />

          {/* Home Pass vs Away Cov */}
          <UnitGradeRow
            title="Home Passing Attack vs Away Secondary Coverage"
            leftLabel={`${homeTeam.teamCode} Pass: ${homeTeam.passingGrade}`}
            rightLabel={`${awayTeam.teamCode} Cov: ${awayTeam.coverageGrade}`}
            leftVal={homeTeam.passingGrade}
            rightVal={awayTeam.coverageGrade}
            subnote={`${homeTeam.city} Passing vs ${awayTeam.city} Pass Defense`}
          />

          {/* Home OL vs Away DL */}
          <UnitGradeRow
            title="Home Pass Protection vs Away Pass Rush"
            leftLabel={`${homeTeam.teamCode} Pass Block: ${homeTeam.passBlockGrade}`}
            rightLabel={`${awayTeam.teamCode} Pass Rush: ${awayTeam.passRushGrade}`}
            leftVal={homeTeam.passBlockGrade}
            rightVal={awayTeam.passRushGrade}
            subnote={`Pressure Rate Differential: ${homeTeam.pressureRateAllowed}% allowed vs ${awayTeam.pressureRateGenerated}% generated`}
          />

        </div>
      </div>

      {/* PFF Schematic Mismatches & Sharp Angles */}
      {aiAnalysisResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Critical Mismatches */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Critical PFF Mismatches
            </h3>
            <div className="space-y-3 pt-1">
              {aiAnalysisResult.pffMismatchHighlights.map((mismatch, i) => (
                <div key={i} className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{mismatch.category}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300">
                      +{mismatch.gradeDifferential} pt Advantage: {mismatch.favoredTeam}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{mismatch.description}</p>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    Betting Implication: {mismatch.bettingImplication}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sharp Angles & Props Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Sharp Angles &amp; Market Dynamics
            </h3>
            <div className="space-y-2 pt-1">
              {aiAnalysisResult.sharpAngles.map((angle, i) => (
                <div key={i} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{angle}</span>
                </div>
              ))}
            </div>

            {/* Quick Player Prop Highlight */}
            {aiAnalysisResult.playerPropEdges.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block mb-2">
                  Featured Matchup Prop
                </span>
                {aiAnalysisResult.playerPropEdges.slice(0, 1).map((prop, idx) => (
                  <div key={idx} className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white">
                        {prop.player}: {prop.recommendation} {prop.line} {prop.prop}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                        Proj: {prop.modelProjection} (+{prop.edgePercentage}% EV)
                      </div>
                    </div>
                    <button
                      onClick={() => handleBetPropClick(prop)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Bet Prop
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* "What If" Scenario & PFF Tweaker Drawer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              PFF Grade Tweaker &amp; Injury Impact Simulator
            </h3>
          </div>
          <button
            onClick={() => setShowTweaker(!showTweaker)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
          >
            {showTweaker ? 'Hide Tweaker' : 'Simulate Custom Scenario / Injuries'}
          </button>
        </div>

        {showTweaker && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-150">
            <p className="text-xs text-slate-400">
              Test how an injured left tackle, backup cornerback, or sudden weather wind affects the model spread and total:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white block">{awayTeam.city} {awayTeam.teamName} Adjustments</span>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Pass Block Grade: {tweakedAwayGrades?.passBlockGrade ?? awayTeam.passBlockGrade}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="98"
                    value={tweakedAwayGrades?.passBlockGrade ?? awayTeam.passBlockGrade}
                    onChange={(e) => setTweakedAwayGrades({
                      ...(tweakedAwayGrades || awayTeam),
                      passBlockGrade: parseInt(e.target.value)
                    })}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Coverage Grade: {tweakedAwayGrades?.coverageGrade ?? awayTeam.coverageGrade}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="98"
                    value={tweakedAwayGrades?.coverageGrade ?? awayTeam.coverageGrade}
                    onChange={(e) => setTweakedAwayGrades({
                      ...(tweakedAwayGrades || awayTeam),
                      coverageGrade: parseInt(e.target.value)
                    })}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white block">{homeTeam.city} {homeTeam.teamName} Adjustments</span>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Pass Block Grade: {tweakedHomeGrades?.passBlockGrade ?? homeTeam.passBlockGrade}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="98"
                    value={tweakedHomeGrades?.passBlockGrade ?? homeTeam.passBlockGrade}
                    onChange={(e) => setTweakedHomeGrades({
                      ...(tweakedHomeGrades || homeTeam),
                      passBlockGrade: parseInt(e.target.value)
                    })}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Coverage Grade: {tweakedHomeGrades?.coverageGrade ?? homeTeam.coverageGrade}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="98"
                    value={tweakedHomeGrades?.coverageGrade ?? homeTeam.coverageGrade}
                    onChange={(e) => setTweakedHomeGrades({
                      ...(tweakedHomeGrades || homeTeam),
                      coverageGrade: parseInt(e.target.value)
                    })}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={handleResetTweaks}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Reset Default Grades
              </button>
              <button
                onClick={handleApplyTweaks}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg cursor-pointer"
              >
                Re-simulate with Tweaks
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

interface UnitGradeRowProps {
  title: string;
  leftLabel: string;
  rightLabel: string;
  leftVal: number;
  rightVal: number;
  subnote: string;
}

const UnitGradeRow: React.FC<UnitGradeRowProps> = ({
  title,
  leftLabel,
  rightLabel,
  leftVal,
  rightVal,
  subnote
}) => {
  const diff = leftVal - rightVal;
  return (
    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300">{title}</span>
        <span className={`font-mono text-[11px] font-bold ${
          Math.abs(diff) >= 5 ? 'text-emerald-400' : 'text-slate-400'
        }`}>
          {diff > 0 ? `+${diff.toFixed(1)} Away Advantage` : `${Math.abs(diff).toFixed(1)} Home Advantage`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 items-center pt-1">
        {/* Left bar */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>{leftLabel}</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${leftVal >= rightVal ? 'bg-emerald-500' : 'bg-slate-600'}`}
              style={{ width: `${Math.min(100, Math.max(10, leftVal))}%` }}
            />
          </div>
        </div>

        {/* Right bar */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>{rightLabel}</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${rightVal >= leftVal ? 'bg-emerald-500' : 'bg-slate-600'}`}
              style={{ width: `${Math.min(100, Math.max(10, rightVal))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-500">{subnote}</div>
    </div>
  );
};
