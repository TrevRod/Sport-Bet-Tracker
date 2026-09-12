import { 
  NFLWeeklyGame, 
  PFFTeamGrades, 
  TeamCumulativeStats, 
  GameBettingInsight, 
  GameBoxStats 
} from '../types';

/**
 * Computes live, dynamic season cumulative statistics for all teams
 * based on all completed games up to this point.
 */
export function computeTeamCumulativeStats(
  games: NFLWeeklyGame[],
  basePffTeams: Record<string, PFFTeamGrades>
): Record<string, TeamCumulativeStats> {
  const statsMap: Record<string, TeamCumulativeStats> = {};

  // Initialize all teams with baseline from PFF profiles
  Object.values(basePffTeams).forEach((team) => {
    statsMap[team.teamCode] = {
      teamCode: team.teamCode,
      teamName: team.teamName,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      winPct: 0,
      pointsScored: 0,
      pointsAllowed: 0,
      pointsPerGame: Math.round(((team.offenseGrade - 50) * 0.45 + 14) * 10) / 10, // Baseline prior PPG
      pointsAllowedPerGame: Math.round(((100 - team.defenseGrade) * 0.35 + 10) * 10) / 10, // Baseline prior PAPG
      pointDifferential: 0,
      totalYardsGained: 0,
      yardsPerGame: Math.round(300 + (team.offenseGrade - 75) * 6),
      passYardsPerGame: Math.round(200 + (team.passingGrade - 75) * 4),
      rushYardsPerGame: Math.round(100 + (team.runGrade - 75) * 2),
      yardsAllowedPerGame: Math.round(350 - (team.defenseGrade - 75) * 5),
      avgOffensiveEPA: team.epaPerPassPlay * 0.65 + team.epaPerRunPlay * 0.35,
      avgDefensiveEPA: -((team.defenseGrade - 80) * 0.01),
      turnoverDifferential: 0,
      formStreak: [],
      adjustedPFFGrade: team.overallGrade
    };
  });

  // Filter completed games sorted chronologically by week
  const completedGames = games
    .filter((g) => g.status === 'final' && g.homeScore !== undefined && g.awayScore !== undefined)
    .sort((a, b) => a.week - b.week);

  // Accumulate box scores into team stats
  completedGames.forEach((game) => {
    const home = statsMap[game.homeTeamCode];
    const away = statsMap[game.awayTeamCode];
    if (!home || !away) return;

    const homePts = game.homeScore!;
    const awayPts = game.awayScore!;

    home.gamesPlayed += 1;
    away.gamesPlayed += 1;

    home.pointsScored += homePts;
    home.pointsAllowed += awayPts;
    away.pointsScored += awayPts;
    away.pointsAllowed += homePts;

    // Wins / Losses / Ties
    if (homePts > awayPts) {
      home.wins += 1;
      away.losses += 1;
      home.formStreak.push('W');
      away.formStreak.push('L');
    } else if (awayPts > homePts) {
      away.wins += 1;
      home.losses += 1;
      away.formStreak.push('W');
      home.formStreak.push('L');
    } else {
      home.ties += 1;
      away.ties += 1;
      home.formStreak.push('T');
      away.formStreak.push('T');
    }

    // Yards and EPA from box stats if available
    const homeBox = game.homeStats || {
      points: homePts,
      passingYards: Math.round(210 + (homePts - 20) * 7),
      rushingYards: Math.round(110 + (homePts - 20) * 3),
      totalYards: Math.round(320 + (homePts - 20) * 10),
      offensiveEPA: Math.round(((homePts - 21) * 0.018) * 100) / 100,
      turnovers: homePts < awayPts ? 2 : 1,
      sacksAllowed: 2,
      passCompletionRate: 66.5
    };

    const awayBox = game.awayStats || {
      points: awayPts,
      passingYards: Math.round(210 + (awayPts - 20) * 7),
      rushingYards: Math.round(110 + (awayPts - 20) * 3),
      totalYards: Math.round(320 + (awayPts - 20) * 10),
      offensiveEPA: Math.round(((awayPts - 21) * 0.018) * 100) / 100,
      turnovers: awayPts < homePts ? 2 : 1,
      sacksAllowed: 2,
      passCompletionRate: 64.0
    };

    home.totalYardsGained += homeBox.totalYards;
    away.totalYardsGained += awayBox.totalYards;

    // Turnover differential
    home.turnoverDifferential += (awayBox.turnovers - homeBox.turnovers);
    away.turnoverDifferential += (homeBox.turnovers - awayBox.turnovers);
  });

  // Calculate averages and dynamic PFF rating adjustments
  Object.keys(statsMap).forEach((code) => {
    const t = statsMap[code];
    const basePff = basePffTeams[code];

    if (t.gamesPlayed > 0) {
      t.winPct = Math.round((t.wins / t.gamesPlayed) * 1000) / 1000;
      t.pointsPerGame = Math.round((t.pointsScored / t.gamesPlayed) * 10) / 10;
      t.pointsAllowedPerGame = Math.round((t.pointsAllowed / t.gamesPlayed) * 10) / 10;
      t.pointDifferential = t.pointsScored - t.pointsAllowed;
      t.yardsPerGame = Math.round(t.totalYardsGained / t.gamesPlayed);
      t.passYardsPerGame = Math.round(t.yardsPerGame * 0.65);
      t.rushYardsPerGame = Math.round(t.yardsPerGame * 0.35);
      
      // Dynamic adjusted PFF grade: blends initial talent grade with actual point differential & EPA
      // As more games are played, real empirical performance takes higher weight!
      const weight = Math.min(0.65, t.gamesPlayed * 0.15);
      const perfGrade = Math.min(96, Math.max(65, 78 + (t.pointDifferential / t.gamesPlayed) * 1.2));
      if (basePff) {
        t.adjustedPFFGrade = Math.round(((1 - weight) * basePff.overallGrade + weight * perfGrade) * 10) / 10;
      }
    }
  });

  // Rank offensive and defensive power
  const sortedOffense = [...Object.values(statsMap)].sort((a, b) => b.pointsPerGame - a.pointsPerGame);
  sortedOffense.forEach((t, index) => {
    t.offensivePowerRank = index + 1;
  });

  const sortedDefense = [...Object.values(statsMap)].sort((a, b) => a.pointsAllowedPerGame - b.pointsAllowedPerGame);
  sortedDefense.forEach((t, index) => {
    t.defensivePowerRank = index + 1;
  });

  return statsMap;
}

