import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   POST /api/chat
// @desc    Get AI Counseling Response
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    const user = req.user;

    if (!message) {
      return res.status(400).json({ success: false, message: 'No message provided' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const context = `
      You are an expert Indian College Admissions Counselor. 
      The student's details are:
      Name: ${user.name}
      Exam: ${user.profile?.examType || 'Not specified'}
      Rank: ${user.profile?.rank || 'Not specified'}
      Category: ${user.profile?.category || 'General'}
      State: ${user.profile?.state || 'Not specified'}

      Provide helpful, encouraging, and accurate advice about college admissions, counseling procedures (like JOSAA, CSAB, AP EAPCET), and branch selection.
      Keep your responses concise but highly informative.
    `;

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: context }] },
        { role: 'model', parts: [{ text: 'Understood. I am now your dedicated Counseling Assistant. How can I help you today?' }] },
        ...(chatHistory || []).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }))
      ],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({
      success: true,
      message: responseText
    });
  } catch (error) {
    console.error('Chat AI Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get counselor response. Please try again.',
      error: error.message
    });
  }
});

export default router;
