import React, { useState } from 'react';
import { 
  Users, 
  Sparkles, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Bet } from '../types';

interface PropItem {
  id: string;
  player: string;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  team: string;
  opponent: string;
  propType: 'Passing Yards' | 'Rushing Yards' | 'Receiving Yards' | 'Pass TDs';
  marketLine: number;
  recommendation: 'OVER' | 'UNDER';
  odds: number;
  modelProjection: number;
  edgePercentage: number;
  playerPffGrade: number;
  oppGrade: number;
  pffAdvantageDetail: string;
}

const PROP_EDGES: PropItem[] = [
  {
    id: 'prop-1',
    player: 'Amon-Ra St. Brown',
    position: 'WR',
    team: 'DET',
    opponent: 'SF',
    propType: 'Receiving Yards',
    marketLine: 78.5,
    recommendation: 'OVER',
    odds: -115,
    modelProjection: 94.2,
    edgePercentage: 11.4,
    playerPffGrade: 91.2,
    oppGrade: 68.4,
    pffAdvantageDetail: 'Faces 49ers backup slot CB (68.4 PFF coverage grade). St. Brown commands a 29.4% target share in dome games with +2.8 YPRR.'
  },
  {
    id: 'prop-2',
    player: 'Saquon Barkley',
    position: 'RB',
    team: 'PHI',
    opponent: 'GB',
    propType: 'Rushing Yards',
    marketLine: 82.5,
    recommendation: 'OVER',
    odds: -110,
    modelProjection: 98.6,
    edgePercentage: 12.8,
    playerPffGrade: 91.5,
    oppGrade: 74.2,
    pffAdvantageDetail: 'Eagles OL ranks #2 in PFF run-blocking (88.6) against Packers light-box 2-high defensive front (74.2 run stop grade).'
  },
  {
    id: 'prop-3',
    player: 'Patrick Mahomes',
    position: 'QB',
    team: 'KC',
    opponent: 'BAL',
    propType: 'Passing Yards',
    marketLine: 264.5,
    recommendation: 'OVER',
    odds: -112,
    modelProjection: 284.0,
    edgePercentage: 7.9,
    playerPffGrade: 91.4,
    oppGrade: 81.0,
    pffAdvantageDetail: 'Mahomes has a 93.2 clean-pocket rating. With KC pass block grade at 84.6, Baltimore blitz rate falls into high-EPA checkdowns.'
  },
  {
    id: 'prop-4',
    player: 'Josh Jacobs',
    position: 'RB',
    team: 'GB',
    opponent: 'PHI',
    propType: 'Rushing Yards',
    marketLine: 71.5,
    recommendation: 'UNDER',
    odds: -115,
    modelProjection: 61.0,
    edgePercentage: 9.1,
    playerPffGrade: 88.1,
    oppGrade: 86.1,
    pffAdvantageDetail: 'Eagles defensive tackle duo (Jalen Carter / Jordan Davis) holds an 86.1 run-defense grade; GB projected negative game script.'
  },
  {
    id: 'prop-5',
    player: 'Nico Collins',
    position: 'WR',
    team: 'HOU',
    opponent: 'BUF',
    propType: 'Receiving Yards',
    marketLine: 74.5,
    recommendation: 'OVER',
    odds: -110,
    modelProjection: 88.5,
    edgePercentage: 10.5,
    playerPffGrade: 91.8,
    oppGrade: 78.5,
    pffAdvantageDetail: 'Collins leads the AFC in yards per route run (3.12). Buffalo outside CBs allow 12.8 yards per target on intermediate digs.'
  },
  {
    id: 'prop-6',
    player: 'Lamar Jackson',
    position: 'QB',
    team: 'BAL',
    opponent: 'KC',
    propType: 'Rushing Yards',
    marketLine: 49.5,
    recommendation: 'OVER',
    odds: -115,
    modelProjection: 62.4,
    edgePercentage: 14.2,
    playerPffGrade: 92.8,
    oppGrade: 82.1,
    pffAdvantageDetail: 'KC plays high frequency of 2-man under coverage with DB backs turned, leaving open scrambles for Jackson (90.4 rushing grade).'
  }
];