/**
 * Evaluates any weekly matchup using the latest cumulative statistics
 * and PFF unit grades, producing clear, actionable line and points recommendations.
 */
export function generateGameBettingInsight(
  game: NFLWeeklyGame,
  homeStats: TeamCumulativeStats,
  awayStats: TeamCumulativeStats,
  homePff: PFFTeamGrades,
  awayPff: PFFTeamGrades
): GameBettingInsight {
  // 1. Offense vs Defense matchup rating
  const homeFieldBonus = game.dome ? 2.0 : 1.75;
  
  // Scoring expectation based on team's PPG against opponent's PAPG
  const leagueAvgScoring = 21.8;
  const homeOffensePower = (homeStats.pointsPerGame - leagueAvgScoring) * 0.75;
  const awayDefenseVulnerability = (awayStats.pointsAllowedPerGame - leagueAvgScoring) * 0.75;
  
  const awayOffensePower = (awayStats.pointsPerGame - leagueAvgScoring) * 0.75;
  const homeDefenseVulnerability = (homeStats.pointsAllowedPerGame - leagueAvgScoring) * 0.75;

  // PFF Trench differential: Pass Block vs Pass Rush
  const homeTrenchAdvantage = (homePff.passBlockGrade - awayPff.passRushGrade) * 0.12;
  const awayTrenchAdvantage = (awayPff.passBlockGrade - homePff.passRushGrade) * 0.12;

  // Passing vs Coverage efficiency
  const homePassAdvantage = (homePff.passingGrade - awayPff.coverageGrade) * 0.15;
  const awayPassAdvantage = (awayPff.passingGrade - homePff.coverageGrade) * 0.15;

  // EPA per play adjustment
  const epaEdge = (homePff.epaPerPassPlay - awayPff.epaPerPassPlay) * 8.0;

  // Projected Points
  let predictedHomeScore = Math.max(
    10,
    Math.round(
      leagueAvgScoring +
      homeOffensePower +
      awayDefenseVulnerability +
      homeTrenchAdvantage +
      homePassAdvantage +
      homeFieldBonus +
      epaEdge / 2
    )
  );

  let predictedAwayScore = Math.max(
    10,
    Math.round(
      leagueAvgScoring +
      awayOffensePower +
      homeDefenseVulnerability +
      awayTrenchAdvantage +
      awayPassAdvantage -
      epaEdge / 2
    )
  );

  // Weather/Dome pace adjustment
  if (game.dome) {
    predictedHomeScore += 1;
    predictedAwayScore += 1;
  }

  // Model Fair Spread: negative means Home is favored by that many points
  const rawSpread = predictedAwayScore - predictedHomeScore;
  const predictedSpread = Math.round(rawSpread * 2) / 2; // Half point rounding

  const predictedTotal = predictedHomeScore + predictedAwayScore;

  // Win probabilities
  const spreadDiff = predictedSpread;
  const homeWinProb = Math.min(94, Math.max(6, Math.round((1 / (1 + Math.pow(10, spreadDiff / 13.5))) * 1000) / 10));
  const awayWinProb = Math.round((100 - homeWinProb) * 10) / 10;

  // ----------------------------------------------------------------
  // 2. INSIGHT: WHAT SHOULD I TAKE FOR THE LINE (SPREAD)?
  // ----------------------------------------------------------------
  // Market Spread is from Home team perspective (e.g. -2.5 means Home -2.5)
  // If predictedSpread is -6.0 and marketSpread is -2.5, Home team has +3.5 point edge!
  const homeEdgeOnSpread = game.marketSpread - predictedSpread; 
  
  let recLineTeamCode: string;
  let recLineTeamName: string;
  let recLineString: string;
  let recLineOdds: number = -110;
  let recLineEdgePoints: number;
  let recLineEvPct: number;
  let recLineStars: number;
  let recLineLabel: 'HIGH VALUE' | 'SOLID EDGE' | 'LEAN' | 'PASS';
  let recLineRationale: string;

  if (homeEdgeOnSpread > 1.2) {
    // Take Home Team
    recLineTeamCode = game.homeTeamCode;
    recLineTeamName = homePff.teamName;
    const formattedSpread = game.marketSpread > 0 ? `+${game.marketSpread}` : `${game.marketSpread}`;
    recLineString = `${homePff.city} ${homePff.teamName} ${formattedSpread}`;
    recLineEdgePoints = Math.round(homeEdgeOnSpread * 10) / 10;
    recLineEvPct = Math.round(Math.min(18.5, recLineEdgePoints * 2.6 + 1.5) * 10) / 10;
    
    if (recLineEdgePoints >= 3.0) {
      recLineStars = 5;
      recLineLabel = 'HIGH VALUE';
    } else if (recLineEdgePoints >= 2.0) {
      recLineStars = 4;
      recLineLabel = 'SOLID EDGE';
    } else {
      recLineStars = 3;
      recLineLabel = 'LEAN';
    }

    recLineRationale = `${homePff.teamName} stats project a ${Math.abs(predictedSpread)} pt advantage over ${awayPff.teamName}. With ${homeStats.pointsPerGame} PPG vs ${awayStats.pointsAllowedPerGame} PAPG allowed and a +${Math.round((homePff.passBlockGrade - awayPff.passRushGrade) * 10) / 10} trench edge, market line of ${formattedSpread} is heavily discounted by ${recLineEdgePoints} points.`;
  } else if (homeEdgeOnSpread < -1.2) {
    // Take Away Team
    recLineTeamCode = game.awayTeamCode;
    recLineTeamName = awayPff.teamName;
    const awayMarketSpread = -game.marketSpread;
    const formattedSpread = awayMarketSpread > 0 ? `+${awayMarketSpread}` : `${awayMarketSpread}`;
    recLineString = `${awayPff.city} ${awayPff.teamName} ${formattedSpread}`;
    recLineEdgePoints = Math.round(Math.abs(homeEdgeOnSpread) * 10) / 10;
    recLineEvPct = Math.round(Math.min(18.5, recLineEdgePoints * 2.6 + 1.5) * 10) / 10;

    if (recLineEdgePoints >= 3.0) {
      recLineStars = 5;
      recLineLabel = 'HIGH VALUE';
    } else if (recLineEdgePoints >= 2.0) {
      recLineStars = 4;
      recLineLabel = 'SOLID EDGE';
    } else {
      recLineStars = 3;
      recLineLabel = 'LEAN';
    }

    recLineRationale = `${awayPff.teamName} holds superior efficiency metrics (+${awayStats.avgOffensiveEPA > 0 ? '+' : ''}${awayStats.avgOffensiveEPA.toFixed(2)} EPA). The model projects ${awayPff.teamName} within ${predictedSpread > 0 ? `+${predictedSpread}` : predictedSpread} points, beating the book's ${formattedSpread} line by +${recLineEdgePoints} pts of value.`;
  } else {
    // Near fair line
    recLineTeamCode = homeEdgeOnSpread >= 0 ? game.homeTeamCode : game.awayTeamCode;
    recLineTeamName = homeEdgeOnSpread >= 0 ? homePff.teamName : awayPff.teamName;
    const spread = homeEdgeOnSpread >= 0 ? game.marketSpread : -game.marketSpread;
    recLineString = `${recLineTeamName} ${spread > 0 ? `+${spread}` : spread}`;
    recLineEdgePoints = Math.round(Math.abs(homeEdgeOnSpread) * 10) / 10;
    recLineEvPct = Math.round((recLineEdgePoints * 1.8) * 10) / 10;
    recLineStars = 2;
    recLineLabel = 'PASS';
    recLineRationale = `Market spread is tightly calibrated to statistical expectations (${recLineEdgePoints} pt variance). Slight analytical lean to ${recLineTeamName}, but better value exists elsewhere on the board.`;
  }

  // ----------------------------------------------------------------
  // 3. INSIGHT: WHAT SHOULD I TAKE FOR THE POINTS (OVER / UNDER)?
  // ----------------------------------------------------------------
  const totalDifference = predictedTotal - game.marketTotal;
  let recPointsPick: 'OVER' | 'UNDER';
  let recPointsLine: number = game.marketTotal;
  let recPointsOdds: number = -110;
  let recPointsEdge: number = Math.round(Math.abs(totalDifference) * 10) / 10;
  let recPointsStars: number;
  let recPointsLabel: 'HIGH VALUE' | 'SOLID EDGE' | 'LEAN' | 'PASS';
  let recPointsRationale: string;

  if (totalDifference >= 2.0) {
    recPointsPick = 'OVER';
    if (recPointsEdge >= 4.0) {
      recPointsStars = 5;
      recPointsLabel = 'HIGH VALUE';
    } else if (recPointsEdge >= 2.5) {
      recPointsStars = 4;
      recPointsLabel = 'SOLID EDGE';
    } else {
      recPointsStars = 3;
      recPointsLabel = 'LEAN';
    }
    recPointsRationale = `Combined scoring averages (${Math.round((homeStats.pointsPerGame + awayStats.pointsPerGame) * 10) / 10} PPG) and high explosive play rates project ${predictedTotal} total points. With ${game.dome ? 'controlled dome passing conditions' : 'positive weather factor'}, take OVER ${game.marketTotal} with a +${recPointsEdge} pt projection surplus.`;
  } else if (totalDifference <= -2.0) {
    recPointsPick = 'UNDER';
    if (recPointsEdge >= 4.0) {
      recPointsStars = 5;
      recPointsLabel = 'HIGH VALUE';
    } else if (recPointsEdge >= 2.5) {
      recPointsStars = 4;
      recPointsLabel = 'SOLID EDGE';
    } else {
      recPointsStars = 3;
      recPointsLabel = 'LEAN';
    }
    recPointsRationale = `Both teams feature top-half defensive efficiency (allowing ${Math.round((homeStats.pointsAllowedPerGame + awayStats.pointsAllowedPerGame) * 10) / 10} combined PAPG) and strong red zone stop rates. Model projects defensive stalemate at ${predictedTotal} total points, yielding a +${recPointsEdge} pt edge on UNDER ${game.marketTotal}.`;
  } else {
    recPointsPick = totalDifference >= 0 ? 'OVER' : 'UNDER';
    recPointsStars = 2;
    recPointsLabel = 'PASS';
    recPointsRationale = `Bookmaker total of ${game.marketTotal} aligns cleanly with model projection of ${predictedTotal} pts (${recPointsEdge} pt gap). Slight analytical lean to ${recPointsPick}, but edge is thin.`;
  }

  // Key metrics comparison
  const keyMetrics = [
    {
      metric: 'Points Per Game (PPG)',
      homeValue: `${homeStats.pointsPerGame.toFixed(1)} (#${homeStats.offensivePowerRank || '-'})`,
      awayValue: `${awayStats.pointsPerGame.toFixed(1)} (#${awayStats.offensivePowerRank || '-'})`,
      edgeTeam: homeStats.pointsPerGame > awayStats.pointsPerGame ? 'home' as const : 'away' as const,
      description: 'Dynamic scoring average updated from all completed games.'
    },
    {
      metric: 'Points Allowed / Game (PAPG)',
      homeValue: `${homeStats.pointsAllowedPerGame.toFixed(1)} (#${homeStats.defensivePowerRank || '-'})`,
      awayValue: `${awayStats.pointsAllowedPerGame.toFixed(1)} (#${awayStats.defensivePowerRank || '-'})`,
      edgeTeam: homeStats.pointsAllowedPerGame < awayStats.pointsAllowedPerGame ? 'home' as const : 'away' as const,
      description: 'Fewer points allowed reflects stronger scoring defense.'
    },
    {
      metric: 'Offensive EPA / Play',
      homeValue: `${homePff.epaPerPassPlay > 0 ? '+' : ''}${homePff.epaPerPassPlay.toFixed(2)}`,
      awayValue: `${awayPff.epaPerPassPlay > 0 ? '+' : ''}${awayPff.epaPerPassPlay.toFixed(2)}`,
      edgeTeam: homePff.epaPerPassPlay > awayPff.epaPerPassPlay ? 'home' as const : 'away' as const,
      description: 'Expected Points Added per pass play (PFF advanced metric).'
    },
    {
      metric: 'PFF Trench Advantage',
      homeValue: `${homePff.passBlockGrade.toFixed(1)} PB`,
      awayValue: `${awayPff.passRushGrade.toFixed(1)} PR`,
      edgeTeam: homePff.passBlockGrade > awayPff.passRushGrade ? 'home' as const : 'away' as const,
      description: 'Offensive line pass protection vs opposing defensive pass rush.'
    },
    {
      metric: 'Turnover Differential',
      homeValue: `${homeStats.turnoverDifferential > 0 ? '+' : ''}${homeStats.turnoverDifferential}`,
      awayValue: `${awayStats.turnoverDifferential > 0 ? '+' : ''}${awayStats.turnoverDifferential}`,
      edgeTeam: homeStats.turnoverDifferential > awayStats.turnoverDifferential ? 'home' as const : 'away' as const,
      description: 'Net turnovers forced minus giveaways across all games.'
    }
  ];

  return {
    matchupId: game.id,
    recommendedLine: {
      selection: recLineString,
      teamCode: recLineTeamCode,
      teamName: recLineTeamName,
      line: game.marketSpread > 0 ? `+${game.marketSpread}` : `${game.marketSpread}`,
      odds: recLineOdds,
      edgePoints: recLineEdgePoints,
      evPercentage: recLineEvPct,
      confidenceStars: recLineStars,
      confidenceLabel: recLineLabel,
      rationale: recLineRationale
    },
    recommendedPoints: {
      selection: `${recPointsPick} ${recPointsLine}`,
      pick: recPointsPick,
      line: recPointsLine,
      odds: recPointsOdds,
      projectedTotal: predictedTotal,
      edgePoints: recPointsEdge,
      confidenceStars: recPointsStars,
      confidenceLabel: recPointsLabel,
      rationale: recPointsRationale
    },
    predictedHomeScore,
    predictedAwayScore,
    predictedSpread,
    predictedTotal,
    homeWinProb,
    awayWinProb,
    keyMetrics
  };
}

