import React, { useState } from 'react';
import { 
  Shield, 
  Search, 
  ArrowUpDown, 
  Users, 
  AlertCircle, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PFFTeamGrades } from '../types';
import { NFL_TEAMS_PFF } from '../data/pffData';

export const PFFTeamsMatrix: React.FC = () => {
  const [conferenceFilter, setConferenceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<keyof PFFTeamGrades>('overallGrade');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [expandedTeamCode, setExpandedTeamCode] = useState<string | null>(null);

  const teams = Object.values(NFL_TEAMS_PFF);

  const filteredTeams = teams.filter((t) => {
    if (conferenceFilter !== 'ALL' && t.conference !== conferenceFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.teamName.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.teamCode.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const handleSort = (field: keyof PFFTeamGrades) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const toggleTeam = (code: string) => {
    setExpandedTeamCode(prev => prev === code ? null : code);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Shield className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Pro Football Focus (PFF) Unit Grades Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Explore 0–100 PFF player and team grades, EPA efficiencies, pass-block win rates, and trench pressure metrics.
            </p>
          </div>

          {/* Conference Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setConferenceFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                conferenceFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All NFL
            </button>
            <button
              onClick={() => setConferenceFilter('AFC')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                conferenceFilter === 'AFC' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              AFC
            </button>
            <button
              onClick={() => setConferenceFilter('NFC')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                conferenceFilter === 'NFC' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              NFC
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter teams..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* PFF Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Team</th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('overallGrade')}
                >
                  <div className="flex items-center gap-1">
                    <span>Overall</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('passingGrade')}
                >
                  <div className="flex items-center gap-1">
                    <span>Pass</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('passBlockGrade')}
                >
                  <div className="flex items-center gap-1">
                    <span>P-Block</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('runGrade')}
                >
                  <div className="flex items-center gap-1">
                    <span>Run</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('runDefenseGrade')}
                >
                  <div className="flex items-center gap-1">
                    <span>Run Def</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('passRushGrade')}
                >
                  <div className="flex items-center gap-1">
                    <span>P-Rush</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('coverageGrade')}
                >
                  <div className="flex items-center gap-1">
                    <span>Coverage</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('pressureRateAllowed')}
                >
                  <div className="flex items-center gap-1">
                    <span>Press All%</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('epaPerPassPlay')}
                >
                  <div className="flex items-center gap-1">
                    <span>EPA/Pass</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredTeams.map((t) => {
                const isExpanded = expandedTeamCode === t.teamCode;

                return (
                  <React.Fragment key={t.teamCode}>
                    <tr 
                      onClick={() => toggleTeam(t.teamCode)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white shadow-xs"
                            style={{ backgroundColor: t.primaryColor }}
                          >
                            {t.logoEmoji}
                          </div>
                          <div>
                            <span className="font-bold">{t.city} {t.teamName}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">({t.record})</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        {t.overallGrade}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {t.passingGrade}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {t.passBlockGrade}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {t.runGrade}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {t.runDefenseGrade}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {t.passRushGrade}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {t.coverageGrade}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {t.pressureRateAllowed}%
                      </td>
                      <td className="py-3 px-3 font-mono text-teal-300 font-semibold">
                        {t.epaPerPassPlay > 0 ? `+${t.epaPerPassPlay}` : t.epaPerPassPlay}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                      </td>
                    </tr>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <tr className="bg-slate-950/70">
                        <td colSpan={11} className="p-4 sm:p-5">
                          <div className="space-y-4 text-xs">
                            
                            {/* Key Players */}
                            <div>
                              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                                PFF Key Players &amp; High-Leverage Matchup Weapons
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                {t.keyPlayers.map((player, pIdx) => (
                                  <div key={pIdx} className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-white">{player.name}</span>
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                                        PFF {player.pffGrade}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 block font-semibold">{player.position} &bull; {player.highlightStat}</span>
                                    <p className="text-[11px] text-slate-300 mt-1">{player.matchupAdvantage}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Injuries & Situational Notes */}
                            <div className="flex items-center gap-2 text-slate-400 pt-1">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Injury Watch: </span>
                              <span className="text-slate-300 font-medium">{t.injuries.join(', ') || 'No critical starter injuries'}</span>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
