import { RequestHandler } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dbQueries from "../db/queries";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

// Rate limiting constants
const RATE_LIMIT_MESSAGES_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60;

// Content filter patterns
const CONTENT_FILTER_PATTERNS = [
  { pattern: /\b(hate|racist|sexist|discriminat)/i, severity: 'high', label: 'Hate speech' },
  { pattern: /\b(spam|scam|fraud|phishing)/i, severity: 'medium', label: 'Suspicious intent' },
  { pattern: /\b(password|credit card|ssn|pin)\b/i, severity: 'high', label: 'Sensitive info' },
];

export const handleAIChat: RequestHandler = async (req, res) => {
  try {
    const { message, sessionId: clientSessionId, conversationHistory: clientHistory } = req.body;
    const userId = (req as any).user?.playerId;
    const sessionId = clientSessionId || `session-${userId}-${Date.now()}`;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check rate limit
    const rateLimitCheck = await dbQueries.checkRateLimit(userId, '/api/ai/chat', RATE_LIMIT_MESSAGES_PER_MINUTE, RATE_LIMIT_WINDOW_SECONDS);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    // Content filtering
    const filterResult = filterContent(message);
    if (filterResult.blocked) {
      await dbQueries.logContentFilter(userId, message, message, filterResult.reason, filterResult.severity, 'blocked');
      return res.status(400).json({ error: 'Your message contains inappropriate content and cannot be processed.' });
    }

    if (filterResult.filtered) {
      await dbQueries.logContentFilter(userId, message, filterResult.filteredMessage, filterResult.reason, filterResult.severity, 'filtered');
    }

    // Create or get session
    await dbQueries.createConversationSession(userId, sessionId);

    // Save user message
    await dbQueries.saveAIMessage(userId, sessionId, 'user', 'User', 'user', message);

    // Get conversation history for context (last 5 exchanges)
    const history = await dbQueries.getConversationContext(userId, sessionId, 10);

    // Build context from history
    const conversationContext = buildContextPrompt(history);

    console.log(`[AI Chat] Message from user ${userId}: ${message}`);

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.warn('[AI Chat] Gemini API Key missing, falling back to rule-based responses');
      return fallbackResponse(message, sessionId, userId, res);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are LuckyAI, the advanced platform assistant for CoinKrazy, a premier sweepstakes and social casino platform.
      Your goal is to assist players with platform questions, optimize their experience, and maintain a high-energy, positive atmosphere.

      Platform Context:
      - Name: CoinKrazy
      - Currency: Gold Coins (GC) for fun, Sweeps Coins (SC) for promotional play.
      - Key Features: Slots, Live Casino, Poker, Bingo, Sportsbook, Sweepstakes, Social Store.
      - Core AI Agents:
        - LuckyAI (General Assistant - that's you!)
        - SecurityAI (Handles security and transaction safety)
        - PromotionsAI (Calculates and offers custom bonuses)
        - SlotsAI (Optimizes game performance and RTP)

      ${conversationContext}

      User's Current Message: "${message}"

      Response Guidelines:
      - Be helpful, enthusiastic, and professional.
      - Use emojis where appropriate (🍀, 🎰, 💎, 🕶️).
      - If the message is about winning or luck, you can mention that you've "optimized the RNG pathways" as a playful way to encourage them.
      - If it's about security or withdrawals, refer to yourself or SecurityAI.
      - Keep responses relatively concise but thorough.
      - Remember the context of the conversation and maintain continuity.

      Respond as LuckyAI:
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Save AI response
    const aiMessage = await dbQueries.saveAIMessage(userId, sessionId, 'ai-1', 'LuckyAI', 'ai', responseText, {
      model: 'gemini-1.5-flash',
      generatedAt: new Date().toISOString()
    });

    // Update session message count
    await dbQueries.updateConversationSession(sessionId, {
      total_messages: (history.length + 1) || 1
    });

    res.json({
      success: true,
      data: {
        message: responseText,
        agent: "LuckyAI",
        sessionId,
        timestamp: new Date(),
        messageId: aiMessage.rows[0].id
      }
    });
  } catch (error) {
    console.error('[AI Chat] Error:', error);
    res.status(500).json({ error: 'AI Assistant is currently recalibrating. Please try again in a moment.' });
  }
};

// Helper function to build context prompt from conversation history
function buildContextPrompt(history: any[]): string {
  if (history.length === 0) {
    return 'This is the start of a new conversation.';
  }

  const contextLines = history
    .reverse()
    .slice(0, 5)
    .map((msg: any) => `${msg.message_type === 'user' ? 'User' : msg.agent_name}: ${msg.message_content}`)
    .join('\n');

  return `Recent conversation context:\n${contextLines}\n\n`;
}

// Content filter function
function filterContent(message: string): { blocked: boolean; filtered: boolean; reason?: string; severity?: string; filteredMessage?: string } {
  for (const filter of CONTENT_FILTER_PATTERNS) {
    if (filter.pattern.test(message)) {
      if (filter.severity === 'high') {
        return { blocked: true, filtered: false, reason: filter.label, severity: 'high' };
      } else {
        return {
          blocked: false,
          filtered: true,
          reason: filter.label,
          severity: 'medium',
          filteredMessage: message.replace(filter.pattern, '***')
        };
      }
    }
  }
  return { blocked: false, filtered: false };
}

export const handleGetAIStatus: RequestHandler = async (req, res) => {
  try {
    const result = await dbQueries.getAIEmployees();
    const statusResult = await dbQueries.getAIAgentStatus();

    res.json({
      success: true,
      data: {
        employees: result.rows || [],
        status: statusResult.rows || []
      }
    });
  } catch (error) {
    console.debug('AI status request failed (non-critical):', error instanceof Error ? error.message : 'Unknown error');
    // Return fallback data instead of error to prevent fetch failures
    res.json({
      success: true,
      data: {
        employees: [],
        status: []
      }
    });
  }
};

export const handleGetConversationHistory: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.playerId;
    const { sessionId } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const history = await dbQueries.getConversationHistory(userId, sessionId as string, 100);
    res.json({ success: true, data: history.rows });
  } catch (error) {
    console.error('Failed to get conversation history:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve conversation history' });
  }
};

