import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

const router = express.Router();

router.get('/ai', protect, async (req, res) => {
  try {
    const Model = req.isAdmin ? Admin : User;
    const user = await Model.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // AI Check: If key is invalid/missing, return pre-configured smart notifications
    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.length < 10) {
      return res.json({ 
        success: true, 
        notifications: getFallbackNotifs('ApiKey check failed') 
      });
    }

    let genAI, model;
    try {
      genAI = new GoogleGenerativeAI(apiKey);
      model = genAI.getGenerativeModel({ model: "gemini-flash-latest" }); 
    } catch (sdkErr) {
      console.error('[AI-SDK-ERR]', sdkErr);
      return res.json({ success: true, notifications: getFallbackNotifs() });
    }

    const { examType, rank, category, state, preferredBranches } = user.profile || {};
    const currentDate = new Date().toISOString().split('T')[0];
    const branchesStr = Array.isArray(preferredBranches) ? preferredBranches?.join(', ') : 'any';

    const prompt = `
      As an expert Indian college analyzer, generate 3 smart, real-time updates for this student:
      - Rank: ${rank || 'N/A'}, Category: ${category || 'General'}, Aiming for: ${branchesStr}
      
      Focus ONLY on:
      1. Platform Updates: (e.g., 'New historical data added for AP EAPCET', 'Improved prediction engine for NITs').
      2. Predicted College Insights: (e.g., 'High probability for GMRIT based on your rank', 'Your 15% AIQ chances have shifted').
      
      Output MUST be a JSON array: [{"id":${Date.now()},"type":"system","title":"...","message":"...","date":"YYYY-MM-DD","priority":"medium"}]
      Keep it professional. Only JSON.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().replace(/```json|```/g, '').trim();
      
      const aiNotifications = JSON.parse(text);
      // Ensure unique IDs
      const finalNotifs = aiNotifications.map((n, idx) => ({
         ...n,
         id: Date.now() + idx,
         isAi: true
      }));

      res.json({
        success: true,
        notifications: finalNotifs
      });
    } catch (aiErr) {
      console.error('[AI-GEN-ERR]', aiErr);
      res.json({ success: true, notifications: getFallbackNotifs() });
    }

  } catch (err) {
    console.error(' [NOTIF GLOBAL ERR] ', err);
    res.json({ 
      success: true, 
      notifications: getFallbackNotifs()
    });
  }
});

function getFallbackNotifs(reason = '') {
  const now = new Date('2026-04-02').toISOString();
  return [
    {
      id: 'ai-1',
      type: 'deadline',
      title: 'Phase 1 Registration Reminder',
      message: 'Registration for your entrance exam counseling is expected to start next week.',
      date: now,
      priority: 'high',
      read: false,
      isAi: true
    },
    {
      id: 'ai-2',
      type: 'cutoff',
      title: 'Branch Insights',
      message: 'Based on last year trends, you have strong chances in top-tier colleges.',
      date: now,
      priority: 'medium',
      read: false,
      isAi: true
    }
  ];
}

export default router;
