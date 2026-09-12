import { Bet, BankrollSummary } from '../types';

export const DEFAULT_UNIT_SIZE = 100;
export const DEFAULT_BANKROLL = 5000;

export function calculateProfit(stake: number, odds: number): number {
  if (odds > 0) {
    return (stake * odds) / 100;
  } else if (odds < 0) {
    return (stake * 100) / Math.abs(odds);
  }
  return 0;
}

export function oddsToImpliedProbability(odds: number): number {
  if (odds > 0) {
    return (100 / (odds + 100)) * 100;
  } else if (odds < 0) {
    return (Math.abs(odds) / (Math.abs(odds) + 100)) * 100;
  }
  return 50;
}

export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function calculateBankrollSummary(
  bets: Bet[],
  startingBankroll: number = DEFAULT_BANKROLL,
  unitSize: number = DEFAULT_UNIT_SIZE
): BankrollSummary {
  let netProfit = 0;
  let wonBets = 0;
  let lostBets = 0;
  let pushedBets = 0;
  let pendingBets = 0;
  let totalStaked = 0;
  let totalReturned = 0;
  let clvBeatenCount = 0;
  let clvEligibleCount = 0;
  let totalOddsSum = 0;

  for (const bet of bets) {
    totalStaked += bet.stake;
    totalOddsSum += bet.odds;

    if (bet.status === 'won') {
      wonBets++;
      const profit = bet.profit !== undefined ? bet.profit : calculateProfit(bet.stake, bet.odds);
      netProfit += profit;
      totalReturned += bet.stake + profit;
    } else if (bet.status === 'lost') {
      lostBets++;
      const loss = bet.profit !== undefined ? bet.profit : -bet.stake;
      netProfit += loss;
    } else if (bet.status === 'push') {
      pushedBets++;
      totalReturned += bet.stake;
    } else if (bet.status === 'pending') {
      pendingBets++;
    }

    if (bet.clvDifference !== undefined) {
      clvEligibleCount++;
      if (bet.clvDifference > 0) {
        clvBeatenCount++;
      }
    }
  }

  const resolvedBets = wonBets + lostBets;
  const winRate = resolvedBets > 0 ? Math.round((wonBets / resolvedBets) * 1000) / 10 : 0;
  const resolvedStaked = bets
    .filter(b => b.status === 'won' || b.status === 'lost')
    .reduce((sum, b) => sum + b.stake, 0);

  const roiPercentage = resolvedStaked > 0 
    ? Math.round((netProfit / resolvedStaked) * 1000) / 10 
    : 0;

  const clvBeatRate = clvEligibleCount > 0 
    ? Math.round((clvBeatenCount / clvEligibleCount) * 1000) / 10 
    : 0;

  return {
    startingBankroll,
    currentBankroll: startingBankroll + netProfit,
    netProfit: Math.round(netProfit * 100) / 100,
    totalBets: bets.length,
    pendingBets,
    wonBets,
    lostBets,
    pushedBets,
    winRate,
    roiPercentage,
    totalStaked: Math.round(totalStaked * 100) / 100,
    totalReturned: Math.round(totalReturned * 100) / 100,
    unitSize,
    unitsNetProfit: Math.round((netProfit / unitSize) * 100) / 100,
    avgOdds: bets.length > 0 ? Math.round(totalOddsSum / bets.length) : -110,
    clvBeatRate
  };
}

export function exportBetsToCSV(bets: Bet[]): void {
  const headers = [
    'ID', 'Date', 'Matchup', 'Selection', 'BetType', 'MarketLine', 'Odds', 
    'Stake', 'Units', 'Sportsbook', 'Status', 'Profit', 'ClosingLine', 'CLVDifference', 'PFFAdvantageNote'
  ];

  const rows = bets.map(b => [
    b.id,
    b.date,
    `"${b.matchup}"`,
    `"${b.teamOrSelection}"`,
    b.betType,
    `"${b.marketLine}"`,
    b.odds,
    b.stake,
    b.units,
    b.sportsbook,
    b.status,
    b.profit ?? '',
    `"${b.closingLine ?? ''}"`,
    b.clvDifference ?? '',
    `"${(b.pffAdvantageNote ?? '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `sports_bets_pff_tracker_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
