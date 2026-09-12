export type BetStatus = 'pending' | 'won' | 'lost' | 'push' | 'void';

export type BetType = 
  | 'spread' 
  | 'moneyline' 
  | 'total' 
  | 'player_prop' 
  | 'team_total' 
  | 'parlay' 
  | 'future';

export type Sportsbook = 
  | 'DraftKings' 
  | 'FanDuel' 
  | 'BetMGM' 
  | 'Caesars' 
  | 'ESPN BET' 
  | 'Circa' 
  | 'Pinnacle' 
  | 'Bet365' 
  | 'Fanatics' 
  | 'Other';

export interface Bet {
  id: string;
  date: string; // ISO or YYYY-MM-DD
  matchup: string; // e.g. "KC @ BAL"
  teamOrSelection: string; // e.g. "Kansas City Chiefs -2.5" or "Lamar Jackson Over 48.5 Rush Yds"
  league: string; // "NFL" or "CFB"
  betType: BetType;
  marketLine: string; // e.g. "-2.5", "O 47.5", "+130"
  odds: number; // American odds format e.g. -110 or +145
  stake: number; // in $
  units: number; // e.g. 1.0
  sportsbook: Sportsbook;
  status: BetStatus;
  payout?: number; // Total returned on win (stake + profit)
  profit?: number; // Net profit (payout - stake, or -stake on loss)
  closingLine?: string; // Closing line, e.g. "-3.5"
  closingOdds?: number; // e.g. -125
  clvDifference?: number; // Closing line value points gained e.g. +1.0
  pffAdvantageNote?: string; // e.g. "KC Pass Block (84.2) vs BAL Pass Rush (71.0) creates clean pocket edge"
  confidenceRating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  createdAt: number;
}

export interface PFFKeyPlayer {
  name: string;
  position: string;
  pffGrade: number;
  highlightStat: string;
  matchupAdvantage: string;
}

export interface PFFTeamGrades {
  id: string;
  teamCode: string;
  teamName: string;
  city: string;
  conference: 'AFC' | 'NFC';
  division: 'North' | 'South' | 'East' | 'West';
  primaryColor: string;
  secondaryColor: string;
  logoEmoji: string;
  record: string;
  
  // PFF Unit Grades (0-100 scale)
  overallGrade: number;
  offenseGrade: number;
  passingGrade: number;
  passBlockGrade: number;
  receivingGrade: number;
  runGrade: number;
  runBlockGrade: number;
  defenseGrade: number;
  runDefenseGrade: number;
  passRushGrade: number;
  coverageGrade: number;
  specialTeamsGrade: number;

  // Sharp Advanced Analytics
  pressureRateGenerated: number; // % e.g. 38.5%
  pressureRateAllowed: number; // % e.g. 26.2%
  epaPerPassPlay: number; // e.g. +0.18
  epaPerRunPlay: number; // e.g. -0.04
  turnoverWorthyPlayRate: number; // % e.g. 1.8%
  explosivePlayRate: number; // % e.g. 14.5%
  explosivePlayAllowedRate: number; // % e.g. 10.2%
  wrSeparationRate: number; // % e.g. 64.8%
  tackleEfficiencyGrade: number; // e.g. 78.5

  keyPlayers: PFFKeyPlayer[];
  injuries: string[];
}

export interface MatchupMismatch {
  category: string; // e.g. "Offensive Line vs Pass Rush"
  favoredTeam: string;
  gradeDifferential: number;
  impactLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
  description: string;
  bettingImplication: string;
}

export interface PredictiveAnalysisResult {
  matchupId: string;
  homeScorePredicted: number;
  awayScorePredicted: number;
  predictedSpread: number; // Home team perspective (e.g. -4.5)
  predictedTotal: number;
  homeWinProbability: number; // % e.g. 64.5%
  awayWinProbability: number;
  confidenceScore: number; // 0 - 100
  pffMismatchHighlights: MatchupMismatch[];
  bestBetEdges: {
    pick: string;
    type: BetType;
    marketLine: string;
    modelFairLine: string;
    evPercentage: number;
    recommendedUnits: number;
    confidence: 'High' | 'Medium' | 'Low';
    pffRationale: string;
  }[];
  playerPropEdges: {
    player: string;
    prop: string;
    line: string;
    recommendation: 'OVER' | 'UNDER';
    odds: string;
    modelProjection: string;
    edgePercentage: number;
    pffFactor: string;
  }[];
  sharpAngles: string[];
  weatherOrSituationFactor: string;
}