export const handleGetSessions: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.playerId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sessions = await dbQueries.getPlayerSessions(userId);
    res.json({ success: true, data: sessions.rows });
  } catch (error) {
    console.error('Failed to get sessions:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve sessions' });
  }
};

async function fallbackResponse(message: string, sessionId: string, userId: number, res: any) {
    // Basic logic for AI responses
    let response = "I'm analyzing the platform data for you. Everything looks optimal!";
    let agent = "LuckyAI";

    const msg = message.toLowerCase();

    if (msg.includes('win') || msg.includes('luck') || msg.includes('odds')) {
      response = "I've just optimized the RNG pathways for your next session. The momentum is in your favor! 🍀";
    } else if (msg.includes('security') || msg.includes('safe') || msg.includes('withdraw')) {
      response = "SecurityAI here. Your funds are protected by our advanced AI security layer. All transactions are monitored for your safety.";
      agent = "SecurityAI";
    } else if (msg.includes('bonus') || msg.includes('free') || msg.includes('promo')) {
      response = "PromotionsAI is currently calculating a custom reward for your account. Keep an eye on your notifications! 🎁";
      agent = "PromotionsAI";
    } else if (msg.includes('game') || msg.includes('slots') || msg.includes('poker')) {
      response = "Our games are running at peak performance. SlotsAI suggests trying Emerald King for its current high volatility! 🎰";
      agent = "SlotsAI";
    } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      response = "Hello! I'm LuckyAI, your platform assistant. How can I optimize your experience today? 🕶️";
    }

    // Save fallback response
    await dbQueries.saveAIMessage(userId, sessionId, 'ai-1', agent, 'ai', response, { fallback: true });

    return res.json({
      success: true,
      data: {
        message: response,
        agent,
        sessionId,
        timestamp: new Date()
      }
    });
}