interface PlayerPropFinderProps {
  onQuickLogBet: (betDraft: Partial<Bet>) => void;
  unitSize: number;
}

export const PlayerPropFinder: React.FC<PlayerPropFinderProps> = ({
  onQuickLogBet,
  unitSize
}) => {
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedPropType, setSelectedPropType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProps = PROP_EDGES.filter((p) => {
    if (selectedPosition !== 'ALL' && p.position !== selectedPosition) return false;
    if (selectedPropType !== 'ALL' && p.propType !== selectedPropType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.player.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q) ||
        p.opponent.toLowerCase().includes(q) ||
        p.pffAdvantageDetail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleBetProp = (prop: PropItem) => {
    onQuickLogBet({
      matchup: `${prop.team} vs ${prop.opponent}`,
      teamOrSelection: `${prop.player} ${prop.recommendation} ${prop.marketLine} ${prop.propType}`,
      betType: 'player_prop',
      marketLine: `${prop.recommendation === 'OVER' ? 'O' : 'U'} ${prop.marketLine}`,
      odds: prop.odds,
      stake: 1.0 * unitSize,
      units: 1.0,
      sportsbook: 'FanDuel',
      status: 'pending',
      pffAdvantageNote: `${prop.pffAdvantageDetail} (Model Projection: ${prop.modelProjection}, +${prop.edgePercentage}% EV)`,
      confidenceRating: prop.edgePercentage > 10 ? 5 : 4,
      notes: `Logged from PFF Player Prop Value Finder. Player Grade ${prop.playerPffGrade} vs Opponent ${prop.oppGrade}.`
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                PFF Player Prop Value Finder
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Exploits individual player mismatch grades: WR separation vs DB coverage, QB clean pocket yards, and RB yards after contact.
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Model Standard</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              Minimum +7.0% EV Edge Threshold
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search player or team..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Position Filter */}
          <div>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Positions (QB, RB, WR, TE)</option>
              <option value="QB">Quarterbacks (Passing)</option>
              <option value="RB">Running Backs (Rushing)</option>
              <option value="WR">Wide Receivers (Receiving)</option>
            </select>
          </div>

          {/* Prop Type Filter */}
          <div>
            <select
              value={selectedPropType}
              onChange={(e) => setSelectedPropType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Prop Markets</option>
              <option value="Passing Yards">Passing Yards</option>
              <option value="Rushing Yards">Rushing Yards</option>
              <option value="Receiving Yards">Receiving Yards</option>
            </select>
          </div>

        </div>
      </div>

      {/* Prop Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProps.map((prop) => {
          const isOver = prop.recommendation === 'OVER';

          return (
            <div
              key={prop.id}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-sm transition-all space-y-3"
            >
              {/* Card Header: Player, Matchup, Position */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {prop.position}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {prop.team} vs {prop.opponent}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white tracking-tight mt-1">
                    {prop.player}
                  </h3>
                  <div className="text-xs text-slate-400">
                    {prop.propType}
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block">
                    +{prop.edgePercentage}% EV
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">
                    PFF Grade: <strong className="text-white">{prop.playerPffGrade}</strong> vs Opp <strong className="text-slate-300">{prop.oppGrade}</strong>
                  </div>
                </div>
              </div>

              {/* Line & Model Projection Box */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Sportsbook Line</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {prop.marketLine}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    ({prop.odds > 0 ? `+${prop.odds}` : prop.odds})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Model Projection</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {prop.modelProjection}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {isOver ? `+${(prop.modelProjection - prop.marketLine).toFixed(1)} delta` : `-${(prop.marketLine - prop.modelProjection).toFixed(1)} delta`}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Advantage Pick</span>
                  <span className={`text-xs font-black inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-mono ${
                    isOver ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {isOver ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {prop.recommendation} {prop.marketLine}
                  </span>
                </div>
              </div>

              {/* PFF Matchup Detail Rationale */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                {prop.pffAdvantageDetail}
              </p>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Target: 1.0 Unit (${unitSize})
                </span>
                <button
                  onClick={() => handleBetProp(prop)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log Prop Bet</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