export interface NFLGameMatchup {
  id: string;
  week: number;
  gameTime: string;
  homeTeamCode: string;
  awayTeamCode: string;
  venue: string;
  dome: boolean;
  marketSpread: number; // Home team spread, e.g. -3.0
  marketTotal: number; // e.g. 47.5
  marketHomeML: number; // e.g. -155
  marketAwayML: number; // e.g. +135
  publicBetPercentSpreadHome: number; // e.g. 68%
  sharpMoneyPercentSpreadHome: number; // e.g. 42% (shows sharp reverse line movement)
}

export interface BankrollSummary {
  startingBankroll: number;
  currentBankroll: number;
  netProfit: number;
  totalBets: number;
  pendingBets: number;
  wonBets: number;
  lostBets: number;
  pushedBets: number;
  winRate: number; // %
  roiPercentage: number; // %
  totalStaked: number;
  totalReturned: number;
  unitSize: number;
  unitsNetProfit: number;
  avgOdds: number;
  clvBeatRate: number; // % of bets that beat closing line
}

export type GameStatus = 'scheduled' | 'in_progress' | 'final';

export interface GameBoxStats {
  points: number;
  passingYards: number;
  rushingYards: number;
  totalYards: number;
  offensiveEPA: number;
  turnovers: number;
  sacksAllowed: number;
  passCompletionRate: number;
}

export interface NFLWeeklyGame {
  id: string;
  week: number;
  gameTime: string;
  homeTeamCode: string;
  awayTeamCode: string;
  venue: string;
  dome: boolean;
  status: GameStatus;
  currentQuarter?: string; // e.g. "Q2 04:12" or "Final"
  homeScore?: number;
  awayScore?: number;
  homeStats?: GameBoxStats;
  awayStats?: GameBoxStats;
  marketSpread: number; // Home spread, e.g. -2.5
  marketTotal: number; // e.g. 47.5
  marketHomeML: number; // e.g. -135
  marketAwayML: number; // e.g. +115
  publicBetPercentSpreadHome: number;
  sharpMoneyPercentSpreadHome: number;
  weatherNotes?: string;
}

export interface TeamCumulativeStats {
  teamCode: string;
  teamName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pointsScored: number;
  pointsAllowed: number;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  pointDifferential: number;
  totalYardsGained: number;
  yardsPerGame: number;
  passYardsPerGame: number;
  rushYardsPerGame: number;
  yardsAllowedPerGame: number;
  avgOffensiveEPA: number;
  avgDefensiveEPA: number;
  turnoverDifferential: number;
  formStreak: ('W' | 'L' | 'T')[];
  adjustedPFFGrade: number;
  offensivePowerRank?: number;
  defensivePowerRank?: number;
}

export interface GameBettingInsight {
  matchupId: string;
  recommendedLine: {
    selection: string;
    teamCode: string;
    teamName: string;
    line: string;
    odds: number;
    edgePoints: number;
    evPercentage: number;
    confidenceStars: number;
    confidenceLabel: 'HIGH VALUE' | 'SOLID EDGE' | 'LEAN' | 'PASS';
    rationale: string;
  };
  recommendedPoints: {
    selection: string;
    pick: 'OVER' | 'UNDER';
    line: number;
    odds: number;
    projectedTotal: number;
    edgePoints: number;
    confidenceStars: number;
    confidenceLabel: 'HIGH VALUE' | 'SOLID EDGE' | 'LEAN' | 'PASS';
    rationale: string;
  };
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedSpread: number;
  predictedTotal: number;
  homeWinProb: number;
  awayWinProb: number;
  keyMetrics: {
    metric: string;
    homeValue: string | number;
    awayValue: string | number;
    edgeTeam: 'home' | 'away' | 'even';
    description: string;
  }[];
}

