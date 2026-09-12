import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { WeeklyGameInsights } from './components/WeeklyGameInsights';
import { BetTracker } from './components/BetTracker';
import { PredictiveEdgeTerminal } from './components/PredictiveEdgeTerminal';
import { PlayerPropFinder } from './components/PlayerPropFinder';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { PFFTeamsMatrix } from './components/PFFTeamsMatrix';
import { AddBetModal } from './components/AddBetModal';
import { AuthModal } from './components/AuthModal';
import { Bet, BetStatus, BankrollSummary, NFLWeeklyGame } from './types';
import { INITIAL_SEED_BETS } from './data/pffData';
import { INITIAL_WEEKLY_SCHEDULE } from './data/weeklyScheduleData';
import { 
  auth, 
  subscribeToBets, 
  syncBetToCloud, 
  deleteBetFromCloud, 
  saveCloudSettings, 
  fetchCloudSettings,
  batchUploadLocalBets
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  calculateBankrollSummary, 
  calculateProfit, 
  DEFAULT_BANKROLL, 
  DEFAULT_UNIT_SIZE 
} from './utils/betCalculations';

const STORAGE_KEY_BETS = 'pff_sharp_bets_2026';
const STORAGE_KEY_SETTINGS = 'pff_bankroll_settings_2026';
const STORAGE_KEY_GAMES = 'pff_sharp_weekly_games_2026';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'weekly' | 'tracker' | 'predict' | 'props' | 'analytics' | 'teams'>('weekly');
  
  // User Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCloudSyncActive, setIsCloudSyncActive] = useState<boolean>(false);

  // Weekly Games state with auto-stats update and persistence
  const [weeklyGames, setWeeklyGames] = useState<NFLWeeklyGame[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GAMES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading games from localStorage', e);
    }
    return INITIAL_WEEKLY_SCHEDULE;
  });

  // Bets state with localStorage persistence
  const [bets, setBets] = useState<Bet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BETS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading bets from localStorage', e);
    }
    return INITIAL_SEED_BETS;
  });

  // Bankroll settings
  const [settings, setSettings] = useState<{ startingBankroll: number; unitSize: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading settings from localStorage', e);
    }
    return { startingBankroll: DEFAULT_BANKROLL, unitSize: DEFAULT_UNIT_SIZE };
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsCloudSyncActive(true);
        // Load cloud settings if present
        const cloudSettings = await fetchCloudSettings(user.uid);
        if (cloudSettings) {
          setSettings({
            startingBankroll: cloudSettings.startingBankroll || DEFAULT_BANKROLL,
            unitSize: cloudSettings.unitSize || DEFAULT_UNIT_SIZE
          });
        }

        // Subscribe to real-time Firestore bets
        const unsubscribeBets = subscribeToBets(user.uid, (cloudBets) => {
          if (cloudBets && cloudBets.length > 0) {
            setBets(cloudBets);
          } else {
            // First time cloud user: sync current seed/local bets to Firestore
            setBets(currentLocal => {
              if (currentLocal && currentLocal.length > 0) {
                batchUploadLocalBets(user.uid, currentLocal).catch(console.error);
              }
              return currentLocal;
            });
          }
        });

        return () => {
          unsubscribeBets();
        };
      } else {
        setIsCloudSyncActive(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Save to localStorage as offline fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(weeklyGames));
    } catch (e) {
      console.error('Failed to save weeklyGames to localStorage', e);
    }
  }, [weeklyGames]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BETS, JSON.stringify(bets));
    } catch (e) {
      console.error('Failed to save bets to localStorage', e);
    }
  }, [bets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [betToEdit, setBetToEdit] = useState<Partial<Bet> | undefined>(undefined);

  // Bankroll summary
  const bankrollSummary: BankrollSummary = calculateBankrollSummary(
    bets,
    settings.startingBankroll,
    settings.unitSize
  );

  // Handlers
  const handleSaveBet = (savedBet: Bet) => {
    setBets((prev) => {
      const existsIndex = prev.findIndex((b) => b.id === savedBet.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = savedBet;
        return updated;
      }
      return [savedBet, ...prev];
    });

    // Sync to Cloud Firestore if logged in
    if (currentUser) {
      syncBetToCloud(currentUser.uid, savedBet).catch((err) => {
        console.error('Failed to sync saved bet to Firestore', err);
      });
    }
  };

  const handleUpdateBetStatus = (id: string, status: BetStatus) => {
    setBets((prev) => {
      let updatedBetToSync: Bet | null = null;
      const nextBets = prev.map((bet) => {
        if (bet.id !== id) return bet;

        let profit: number | undefined = undefined;
        let payout: number | undefined = undefined;

        if (status === 'won') {
          profit = calculateProfit(bet.stake, bet.odds);
          payout = bet.stake + profit;
        } else if (status === 'lost') {
          profit = -bet.stake;
          payout = 0;
        } else if (status === 'push') {
          profit = 0;
          payout = bet.stake;
        }

        const updated: Bet = {
          ...bet,
          status,
          profit,
          payout
        };
        updatedBetToSync = updated;
        return updated;
      });

      if (currentUser && updatedBetToSync) {
        syncBetToCloud(currentUser.uid, updatedBetToSync).catch(console.error);
      }
      return nextBets;
    });
  };

  const handleDeleteBet = (id: string) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
    if (currentUser) {
      deleteBetFromCloud(currentUser.uid, id).catch(console.error);
    }
  };

  const handleEditBet = (bet: Bet) => {
    setBetToEdit(bet);
    setIsAddModalOpen(true);
  };

  const handleOpenAddBet = () => {
    setBetToEdit(undefined);
    setIsAddModalOpen(true);
  };

  // Handlers for weekly games
  const handleUpdateGame = (updatedGame: NFLWeeklyGame) => {
    setWeeklyGames(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));
  };

  const handleUpdateAllGames = (updatedGames: NFLWeeklyGame[]) => {
    setWeeklyGames(updatedGames);
  };

  const handleResetGames = () => {
    setWeeklyGames(INITIAL_WEEKLY_SCHEDULE);
    try {
      localStorage.removeItem(STORAGE_KEY_GAMES);
    } catch (e) {
      console.error(e);
    }
  };

  // Quick log helper from predictive edges or prop finder
  const handleQuickLogBet = (draft: Partial<Bet>) => {
    setBetToEdit(draft);
    setIsAddModalOpen(true);
  };

  const handleUpdateBankrollSettings = (startingBankroll: number, unitSize: number) => {
    setSettings({ startingBankroll, unitSize });
    if (currentUser) {
      saveCloudSettings(currentUser.uid, { startingBankroll, unitSize }, {
        email: currentUser.email,
        displayName: currentUser.displayName
      }).catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Navigation and Bankroll Ticker Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        bankrollSummary={bankrollSummary}
        onOpenAddBet={handleOpenAddBet}
        onUpdateBankrollSettings={handleUpdateBankrollSettings}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Account Sync Status Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${currentUser ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
            <span className="text-slate-300">
              {currentUser ? (
                <span>
                  Connected as <strong className="text-white">{currentUser.displayName || (currentUser.isAnonymous ? 'Guest Account' : currentUser.email)}</strong> &bull; Changes automatically save and sync to Cloud
                </span>
              ) : (
                <span>
                  Using Local Browser Storage &bull; Sign in to access your bets &amp; bankroll from any device
                </span>
              )}
            </span>
          </div>

          <button
            id="btn-quick-account-status"
            onClick={() => setIsAuthModalOpen(true)}
            className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline text-xs"
          >
            {currentUser ? 'Manage Cloud Sync' : 'Sign In / Cloud Backup'}
          </button>
        </div>

        {currentTab === 'weekly' && (
          <WeeklyGameInsights
            games={weeklyGames}
            onUpdateGame={handleUpdateGame}
            onUpdateAllGames={handleUpdateAllGames}
            onResetGames={handleResetGames}
            onQuickLogBet={handleQuickLogBet}
            unitSize={settings.unitSize}
          />
        )}

        {currentTab === 'tracker' && (
          <BetTracker
            bets={bets}
            onUpdateBetStatus={handleUpdateBetStatus}
            onDeleteBet={handleDeleteBet}
            onEditBet={handleEditBet}
            onOpenAddBet={handleOpenAddBet}
            onNavigateToPredict={() => setCurrentTab('predict')}
            onNavigateToWeekly={() => setCurrentTab('weekly')}
          />
        )}

        {currentTab === 'predict' && (
          <PredictiveEdgeTerminal
            onQuickLogBet={handleQuickLogBet}
            unitSize={settings.unitSize}
          />
        )}

        {currentTab === 'props' && (
          <PlayerPropFinder
            onQuickLogBet={handleQuickLogBet}
            unitSize={settings.unitSize}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsCharts
            bets={bets}
            bankrollSummary={bankrollSummary}
          />
        )}

        {currentTab === 'teams' && (
          <PFFTeamsMatrix />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            PFF SharpTrack &bull; Sports Betting Tracker &amp; Predictive Analytics
          </span>
          <span className="text-[11px] text-slate-500">
            Powered by Pro Football Focus (PFF) Unit Grades &amp; Gemini Flash Quantitative Modeling
          </span>
        </div>
      </footer>

      {/* Add / Edit Bet Modal */}
      <AddBetModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setBetToEdit(undefined);
        }}
        onSaveBet={handleSaveBet}
        unitSize={settings.unitSize}
        initialBetData={betToEdit}
      />

      {/* Account Access & Cloud Data Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        localBets={bets}
      />

    </div>
  );
}
