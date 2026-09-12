import React, { useState, useMemo, useEffect } from 'react';
import { 
  CalendarDays, 
  Play, 
  FastForward, 
  RotateCcw, 
  TrendingUp, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  BarChart2, 
  Info,
  Flame,
  ArrowRight,
  Filter,
  Zap,
  Target
} from 'lucide-react';
import { 
  NFLWeeklyGame, 
  PFFTeamGrades, 
  TeamCumulativeStats, 
  GameBettingInsight, 
  Bet 
} from '../types';
import { ALL_NFL_TEAMS_PFF } from '../data/weeklyScheduleData';
import { 
  computeTeamCumulativeStats, 
  generateGameBettingInsight, 
  simulateGameResult 
} from '../utils/statisticalEngine';

interface WeeklyGameInsightsProps {
  games: NFLWeeklyGame[];
  onUpdateGame: (updatedGame: NFLWeeklyGame) => void;
  onUpdateAllGames: (updatedGames: NFLWeeklyGame[]) => void;
  onResetGames: () => void;
  onQuickLogBet: (betDraft: Partial<Bet>) => void;
  unitSize: number;
}

export const WeeklyGameInsights: React.FC<WeeklyGameInsightsProps> = ({
  games,
  onUpdateGame,
  onUpdateAllGames,
  onResetGames,
  onQuickLogBet,
  unitSize
}) => {
  // Selected Week
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'final' | 'edges'>('all');
  const [expandedStatsGameId, setExpandedStatsGameId] = useState<string | null>(null);
  
  // Modal for editing manual scores
  const [editingGame, setEditingGame] = useState<NFLWeeklyGame | null>(null);
  const [editHomeScore, setEditHomeScore] = useState<number>(24);
  const [editAwayScore, setEditAwayScore] = useState<number>(21);

  // Live Auto-simulation ticker
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [autoSimNotification, setAutoSimNotification] = useState<string | null>(null);

  // Team detail inspector modal
  const [inspectedTeamCode, setInspectedTeamCode] = useState<string | null>(null);

  // Available weeks
  const availableWeeks = useMemo(() => {
    const weekSet = new Set<number>();
    games.forEach(g => weekSet.add(g.week));
    return Array.from(weekSet).sort((a, b) => a - b);
  }, [games]);

  // 1. Automatically calculate cumulative team stats from ALL completed games
  const teamStats = useMemo(() => {
    return computeTeamCumulativeStats(games, ALL_NFL_TEAMS_PFF);
  }, [games]);

  // 2. Games for the selected week
  const weekGames = useMemo(() => {
    return games.filter(g => g.week === selectedWeek);
  }, [games, selectedWeek]);

  // Counts
  const completedCount = games.filter(g => g.status === 'final').length;
  const weekScheduledCount = weekGames.filter(g => g.status === 'scheduled').length;
  const weekFinalCount = weekGames.filter(g => g.status === 'final').length;

  // Compute insights for every game in current week
  const gameInsightsMap = useMemo(() => {
    const map: Record<string, GameBettingInsight> = {};
    weekGames.forEach(game => {
      const homeStats = teamStats[game.homeTeamCode];
      const awayStats = teamStats[game.awayTeamCode];
      const homePff = ALL_NFL_TEAMS_PFF[game.homeTeamCode] || ALL_NFL_TEAMS_PFF['KC'];
      const awayPff = ALL_NFL_TEAMS_PFF[game.awayTeamCode] || ALL_NFL_TEAMS_PFF['BAL'];

      if (homeStats && awayStats) {
        map[game.id] = generateGameBettingInsight(game, homeStats, awayStats, homePff, awayPff);
      }
    });
    return map;
  }, [weekGames, teamStats]);

  // Filtered games
  const displayedGames = useMemo(() => {
    return weekGames.filter(game => {
      if (filterStatus === 'scheduled') return game.status === 'scheduled';
      if (filterStatus === 'final') return game.status === 'final';
      if (filterStatus === 'edges') {
        const insight = gameInsightsMap[game.id];
        if (!insight) return true;
        return (
          insight.recommendedLine.confidenceStars >= 4 ||
          insight.recommendedPoints.confidenceStars >= 4
        );
      }
      return true;
    });
  }, [weekGames, filterStatus, gameInsightsMap]);

  // Simulate single game
  const handleSimulateSingleGame = (gameId: string) => {
    const targetGame = games.find(g => g.id === gameId);
    if (!targetGame) return;

    const homePff = ALL_NFL_TEAMS_PFF[targetGame.homeTeamCode];
    const awayPff = ALL_NFL_TEAMS_PFF[targetGame.awayTeamCode];
    const homeStats = teamStats[targetGame.homeTeamCode];
    const awayStats = teamStats[targetGame.awayTeamCode];

    const simulated = simulateGameResult(targetGame, homePff, awayPff, homeStats, awayStats);
    onUpdateGame(simulated);

    setAutoSimNotification(
      `Game simulated! ${simulated.awayTeamCode} ${simulated.awayScore} @ ${simulated.homeTeamCode} ${simulated.homeScore}. Team statistics and upcoming lines updated!`
    );
    setTimeout(() => setAutoSimNotification(null), 5000);
  };

  // Simulate next scheduled game in this week or season
  const handleSimulateNextScheduled = () => {
    const nextGame = weekGames.find(g => g.status === 'scheduled') || games.find(g => g.status === 'scheduled');
    if (!nextGame) {
      setAutoSimNotification('All scheduled games are already completed!');
      setTimeout(() => setAutoSimNotification(null), 4000);
      return;
    }
    handleSimulateSingleGame(nextGame.id);
  };

  // Simulate all scheduled games in current week
  const handleSimulateEntireWeek = () => {
    let currentStats = { ...teamStats };
    const updatedGames = games.map(g => {
      if (g.week === selectedWeek && g.status === 'scheduled') {
        const homePff = ALL_NFL_TEAMS_PFF[g.homeTeamCode];
        const awayPff = ALL_NFL_TEAMS_PFF[g.awayTeamCode];
        const homeStats = currentStats[g.homeTeamCode];
        const awayStats = currentStats[g.awayTeamCode];
        return simulateGameResult(g, homePff, awayPff, homeStats, awayStats);
      }
      return g;
    });

    onUpdateAllGames(updatedGames);
    setAutoSimNotification(`Week ${selectedWeek} fully simulated! All team stats & subsequent weeks recalculated.`);
    setTimeout(() => setAutoSimNotification(null), 5000);
  };

  // Live auto-ticker simulation effect
  useEffect(() => {
    let timer: any;
    if (isAutoSimulating) {
      timer = setInterval(() => {
        const nextScheduled = games.find(g => g.status === 'scheduled');
        if (nextScheduled) {
          handleSimulateSingleGame(nextScheduled.id);
        } else {
          setIsAutoSimulating(false);
          setAutoSimNotification('Season completed! All games simulated.');
        }
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isAutoSimulating, games, teamStats]);

  // Open Edit score modal
  const handleOpenEditScore = (game: NFLWeeklyGame) => {
    setEditingGame(game);
    setEditHomeScore(game.homeScore ?? 24);
    setEditAwayScore(game.awayScore ?? 21);
  };

  // Save manual score
  const handleSaveManualScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;

    const homePts = editHomeScore;
    const awayPts = editAwayScore;

    const updated: NFLWeeklyGame = {
      ...editingGame,
      status: 'final',
      currentQuarter: 'Final',
      homeScore: homePts,
      awayScore: awayPts,
      homeStats: {
        points: homePts,
        passingYards: Math.round(210 + (homePts - 20) * 7),
        rushingYards: Math.round(110 + (homePts - 20) * 3),
        totalYards: Math.round(320 + (homePts - 20) * 10),
        offensiveEPA: Math.round(((homePts - 21) * 0.02) * 100) / 100,
        turnovers: homePts < awayPts ? 2 : 1,
        sacksAllowed: 2,
        passCompletionRate: 67.0
      },
      awayStats: {
        points: awayPts,
        passingYards: Math.round(210 + (awayPts - 20) * 7),
        rushingYards: Math.round(110 + (awayPts - 20) * 3),
        totalYards: Math.round(320 + (awayPts - 20) * 10),
        offensiveEPA: Math.round(((awayPts - 21) * 0.02) * 100) / 100,
        turnovers: awayPts < homePts ? 2 : 1,
        sacksAllowed: 2,
        passCompletionRate: 64.0
      }
    };

    onUpdateGame(updated);
    setEditingGame(null);
    setAutoSimNotification(`Saved score: ${updated.awayTeamCode} ${awayPts} @ ${updated.homeTeamCode} ${homePts}. Stats re-aggregated!`);
    setTimeout(() => setAutoSimNotification(null), 4000);
  };

  // Reset a final game back to scheduled
  const handleResetGameToScheduled = (gameId: string) => {
    const targetGame = games.find(g => g.id === gameId);
    if (!targetGame) return;

    const reverted: NFLWeeklyGame = {
      ...targetGame,
      status: 'scheduled',
      currentQuarter: undefined,
      homeScore: undefined,
      awayScore: undefined,
      homeStats: undefined,
      awayStats: undefined
    };

    onUpdateGame(reverted);
    setAutoSimNotification(`Game reset to scheduled. Team stats adjusted.`);
    setTimeout(() => setAutoSimNotification(null), 4000);
  };

  // Quick log helper for Spread / Line
  const handleLogLinePick = (game: NFLWeeklyGame, insight: GameBettingInsight) => {
    const isHome = insight.recommendedLine.teamCode === game.homeTeamCode;
    const team = isHome ? ALL_NFL_TEAMS_PFF[game.homeTeamCode] : ALL_NFL_TEAMS_PFF[game.awayTeamCode];
    const opponent = isHome ? ALL_NFL_TEAMS_PFF[game.awayTeamCode] : ALL_NFL_TEAMS_PFF[game.homeTeamCode];

    onQuickLogBet({
      matchup: `${game.awayTeamCode} @ ${game.homeTeamCode}`,
      teamOrSelection: insight.recommendedLine.selection,
      league: 'NFL',
      betType: 'spread',
      marketLine: insight.recommendedLine.line,
      odds: insight.recommendedLine.odds,
      stake: unitSize * 1.1,
      units: 1.1,
      sportsbook: 'DraftKings',
      status: 'pending',
      confidenceRating: Math.min(5, Math.max(1, insight.recommendedLine.confidenceStars)) as any,
      pffAdvantageNote: insight.recommendedLine.rationale,
      notes: `Week ${game.week} line insight with +${insight.recommendedLine.edgePoints} pts edge vs model fair line (${insight.predictedSpread > 0 ? `+${insight.predictedSpread}` : insight.predictedSpread}).`
    });
  };

  // Quick log helper for Total / Points
  const handleLogPointsPick = (game: NFLWeeklyGame, insight: GameBettingInsight) => {
    onQuickLogBet({
      matchup: `${game.awayTeamCode} @ ${game.homeTeamCode}`,
      teamOrSelection: `${insight.recommendedPoints.pick === 'OVER' ? 'Over' : 'Under'} ${insight.recommendedPoints.line} Total Points`,
      league: 'NFL',
      betType: 'total',
      marketLine: `${insight.recommendedPoints.pick === 'OVER' ? 'O' : 'U'} ${insight.recommendedPoints.line}`,
      odds: insight.recommendedPoints.odds,
      stake: unitSize * 1.0,
      units: 1.0,
      sportsbook: 'FanDuel',
      status: 'pending',
      confidenceRating: Math.min(5, Math.max(1, insight.recommendedPoints.confidenceStars)) as any,
      pffAdvantageNote: insight.recommendedPoints.rationale,
      notes: `Week ${game.week} total points insight: model projects ${insight.predictedTotal} total points (+${insight.recommendedPoints.edgePoints} pts edge).`
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Controls, Week Navigation, and Auto-Simulation Ticker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Week Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                Weekly Game Insights &amp; Adaptive Line Engine
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Select any week to review upcoming games, point spreads, and total over/unders. Team statistics recalculate automatically after every completed game!
            </p>

            {/* Week Pills */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {availableWeeks.map(wk => {
                const wkTotal = games.filter(g => g.week === wk).length;
                const wkFinal = games.filter(g => g.week === wk && g.status === 'final').length;
                const isCurrent = selectedWeek === wk;

                return (
                  <button
                    key={wk}
                    id={`btn-select-week-${wk}`}
                    onClick={() => setSelectedWeek(wk)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span>Week {wk}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      isCurrent ? 'bg-emerald-950/40 text-slate-950' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {wkFinal}/{wkTotal}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Simulation Controls */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            
            {/* Live Auto Simulator Switch */}
            <button
              id="btn-toggle-auto-sim"
              onClick={() => setIsAutoSimulating(!isAutoSimulating)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isAutoSimulating
                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Automatically simulate games every 3.5 seconds and watch stats update live"
            >
              <Zap className={`w-3.5 h-3.5 ${isAutoSimulating ? 'text-slate-950' : 'text-amber-400'}`} />
              {isAutoSimulating ? 'Pause Live Sim' : 'Live Auto-Sim'}
            </button>

            {/* Simulate Next Game */}
            <button
              id="btn-simulate-next"
              onClick={handleSimulateNextScheduled}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Simulate Next Game
            </button>

            {/* Simulate All Week */}
            <button
              id="btn-simulate-week"
              onClick={handleSimulateEntireWeek}
              disabled={weekScheduledCount === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                weekScheduledCount > 0
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-800'
              }`}
            >
              <FastForward className="w-3.5 h-3.5 text-cyan-400" />
              Simulate Week {selectedWeek} ({weekScheduledCount})
            </button>

            {/* Reset */}
            <button
              id="btn-reset-season"
              onClick={onResetGames}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Reset season back to initial schedule"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Live Notification Bar if auto-updated */}
        {autoSimNotification && (
          <div className="mt-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{autoSimNotification}</span>
          </div>
        )}

        {/* Dynamic Cumulative Team Stats Ribbon */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-slate-300 font-semibold">{completedCount} Games Completed</span>
              <span className="text-slate-500">({games.length - completedCount} Scheduled)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Week {selectedWeek}:</span>
              <span className="text-emerald-400 font-bold">{weekFinalCount} Final</span>
              <span className="text-slate-500">/ {weekScheduledCount} Upcoming</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-400 mr-1">Filter:</span>
            {(['all', 'edges', 'scheduled', 'final'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setFilterStatus(mode)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  filterStatus === mode
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'all' && 'All Games'}
                {mode === 'edges' && 'Top Edges (4★+)'}
                {mode === 'scheduled' && 'Scheduled'}
                {mode === 'final' && 'Final'}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Matchups Grid */}
      <div className="space-y-5">
        {displayedGames.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <Info className="w-8 h-8 mx-auto text-slate-500" />
            <p className="font-semibold text-slate-300">No games found matching filter.</p>
            <p className="text-xs">Try switching filters or selecting a different week.</p>
          </div>
        ) : (
          displayedGames.map((game) => {
            const homePff = ALL_NFL_TEAMS_PFF[game.homeTeamCode] || ALL_NFL_TEAMS_PFF['KC'];
            const awayPff = ALL_NFL_TEAMS_PFF[game.awayTeamCode] || ALL_NFL_TEAMS_PFF['BAL'];
            const homeStats = teamStats[game.homeTeamCode];
            const awayStats = teamStats[game.awayTeamCode];
            const insight = gameInsightsMap[game.id];
            const isExpanded = expandedStatsGameId === game.id;
            const isFinal = game.status === 'final';

            if (!insight || !homeStats || !awayStats) return null;

            return (
              <div 
                key={game.id}
                id={`game-card-${game.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl shadow-lg transition-all overflow-hidden"
              >
                {/* Game Card Header */}
                <div className="bg-slate-950/80 px-4 sm:px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Week {game.week} &bull; {game.gameTime}
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      {game.venue} {game.dome && '(Dome)'}
                    </span>
                  </div>

                  {/* Status & Simulation Control */}
                  <div className="flex items-center gap-2">
                    {isFinal ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        FINAL: {game.awayTeamCode} {game.awayScore} - {game.homeTeamCode} {game.homeScore}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Upcoming &bull; Lines Open
                      </span>
                    )}

                    {/* Quick Simulation / Score Editor */}
                    {!isFinal ? (
                      <button
                        id={`btn-sim-game-${game.id}`}
                        onClick={() => handleSimulateSingleGame(game.id)}
                        className="text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                        title="Simulate game outcome & update team stats immediately"
                      >
                        <Play className="w-3 h-3 fill-slate-950" />
                        Simulate
                      </button>
                    ) : (
                      <button
                        id={`btn-reset-game-${game.id}`}
                        onClick={() => handleResetGameToScheduled(game.id)}
                        className="text-[11px] font-medium text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                        title="Revert game back to scheduled"
                      >
                        Reset
                      </button>
                    )}

                    <button
                      id={`btn-edit-score-${game.id}`}
                      onClick={() => handleOpenEditScore(game)}
                      className="text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                      title="Manually enter or edit actual final score"
                    >
                      <Edit3 className="w-3 h-3 text-cyan-400" />
                      {isFinal ? 'Edit Score' : 'Enter Score'}
                    </button>
                  </div>
                </div>

                {/* Scoreboard Banner: Away vs Home */}
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* Teams Column */}
                  <div className="md:col-span-4 space-y-3">
                    
                    {/* Away Team */}
                    <div 
                      onClick={() => setInspectedTeamCode(game.awayTeamCode)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all"
                      title="Click to view full team stats & evolution"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{awayPff.logoEmoji}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm sm:text-base">
                              {awayPff.city} {awayPff.teamName}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              ({awayStats.wins}-{awayStats.losses}{awayStats.ties > 0 ? `-${awayStats.ties}` : ''})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>PPG: <strong className="text-emerald-400 font-mono">{awayStats.pointsPerGame.toFixed(1)}</strong></span>
                            <span>&bull;</span>
                            <span>PAPG: <strong className="text-rose-400 font-mono">{awayStats.pointsAllowedPerGame.toFixed(1)}</strong></span>
                            <span>&bull;</span>
                            <span>PFF: <strong className="text-cyan-400 font-mono">{awayStats.adjustedPFFGrade.toFixed(1)}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Score if final */}
                      {isFinal && (
                        <span className={`text-xl font-black font-mono px-2.5 py-0.5 rounded ${
                          (game.awayScore ?? 0) > (game.homeScore ?? 0) ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-400'
                        }`}>
                          {game.awayScore}
                        </span>
                      )}
                    </div>

                    {/* Home Team */}
                    <div 
                      onClick={() => setInspectedTeamCode(game.homeTeamCode)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all"
                      title="Click to view full team stats & evolution"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{homePff.logoEmoji}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm sm:text-base">
                              {homePff.city} {homePff.teamName}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              ({homeStats.wins}-{homeStats.losses}{homeStats.ties > 0 ? `-${homeStats.ties}` : ''})
                            </span>
                            <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">HOME</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>PPG: <strong className="text-emerald-400 font-mono">{homeStats.pointsPerGame.toFixed(1)}</strong></span>
                            <span>&bull;</span>
                            <span>PAPG: <strong className="text-rose-400 font-mono">{homeStats.pointsAllowedPerGame.toFixed(1)}</strong></span>
                            <span>&bull;</span>
                            <span>PFF: <strong className="text-cyan-400 font-mono">{homeStats.adjustedPFFGrade.toFixed(1)}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Score if final */}
                      {isFinal && (
                        <span className={`text-xl font-black font-mono px-2.5 py-0.5 rounded ${
                          (game.homeScore ?? 0) > (game.awayScore ?? 0) ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-400'
                        }`}>
                          {game.homeScore}
                        </span>
                      )}
                    </div>

                    {/* Consensus Market Lines Box */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px] grid grid-cols-3 text-center divide-x divide-slate-800">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Spread Line</span>
                        <span className="font-mono font-bold text-slate-200">
                          {game.homeTeamCode} {game.marketSpread > 0 ? `+${game.marketSpread}` : game.marketSpread}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Points</span>
                        <span className="font-mono font-bold text-slate-200">
                          O/U {game.marketTotal}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Home ML</span>
                        <span className="font-mono font-bold text-slate-200">
                          {game.marketHomeML > 0 ? `+${game.marketHomeML}` : game.marketHomeML}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* PREDICTIVE INSIGHT 1: WHAT YOU SHOULD TAKE FOR THE SPREAD / LINE */}
                  {/* ------------------------------------------------------------- */}
                  <div className="md:col-span-4 bg-gradient-to-b from-slate-950/90 to-slate-950/50 p-4 rounded-xl border border-emerald-500/30 flex flex-col justify-between h-full relative">
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Recommended Line Pick
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          insight.recommendedLine.confidenceStars >= 4
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {'★'.repeat(insight.recommendedLine.confidenceStars)} {insight.recommendedLine.confidenceLabel}
                        </span>
                      </div>

                      {/* Main Pick Callout */}
                      <div className="mb-2">
                        <div className="text-xs text-slate-400">Model Directive:</div>
                        <div className="text-base font-extrabold text-emerald-300 tracking-tight flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-emerald-400 shrink-0" />
                          {insight.recommendedLine.selection}
                        </div>
                      </div>

                      {/* Comparative Stats & Edge */}
                      <div className="bg-slate-900/90 p-2 rounded-lg text-[11px] text-slate-300 mb-2 space-y-1 font-mono border border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Model Fair Line:</span>
                          <span className="text-emerald-400 font-bold">
                            {game.homeTeamCode} {insight.predictedSpread > 0 ? `+${insight.predictedSpread}` : insight.predictedSpread}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Spread Edge Value:</span>
                          <span className="text-cyan-400 font-bold">
                            +{insight.recommendedLine.edgePoints} pts ({insight.recommendedLine.evPercentage}% +EV)
                          </span>
                        </div>
                      </div>

                      {/* Rationale */}
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {insight.recommendedLine.rationale}
                      </p>
                    </div>

                    {/* CTA Button to Log Line Bet */}
                    <button
                      id={`btn-log-line-${game.id}`}
                      onClick={() => handleLogLinePick(game, insight)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-98 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Take This Line ({insight.recommendedLine.line})
                    </button>

                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* PREDICTIVE INSIGHT 2: WHAT YOU SHOULD TAKE FOR THE POINTS / TOTAL */}
                  {/* ------------------------------------------------------------- */}
                  <div className="md:col-span-4 bg-gradient-to-b from-slate-950/90 to-slate-950/50 p-4 rounded-xl border border-cyan-500/30 flex flex-col justify-between h-full relative">
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-cyan-400 flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          Recommended Points Pick
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          insight.recommendedPoints.confidenceStars >= 4
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {'★'.repeat(insight.recommendedPoints.confidenceStars)} {insight.recommendedPoints.confidenceLabel}
                        </span>
                      </div>

                      {/* Main Pick Callout */}
                      <div className="mb-2">
                        <div className="text-xs text-slate-400">Model Directive:</div>
                        <div className="text-base font-extrabold text-cyan-300 tracking-tight flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-cyan-400 shrink-0" />
                          {insight.recommendedPoints.selection}
                        </div>
                      </div>

                      {/* Comparative Stats & Edge */}
                      <div className="bg-slate-900/90 p-2 rounded-lg text-[11px] text-slate-300 mb-2 space-y-1 font-mono border border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Projected Total:</span>
                          <span className="text-cyan-400 font-bold">
                            {insight.predictedTotal} pts ({game.homeTeamCode} {insight.predictedHomeScore}, {game.awayTeamCode} {insight.predictedAwayScore})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Points Differential:</span>
                          <span className="text-emerald-400 font-bold">
                            +{insight.recommendedPoints.edgePoints} pts edge vs {game.marketTotal}
                          </span>
                        </div>
                      </div>

                      {/* Rationale */}
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {insight.recommendedPoints.rationale}
                      </p>
                    </div>

                    {/* CTA Button to Log Points Bet */}
                    <button
                      id={`btn-log-points-${game.id}`}
                      onClick={() => handleLogPointsPick(game, insight)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all shadow-md shadow-cyan-600/20 active:scale-98 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Take Points ({insight.recommendedPoints.pick} {game.marketTotal})
                    </button>

                  </div>

                </div>

                {/* Toggle Drawer for Detailed Metrics Differential */}
                <div className="bg-slate-950/40 px-4 sm:px-6 py-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Model Win Prob: {game.awayTeamCode} {insight.awayWinProb}% vs {game.homeTeamCode} {insight.homeWinProb}%
                    </span>
                  </div>

                  <button
                    onClick={() => setExpandedStatsGameId(isExpanded ? null : game.id)}
                    className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold py-1"
                  >
                    <span>{isExpanded ? 'Hide Stat Matchups' : 'Compare Team Stats & PFF Gradients'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded Detailed Comparison Table */}
                {isExpanded && (
                  <div className="bg-slate-950/90 border-t border-slate-800 p-4 sm:p-6 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-emerald-400" />
                        Statistical Matchup Grid (Updated Live with Completed Games)
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Higher values indicate statistical edge
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-[11px] text-slate-400 uppercase font-semibold">
                          <tr>
                            <th className="p-2.5 rounded-l-lg">Metric</th>
                            <th className="p-2.5 text-center font-bold text-white">{game.awayTeamCode} (Away)</th>
                            <th className="p-2.5 text-center font-bold text-white">{game.homeTeamCode} (Home)</th>
                            <th className="p-2.5 text-center">Stat Advantage</th>
                            <th className="p-2.5 rounded-r-lg">Betting Factor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 font-mono">
                          {insight.keyMetrics.map((km, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/50">
                              <td className="p-2.5 font-sans font-medium text-slate-200">{km.metric}</td>
                              <td className={`p-2.5 text-center ${km.edgeTeam === 'away' ? 'text-emerald-400 font-bold bg-emerald-950/20' : 'text-slate-400'}`}>
                                {km.awayValue}
                              </td>
                              <td className={`p-2.5 text-center ${km.edgeTeam === 'home' ? 'text-emerald-400 font-bold bg-emerald-950/20' : 'text-slate-400'}`}>
                                {km.homeValue}
                              </td>
                              <td className="p-2.5 text-center font-sans">
                                {km.edgeTeam === 'even' ? (
                                  <span className="text-slate-500 text-[11px]">Even</span>
                                ) : (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                    {km.edgeTeam === 'home' ? game.homeTeamCode : game.awayTeamCode} Edge
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 font-sans text-slate-400 text-[11px]">{km.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Box Score breakdown if game is final */}
                    {isFinal && game.homeStats && game.awayStats && (
                      <div className="pt-3 border-t border-slate-800 text-xs">
                        <div className="font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Final Box Score Output:
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-slate-500 block">Total Yards:</span>
                            <span className="font-mono text-slate-200 font-bold">
                              {game.awayTeamCode}: {game.awayStats.totalYards} yds | {game.homeTeamCode}: {game.homeStats.totalYards} yds
                            </span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-slate-500 block">Passing / Rushing:</span>
                            <span className="font-mono text-slate-200 font-bold">
                              {game.awayTeamCode}: {game.awayStats.passingYards}p/{game.awayStats.rushingYards}r
                            </span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-slate-500 block">EPA Generated:</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              +{game.homeStats.offensiveEPA} / +{game.awayStats.offensiveEPA}
                            </span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-slate-500 block">Turnovers / Sacks:</span>
                            <span className="font-mono text-slate-200 font-bold">
                              {game.homeStats.turnovers} TOs | {game.awayStats.turnovers} TOs
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Manual Score Input Modal */}
      {editingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                Enter Final Score: {editingGame.awayTeamCode} @ {editingGame.homeTeamCode}
              </h3>
              <button
                onClick={() => setEditingGame(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Input actual game scores or custom outcomes. Once saved, all season statistics for both teams and future weeks&apos; line projections will automatically recalculate!
            </p>

            <form onSubmit={handleSaveManualScore} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Away Score */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    {editingGame.awayTeamCode} Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={editAwayScore}
                    onChange={(e) => setEditAwayScore(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-center text-lg focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Home Score */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    {editingGame.homeTeamCode} Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={editHomeScore}
                    onChange={(e) => setEditHomeScore(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-center text-lg focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGame(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md cursor-pointer transition-all"
                >
                  Save Score &amp; Update Stats
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Team Inspector Modal (shows live updated stats and game log) */}
      {inspectedTeamCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 animate-scaleUp">
            
            {(() => {
              const team = ALL_NFL_TEAMS_PFF[inspectedTeamCode];
              const stats = teamStats[inspectedTeamCode];
              const teamGames = games.filter(
                g => (g.homeTeamCode === inspectedTeamCode || g.awayTeamCode === inspectedTeamCode) && g.status === 'final'
              );

              if (!team || !stats) return null;

              return (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{team.logoEmoji}</span>
                      <div>
                        <h3 className="text-lg font-black text-white">
                          {team.city} {team.teamName} &bull; Live Dynamic Stats Profile
                        </h3>
                        <p className="text-xs text-slate-400">
                          Record: <strong className="text-emerald-400">{stats.wins}-{stats.losses}{stats.ties > 0 ? `-${stats.ties}` : ''}</strong> &bull; Point Differential: <strong className={stats.pointDifferential >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{stats.pointDifferential > 0 ? `+${stats.pointDifferential}` : stats.pointDifferential}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setInspectedTeamCode(null)}
                      className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Cumulative Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block">Scoring PPG</span>
                      <span className="text-lg font-bold font-mono text-emerald-400">{stats.pointsPerGame.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-500 block">Rank #{stats.offensivePowerRank || '-'}</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block">Defense PAPG</span>
                      <span className="text-lg font-bold font-mono text-rose-400">{stats.pointsAllowedPerGame.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-500 block">Rank #{stats.defensivePowerRank || '-'}</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block">Adjusted PFF Grade</span>
                      <span className="text-lg font-bold font-mono text-cyan-400">{stats.adjustedPFFGrade.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-500 block">Base: {team.overallGrade}</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block">Turnover Diff</span>
                      <span className="text-lg font-bold font-mono text-slate-200">{stats.turnoverDifferential > 0 ? `+${stats.turnoverDifferential}` : stats.turnoverDifferential}</span>
                      <span className="text-[10px] text-slate-500 block">Across all games</span>
                    </div>
                  </div>

                  {/* Game History List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Completed Games History
                    </h4>

                    {teamGames.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No games played yet. Simulate Week 1 to observe performance updates.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {teamGames.map(tg => {
                          const isHome = tg.homeTeamCode === inspectedTeamCode;
                          const teamScore = isHome ? tg.homeScore! : tg.awayScore!;
                          const oppScore = isHome ? tg.awayScore! : tg.homeScore!;
                          const oppCode = isHome ? tg.awayTeamCode : tg.homeTeamCode;
                          const won = teamScore > oppScore;

                          return (
                            <div 
                              key={tg.id} 
                              className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${won ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                  {won ? 'W' : 'L'}
                                </span>
                                <span>Week {tg.week}: {isHome ? 'vs' : '@'} {oppCode}</span>
                              </div>
                              <div className="font-bold text-slate-200">
                                {teamScore} - {oppScore}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setInspectedTeamCode(null)}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                    >
                      Close Profile
                    </button>
                  </div>
                </>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
};
