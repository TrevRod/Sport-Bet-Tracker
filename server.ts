import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { generatePFFPredictiveAnalysis } from './server/geminiService';
import { NFL_TEAMS_PFF, SAMPLE_UPCOMING_MATCHUPS } from './src/data/pffData';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// PFF Matchup Prediction API endpoint
app.post('/api/predict/matchup', async (req, res) => {
  try {
    const { homeTeamCode, awayTeamCode, matchupId, customContext, customHomePff, customAwayPff } = req.body;

    const homeTeam = customHomePff || NFL_TEAMS_PFF[homeTeamCode] || NFL_TEAMS_PFF['KC'];
    const awayTeam = customAwayPff || NFL_TEAMS_PFF[awayTeamCode] || NFL_TEAMS_PFF['BAL'];
    
    // Find or construct matchup
    let matchup = SAMPLE_UPCOMING_MATCHUPS.find(m => m.id === matchupId);
    if (!matchup) {
      matchup = {
        id: matchupId || `matchup-${homeTeam.teamCode.toLowerCase()}-${awayTeam.teamCode.toLowerCase()}`,
        week: req.body.week || 1,
        gameTime: req.body.gameTime || 'Upcoming Game',
        homeTeamCode: homeTeam.teamCode,
        awayTeamCode: awayTeam.teamCode,
        venue: `${homeTeam.city} Stadium`,
        dome: false,
        marketSpread: req.body.marketSpread ?? -2.5,
        marketTotal: req.body.marketTotal ?? 47.5,
        marketHomeML: req.body.marketHomeML ?? -135,
        marketAwayML: req.body.marketAwayML ?? +115,
        publicBetPercentSpreadHome: 55,
        sharpMoneyPercentSpreadHome: 60
      };
    }

    const prediction = await generatePFFPredictiveAnalysis(homeTeam, awayTeam, matchup, customContext);
    res.json({ success: true, prediction });
  } catch (error: any) {
    console.error('Error generating PFF prediction:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// API to list all available teams and sample matchups
app.get('/api/pff/teams', (req, res) => {
  res.json({
    teams: Object.values(NFL_TEAMS_PFF),
    matchups: SAMPLE_UPCOMING_MATCHUPS
  });
});

// Setup Vite middleware or static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sports Betting Tracker & PFF Analytics server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