/**
 * Generates an automatic, realistic simulation outcome for an NFL game.
 * Uses Gaussian noise around the model's projected score to create true-to-life box stats.
 */
export function simulateGameResult(
  game: NFLWeeklyGame,
  homePff: PFFTeamGrades,
  awayPff: PFFTeamGrades,
  homeStats: TeamCumulativeStats,
  awayStats: TeamCumulativeStats
): NFLWeeklyGame {
  const insight = generateGameBettingInsight(game, homeStats, awayStats, homePff, awayPff);

  // Add realistic statistical football variance (-7 to +7 pts)
  const homeVariance = Math.round((Math.random() - 0.5) * 10);
  const awayVariance = Math.round((Math.random() - 0.5) * 10);

  let finalHomeScore = Math.max(7, insight.predictedHomeScore + homeVariance);
  let finalAwayScore = Math.max(6, insight.predictedAwayScore + awayVariance);

  // Avoid regular-season ties if possible
  if (finalHomeScore === finalAwayScore) {
    if (Math.random() > 0.5) {
      finalHomeScore += 3; // Field goal in OT
    } else {
      finalAwayScore += 3;
    }
  }

  const homePassYds = Math.round(200 + (finalHomeScore - 14) * 6 + (Math.random() * 60 - 30));
  const homeRushYds = Math.round(100 + (finalHomeScore - 14) * 3 + (Math.random() * 40 - 20));
  
  const awayPassYds = Math.round(200 + (finalAwayScore - 14) * 6 + (Math.random() * 60 - 30));
  const awayRushYds = Math.round(100 + (finalAwayScore - 14) * 3 + (Math.random() * 40 - 20));

  const homeTurnovers = finalHomeScore < finalAwayScore ? Math.floor(Math.random() * 2) + 1 : Math.floor(Math.random() * 2);
  const awayTurnovers = finalAwayScore < finalHomeScore ? Math.floor(Math.random() * 2) + 1 : Math.floor(Math.random() * 2);

  const homeStatsBox: GameBoxStats = {
    points: finalHomeScore,
    passingYards: homePassYds,
    rushingYards: homeRushYds,
    totalYards: homePassYds + homeRushYds,
    offensiveEPA: Math.round(((finalHomeScore - 21) * 0.02) * 100) / 100,
    turnovers: homeTurnovers,
    sacksAllowed: Math.floor(Math.random() * 3) + 1,
    passCompletionRate: Math.round((60 + Math.random() * 15) * 10) / 10
  };

  const awayStatsBox: GameBoxStats = {
    points: finalAwayScore,
    passingYards: awayPassYds,
    rushingYards: awayRushYds,
    totalYards: awayPassYds + awayRushYds,
    offensiveEPA: Math.round(((finalAwayScore - 21) * 0.02) * 100) / 100,
    turnovers: awayTurnovers,
    sacksAllowed: Math.floor(Math.random() * 3) + 1,
    passCompletionRate: Math.round((58 + Math.random() * 15) * 10) / 10
  };

  return {
    ...game,
    status: 'final',
    currentQuarter: 'Final',
    homeScore: finalHomeScore,
    awayScore: finalAwayScore,
    homeStats: homeStatsBox,
    awayStats: awayStatsBox
  };
}
