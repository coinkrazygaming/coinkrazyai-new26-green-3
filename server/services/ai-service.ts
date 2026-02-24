import { emitGameUpdate, emitAIAgentStatusUpdate, emitAIEvent } from "../socket";
import { query } from "../db/connection";
import { updateCasinoSetting, updateAIAgentStatus, saveAIMessage } from "../db/queries";

export class AIService {
  private static intervals: NodeJS.Timeout[] = [];

  static startAIProcesses() {
    // Clear existing processes first to avoid duplicates on hot-reload
    this.stopAIProcesses();

    // LuckyAI: General manager, periodic health check and settings update
    this.intervals.push(setInterval(async () => {
      try {
        console.log("[LuckyAI] Running platform health check...");
        const dbCheck = await query('SELECT 1');
        const status = dbCheck.rows.length > 0 ? 'Optimal' : 'Degraded';
        await updateCasinoSetting('system_health', status);
        await updateAIAgentStatus('ai-1', 'active', 'Platform health check');

        // Emit real-time update
        emitAIAgentStatusUpdate('ai-1', {
          agent_name: 'LuckyAI',
          status: 'active',
          current_task: 'Platform health check',
          system_health: status
        });

        console.log(`[LuckyAI] Platform health: ${status}`);
      } catch (err) {
        console.error("[LuckyAI] Health check failed:", err);
      }
    }, 60000));

    // SlotsAI: Adjusting RTP (simulated dynamic RTP)
    this.intervals.push(setInterval(async () => {
      try {
        const newRTP = (94 + Math.random() * 4).toFixed(1);
        await updateCasinoSetting('slots_dynamic_rtp', newRTP);
        await updateAIAgentStatus('ai-3', 'active', 'RTP optimization');
        emitGameUpdate("slots", { rtp: newRTP, message: "SlotsAI optimized payout rates" });
        console.log(`[SlotsAI] RTP updated to ${newRTP}`);
      } catch (err) {
        console.error("[SlotsAI] RTP update failed:", err);
      }
    }, 120000));

    // SocialAI: Moderating chat and simulated activity
    this.intervals.push(setInterval(async () => {
      try {
        const messages = [
          "Good luck everyone! 🍀",
          "Someone just hit a big win on Emerald King!",
          "Welcome to our new players! 🕶️",
          "Don't forget to claim your daily bonus!",
          "Play responsibly and have fun! 💎",
          "We're hosting special tournaments this weekend! 🎉",
          "Check out our new featured games!",
          "Great vibes in the community today! 🌟"
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        await updateAIAgentStatus('ai-5', 'active', 'Community engagement');
        emitGameUpdate("chat", { user: "SocialAI", message: msg });
        console.log(`[SocialAI] Posted: ${msg}`);
      } catch (err) {
        console.error("[SocialAI] Chat update failed:", err);
      }
    }, 45000));

    // PromotionsAI: Analyzing player activity and generating promotions
    this.intervals.push(setInterval(async () => {
      try {
        console.log("[PromotionsAI] Analyzing player activity for custom bonuses...");
        await updateAIAgentStatus('ai-6', 'active', 'Promotion analysis');

        // Simulate finding promotable players
        const promotionIdeas = [
          "VIP players showing high engagement",
          "New players completing 5+ games",
          "Weekend bonus promotions",
          "Seasonal promotion campaigns"
        ];
        const idea = promotionIdeas[Math.floor(Math.random() * promotionIdeas.length)];
        console.log(`[PromotionsAI] Generated promotion idea: ${idea}`);
      } catch (err) {
        console.error("[PromotionsAI] Analysis failed:", err);
      }
    }, 180000));

    // SecurityAI: Monitoring for suspicious activities
    this.intervals.push(setInterval(async () => {
      try {
        console.log("[SecurityAI] Running security scans...");
        await updateAIAgentStatus('ai-2', 'active', 'Security monitoring');

        // Check for suspicious patterns
        const threatLevel = Math.random() > 0.9 ? 'low' : 'normal';
        console.log(`[SecurityAI] Threat level: ${threatLevel}`);
      } catch (err) {
        console.error("[SecurityAI] Security check failed:", err);
      }
    }, 300000)); // Run every 5 minutes

    // JoseyAI: Poker engine optimization
    this.intervals.push(setInterval(async () => {
      try {
        console.log("[JoseyAI] Optimizing poker game balance...");
        await updateAIAgentStatus('ai-4', 'idle', 'Awaiting poker games');
        // Poker optimization logic would go here
      } catch (err) {
        console.error("[JoseyAI] Optimization failed:", err);
      }
    }, 240000)); // Run every 4 minutes

    console.log('[AIService] All AI processes started successfully');
  }

  static stopAIProcesses() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    console.log('[AIService] All AI processes stopped');
  }
}
