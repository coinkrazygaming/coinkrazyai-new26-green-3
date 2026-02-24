import { query } from './connection';
import { WalletService } from '../services/wallet-service';

// Re-export query function for modules that need it
export { query } from './connection';

// ===== PLAYERS =====
export const getPlayers = async (limit = 20, offset = 0) => {
  return query(
    `SELECT id, name, email, gc_balance, sc_balance, status, kyc_level, 
            kyc_verified, join_date, last_login 
     FROM players 
     ORDER BY join_date DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
};

export const getPlayerById = async (id: number) => {
  return query(
    `SELECT * FROM players WHERE id = $1`,
    [id]
  );
};

export const updatePlayerBalance = async (playerId: number, gc: number, sc: number) => {
  return query(
    `UPDATE players SET gc_balance = $1, sc_balance = $2, updated_at = NOW() 
     WHERE id = $3 RETURNING *`,
    [gc, sc, playerId]
  );
};

export const updatePlayerStatus = async (playerId: number, status: string) => {
  return query(
    `UPDATE players SET status = $1, updated_at = NOW() 
     WHERE id = $2 RETURNING *`,
    [status, playerId]
  );
};

export const getPlayerStats = async () => {
  return query(
    `SELECT 
      COUNT(*) as total_players,
      SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_players,
      SUM(CASE WHEN kyc_verified = true THEN 1 ELSE 0 END) as verified_players,
      AVG(gc_balance) as avg_gc_balance,
      AVG(sc_balance) as avg_sc_balance
     FROM players`
  );
};

// ===== GAMES =====
export const getGames = async () => {
  return query(
    `SELECT * FROM games ORDER BY name ASC`
  );
};

export const getGameById = async (id: number) => {
  return query(
    `SELECT * FROM games WHERE id = $1`,
    [id]
  );
};

export const updateGameRTP = async (gameId: number, rtp: number) => {
  return query(
    `UPDATE games SET rtp = $1, last_updated = NOW() 
     WHERE id = $2 RETURNING *`,
    [rtp, gameId]
  );
};

export const toggleGameStatus = async (gameId: number, enabled: boolean) => {
  return query(
    `UPDATE games SET enabled = $1, last_updated = NOW() 
     WHERE id = $2 RETURNING *`,
    [enabled, gameId]
  );
};

// ===== BONUSES =====
export const getBonuses = async () => {
  return query(
    `SELECT * FROM bonuses WHERE status = 'Active' ORDER BY name ASC`
  );
};

export const createBonus = async (bonusData: any) => {
  const { name, type, amount, percentage, min_deposit, max_claims, start_date, end_date } = bonusData;
  return query(
    `INSERT INTO bonuses (name, type, amount, percentage, min_deposit, max_claims, start_date, end_date, status) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Active') 
     RETURNING *`,
    [name, type, amount, percentage, min_deposit, max_claims, start_date, end_date]
  );
};

// ===== TRANSACTIONS =====
export const getTransactions = async (limit = 50) => {
  return query(
    `SELECT t.*, p.name as player_name 
     FROM transactions t 
     JOIN players p ON t.player_id = p.id 
     ORDER BY t.created_at DESC 
     LIMIT $1`,
    [limit]
  );
};

export const createTransaction = async (playerId: number, type: string, amount: number, currency: string) => {
  return query(
    `INSERT INTO transactions (player_id, type, amount, currency, status) 
     VALUES ($1, $2, $3, $4, 'Completed') 
     RETURNING *`,
    [playerId, type, amount, currency]
  );
};

// ===== POKER =====
export const getPokerTables = async () => {
  return query(
    `SELECT * FROM poker_tables ORDER BY name ASC`
  );
};

export const updatePokerTablePlayers = async (tableId: number, players: number) => {
  return query(
    `UPDATE poker_tables SET current_players = $1 WHERE id = $2 RETURNING *`,
    [players, tableId]
  );
};

// ===== BINGO =====
export const getBingoGames = async () => {
  return query(
    `SELECT * FROM bingo_games ORDER BY created_at DESC`
  );
};

export const updateBingoGameStatus = async (gameId: number, status: string) => {
  return query(
    `UPDATE bingo_games SET status = $1 WHERE id = $2 RETURNING *`,
    [status, gameId]
  );
};

// ===== SPORTS =====
export const getSportsEvents = async () => {
  return query(
    `SELECT * FROM sports_events ORDER BY event_date DESC`
  );
};

export const lockSportsEvent = async (eventId: number, locked: boolean) => {
  return query(
    `UPDATE sports_events SET locked = $1 WHERE id = $2 RETURNING *`,
    [locked, eventId]
  );
};

// ===== SECURITY ALERTS =====
export const getSecurityAlerts = async (limit = 20) => {
  return query(
    `SELECT * FROM security_alerts 
     ORDER BY timestamp DESC 
     LIMIT $1`,
    [limit]
  );
};

export const createSecurityAlert = async (alertType: string, severity: string, title: string, description: string) => {
  return query(
    `INSERT INTO security_alerts (alert_type, severity, title, description) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [alertType, severity, title, description]
  );
};

// ===== KYC =====
export const getKYCDocuments = async (playerId: number) => {
  return query(
    `SELECT * FROM kyc_documents WHERE player_id = $1 ORDER BY created_at DESC`,
    [playerId]
  );
};

export const updateKYCStatus = async (playerId: number, level: string, verified: boolean) => {
  return query(
    `UPDATE players 
     SET kyc_level = $1, kyc_verified = $2, kyc_verified_date = NOW(), updated_at = NOW() 
     WHERE id = $3 
     RETURNING *`,
    [level, verified, playerId]
  );
};

// ===== PLAYER AUTH =====
export const getPlayerByUsername = async (username: string) => {
  return query(
    `SELECT * FROM players WHERE LOWER(username) = LOWER($1)`,
    [username]
  );
};

export const getPlayerByEmail = async (email: string) => {
  return query(
    `SELECT * FROM players WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
};

export const createPlayer = async (username: string, name: string, email: string, passwordHash: string) => {
  return query(
    `INSERT INTO players (username, name, email, password_hash, gc_balance, sc_balance, status)
     VALUES ($1, $2, $3, $4, 10000, 5, 'Active')
     RETURNING id, username, name, email, gc_balance, sc_balance, status, created_at`,
    [username, name, email, passwordHash]
  );
};

export const createPlayerSession = async (playerId: number, token: string, expiresAt: Date) => {
  return query(
    `INSERT INTO player_sessions (player_id, token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [playerId, token, expiresAt]
  );
};

export const getPlayerSession = async (token: string) => {
  return query(
    `SELECT ps.*, p.* FROM player_sessions ps
     JOIN players p ON ps.player_id = p.id
     WHERE ps.token = $1 AND ps.expires_at > NOW()`,
    [token]
  );
};

export const updatePlayerLastLogin = async (playerId: number) => {
  return query(
    `UPDATE players SET last_login = NOW() WHERE id = $1 RETURNING *`,
    [playerId]
  );
};

// ===== GAME RESULTS =====
export const recordSlotsResult = async (playerId: number, gameId: number, betAmount: number, winnings: number, symbols: string) => {
  return query(
    `INSERT INTO slots_results (player_id, game_id, bet_amount, winnings, symbols)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [playerId, gameId, betAmount, winnings, symbols]
  );
};

export const recordPokerResult = async (playerId: number, tableId: number, buyIn: number, cashOut: number, handsPlayed: number, duration: number) => {
  return query(
    `INSERT INTO poker_results (player_id, table_id, buy_in, cash_out, hands_played, duration_minutes, profit)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [playerId, tableId, buyIn, cashOut, handsPlayed, duration, cashOut - buyIn]
  );
};

export const recordBingoResult = async (playerId: number, gameId: number, ticketPrice: number, winnings: number, pattern: string) => {
  return query(
    `INSERT INTO bingo_results (player_id, game_id, ticket_price, winnings, pattern_matched)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [playerId, gameId, ticketPrice, winnings, pattern]
  );
};

// ===== AI EMPLOYEES =====
export const getAIEmployees = async () => {
  return query(`SELECT * FROM ai_employees ORDER BY id ASC`);
};

export const updateAIStatus = async (aiId: string, status: string) => {
  return query(
    `UPDATE ai_employees SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, aiId]
  );
};

export const assignAIDuty = async (aiId: string, duty: string) => {
  return query(
    `UPDATE ai_employees SET duties = array_append(duties, $1), updated_at = NOW()
     WHERE id = $2 AND NOT ($1 = ANY(duties))
     RETURNING *`,
    [duty, aiId]
  );
};

// ===== CASINO SETTINGS =====
export const getCasinoSettings = async (key?: string) => {
  if (key) {
    return query(`SELECT * FROM casino_settings WHERE setting_key = $1`, [key]);
  }
  return query(`SELECT * FROM casino_settings ORDER BY setting_key ASC`);
};

export const updateCasinoSetting = async (key: string, value: string) => {
  try {
    // First try to update existing record
    const updateResult = await query(
      `UPDATE casino_settings SET setting_value = $2, updated_at = NOW() WHERE setting_key = $1 RETURNING *`,
      [key, value]
    );

    // If no rows were updated, insert new record
    if (updateResult.rowCount === 0) {
      return query(
        `INSERT INTO casino_settings (setting_key, setting_value, updated_at) VALUES ($1, $2, NOW()) RETURNING *`,
        [key, value]
      );
    }

    return updateResult;
  } catch (err) {
    // Fallback: try insert if update fails
    try {
      return await query(
        `INSERT INTO casino_settings (setting_key, setting_value, updated_at) VALUES ($1, $2, NOW()) RETURNING *`,
        [key, value]
      );
    } catch {
      // If insert also fails, log and continue
      console.warn(`Failed to update casino setting ${key}:`, err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }
};

// ===== STORE & PURCHASES =====
export const getStorePacks = async () => {
  return query(
    `SELECT * FROM store_packs WHERE enabled = true ORDER BY position ASC`
  );
};

export const recordPurchase = async (playerId: number, packId: number, amountUsd: number, goldCoins: number, sweepsCoins: number, paymentId: string) => {
  return query(
    `INSERT INTO purchases (player_id, pack_id, amount_usd, gold_coins, sweeps_coins, payment_method, payment_id, status)
     VALUES ($1, $2, $3, $4, $5, 'stripe', $6, 'Completed')
     RETURNING *`,
    [playerId, packId, amountUsd, goldCoins, sweepsCoins, paymentId]
  );
};

export const getPurchaseHistory = async (playerId: number, limit = 20) => {
  return query(
    `SELECT p.*, sp.title as pack_title
     FROM purchases p
     LEFT JOIN store_packs sp ON p.pack_id = sp.id
     WHERE p.player_id = $1
     ORDER BY p.created_at DESC
     LIMIT $2`,
    [playerId, limit]
  );
};

// ===== WALLET LEDGER =====
export const recordWalletTransaction = async (playerId: number, type: string, gcAmount: number, scAmount: number, description: string) => {
  // Get current balance first
  const playerResult = await query(`SELECT gc_balance, sc_balance FROM players WHERE id = $1`, [playerId]);

  if (playerResult.rows.length === 0) throw new Error('Player not found');

  const currentGc = parseFloat(playerResult.rows[0].gc_balance);
  const currentSc = parseFloat(playerResult.rows[0].sc_balance);

  const newGc = currentGc + gcAmount;
  const newSc = currentSc + scAmount;

  // Update player balance
  await query(
    `UPDATE players SET gc_balance = $1, sc_balance = $2 WHERE id = $3`,
    [newGc, newSc, playerId]
  );

  // Record in ledger
  const result = await query(
    `INSERT INTO wallet_ledger (player_id, transaction_type, gc_amount, sc_amount, gc_balance_after, sc_balance_after, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [playerId, type, gcAmount, scAmount, newGc, newSc, description]
  );

  // Notify wallet update via socket
  WalletService.notifyWalletUpdate(playerId, {
    goldCoins: newGc,
    sweepsCoins: newSc
  } as any);

  return result;
};

export const getWalletHistory = async (playerId: number, limit = 50) => {
  return query(
    `SELECT * FROM wallet_ledger
     WHERE player_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [playerId, limit]
  );
};

// ===== SPORTS BETTING =====
export const recordSportsBet = async (playerId: number, eventId: number, betType: string, amount: number, odds: number, potentialWinnings: number) => {
  return query(
    `INSERT INTO sports_bets (player_id, event_id, bet_type, amount, odds, potential_winnings, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
     RETURNING *`,
    [playerId, eventId, betType, amount, odds, potentialWinnings]
  );
};

export const updateBetStatus = async (betId: number, status: string, actualWinnings: number = 0) => {
  return query(
    `UPDATE sports_bets SET status = $1, actual_winnings = $2, settled_at = NOW()
     WHERE id = $3 RETURNING *`,
    [status, actualWinnings, betId]
  );
};

export const getPlayerBets = async (playerId: number, limit = 20) => {
  return query(
    `SELECT sb.*, se.event_name, se.sport
     FROM sports_bets sb
     JOIN sports_events se ON sb.event_id = se.id
     WHERE sb.player_id = $1
     ORDER BY sb.created_at DESC
     LIMIT $2`,
    [playerId, limit]
  );
};

// ===== ACHIEVEMENTS & STATS =====
export const getPlayerAchievements = async (playerId: number) => {
  return query(
    `SELECT a.* FROM player_achievements pa
     JOIN achievements a ON pa.achievement_id = a.id
     WHERE pa.player_id = $1
     ORDER BY pa.earned_at DESC`,
    [playerId]
  );
};

export const awardAchievement = async (playerId: number, achievementId: number) => {
  return query(
    `INSERT INTO player_achievements (player_id, achievement_id)
     VALUES ($1, $2)
     ON CONFLICT (player_id, achievement_id) DO NOTHING
     RETURNING *`,
    [playerId, achievementId]
  );
};

export const getLeaderboard = async (type: string, period: string, limit = 50) => {
  return query(
    `SELECT le.*, p.username, p.name, p.gc_balance
     FROM leaderboard_entries le
     JOIN players p ON le.player_id = p.id
     WHERE le.leaderboard_type = $1 AND le.period = $2
     ORDER BY le.rank ASC
     LIMIT $3`,
    [type, period, limit]
  );
};

export const updateLeaderboardEntries = async () => {
  // This would be called periodically to update leaderboard rankings
  return query(`
    -- Update all-time leaderboards
    WITH daily_wins AS (
      SELECT player_id, COUNT(*) as win_count
      FROM slots_results WHERE winnings > bet_amount
      GROUP BY player_id
    )
    INSERT INTO leaderboard_entries (player_id, leaderboard_type, rank, score, period)
    SELECT player_id, 'wins', ROW_NUMBER() OVER (ORDER BY win_count DESC), win_count, 'all_time'
    FROM daily_wins
    ON CONFLICT (player_id, leaderboard_type, period) DO UPDATE SET score = EXCLUDED.score
  `);
};

// ===== SCRATCH TICKET DESIGNS (ADMIN) =====
export const getScratchTicketDesigns = async (enabled?: boolean) => {
  if (enabled !== undefined) {
    return query(
      `SELECT * FROM scratch_ticket_designs WHERE enabled = $1 ORDER BY created_at DESC`,
      [enabled]
    );
  }
  return query(`SELECT * FROM scratch_ticket_designs ORDER BY created_at DESC`);
};

export const getScratchTicketDesignById = async (id: number) => {
  return query(
    `SELECT * FROM scratch_ticket_designs WHERE id = $1`,
    [id]
  );
};

export const createScratchTicketDesign = async (designData: any) => {
  const {
    name,
    description,
    cost_sc,
    slot_count,
    win_probability,
    prize_min_sc,
    prize_max_sc,
    image_url,
    background_color,
    admin_id,
  } = designData;

  return query(
    `INSERT INTO scratch_ticket_designs (name, description, cost_sc, slot_count, win_probability, prize_min_sc, prize_max_sc, image_url, background_color, created_by, enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
     RETURNING *`,
    [name, description, cost_sc, slot_count, win_probability, prize_min_sc, prize_max_sc, image_url, background_color, admin_id]
  );
};

export const updateScratchTicketDesign = async (id: number, updateData: any) => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updateData.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(updateData.name);
  }
  if (updateData.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(updateData.description);
  }
  if (updateData.cost_sc !== undefined) {
    updates.push(`cost_sc = $${paramIndex++}`);
    values.push(updateData.cost_sc);
  }
  if (updateData.slot_count !== undefined) {
    updates.push(`slot_count = $${paramIndex++}`);
    values.push(updateData.slot_count);
  }
  if (updateData.win_probability !== undefined) {
    updates.push(`win_probability = $${paramIndex++}`);
    values.push(updateData.win_probability);
  }
  if (updateData.prize_min_sc !== undefined) {
    updates.push(`prize_min_sc = $${paramIndex++}`);
    values.push(updateData.prize_min_sc);
  }
  if (updateData.prize_max_sc !== undefined) {
    updates.push(`prize_max_sc = $${paramIndex++}`);
    values.push(updateData.prize_max_sc);
  }
  if (updateData.enabled !== undefined) {
    updates.push(`enabled = $${paramIndex++}`);
    values.push(updateData.enabled);
  }

  if (updates.length === 0) return null;

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const sql = `UPDATE scratch_ticket_designs SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  return query(sql, values);
};

// ===== SCRATCH TICKET PURCHASES & MANAGEMENT =====
export const createScratchTicket = async (playerId: number, designId: number, slots: any[]) => {
  const ticketNumber = `ST-${Date.now()}-${playerId}`;

  return query(
    `INSERT INTO scratch_tickets (design_id, player_id, ticket_number, slots, status, claim_status)
     VALUES ($1, $2, $3, $4, 'active', 'unclaimed')
     RETURNING *`,
    [designId, playerId, ticketNumber, JSON.stringify(slots)]
  );
};

export const getScratchTicketsByPlayer = async (playerId: number, limit = 50) => {
  return query(
    `SELECT st.*, std.name as design_name, std.cost_sc, std.slot_count
     FROM scratch_tickets st
     JOIN scratch_ticket_designs std ON st.design_id = std.id
     WHERE st.player_id = $1
     ORDER BY st.created_at DESC
     LIMIT $2`,
    [playerId, limit]
  );
};

export const getScratchTicketById = async (ticketId: number) => {
  return query(
    `SELECT st.*, std.* FROM scratch_tickets st
     JOIN scratch_ticket_designs std ON st.design_id = std.id
     WHERE st.id = $1`,
    [ticketId]
  );
};

export const updateScratchTicketReveal = async (ticketId: number, revealedSlots: number[]) => {
  return query(
    `UPDATE scratch_tickets
     SET revealed_slots = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [revealedSlots, ticketId]
  );
};

export const claimScratchTicketPrize = async (ticketId: number) => {
  return query(
    `UPDATE scratch_tickets
     SET claim_status = 'claimed', claimed_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [ticketId]
  );
};

// ===== SCRATCH TICKET RESULTS =====
export const createScratchTicketResult = async (ticketId: number, designId: number, playerId: number, won: boolean, prizeAmount: number | null, winningSlotIndex: number | null) => {
  return query(
    `INSERT INTO scratch_ticket_results (ticket_id, design_id, player_id, won, prize_amount, winning_slot_index)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [ticketId, designId, playerId, won, prizeAmount, winningSlotIndex]
  );
};

export const getScratchTicketResult = async (ticketId: number) => {
  return query(
    `SELECT * FROM scratch_ticket_results WHERE ticket_id = $1`,
    [ticketId]
  );
};

// ===== SCRATCH TICKET TRANSACTIONS =====
export const recordScratchTicketTransaction = async (playerId: number, ticketId: number, transactionType: string, amountSc: number, balanceBefore: number, balanceAfter: number, description: string) => {
  return query(
    `INSERT INTO scratch_ticket_transactions (player_id, ticket_id, transaction_type, amount_sc, balance_before, balance_after, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [playerId, ticketId, transactionType, amountSc, balanceBefore, balanceAfter, description]
  );
};

export const getScratchTicketTransactionHistory = async (playerId: number, limit = 50) => {
  return query(
    `SELECT * FROM scratch_ticket_transactions
     WHERE player_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [playerId, limit]
  );
};

export const getScratchTicketTransactionHistoryAdmin = async (limit = 100, offset = 0) => {
  return query(
    `SELECT st.*, p.username, p.name as player_name, std.name as design_name
     FROM scratch_ticket_transactions st
     JOIN players p ON st.player_id = p.id
     LEFT JOIN scratch_tickets skt ON st.ticket_id = skt.id
     LEFT JOIN scratch_ticket_designs std ON skt.design_id = std.id
     ORDER BY st.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
};

// ===== SCRATCH TICKET STATS =====
export const getScratchTicketStats = async () => {
  return query(`
    SELECT
      COUNT(DISTINCT st.player_id) as total_players,
      COUNT(st.id) as total_tickets_purchased,
      SUM(CASE WHEN str.won = true THEN 1 ELSE 0 END) as winning_tickets,
      ROUND(100.0 * SUM(CASE WHEN str.won = true THEN 1 ELSE 0 END) / NULLIF(COUNT(st.id), 0), 2) as win_percentage,
      SUM(str.prize_amount) as total_prizes_awarded,
      SUM(std.cost_sc * COUNT(st.id)) as total_sc_spent
    FROM scratch_tickets st
    LEFT JOIN scratch_ticket_results str ON st.id = str.ticket_id
    LEFT JOIN scratch_ticket_designs std ON st.design_id = std.id
  `);
};

// ===== ADMIN STATS =====
export const getAdminStats = async () => {
  const playerStats = await getPlayerStats();
  const gameStats = await query(`SELECT COUNT(*) as total FROM games`);
  const bonusStats = await query(`SELECT COUNT(*) as total FROM bonuses WHERE status = 'Active'`);
  const transactionStats = await query(
    `SELECT COUNT(*) as total, SUM(amount) as volume FROM transactions WHERE DATE(created_at) = CURRENT_DATE`
  );

  return {
    players: playerStats.rows[0],
    games: gameStats.rows[0],
    bonuses: bonusStats.rows[0],
    transactions: transactionStats.rows[0],
  };
};

// ===== PULL TAB LOTTERY TICKETS =====
export const getPullTabDesigns = async (limit = 50, offset = 0) => {
  return query(
    `SELECT * FROM pull_tab_designs
     WHERE enabled = true
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
};

export const getPullTabDesignById = async (designId: number) => {
  return query(
    `SELECT * FROM pull_tab_designs WHERE id = $1`,
    [designId]
  );
};

export const getPullTabTicket = async (ticketId: number, playerId: number) => {
  return query(
    `SELECT * FROM pull_tab_tickets WHERE id = $1 AND player_id = $2`,
    [ticketId, playerId]
  );
};

export const getPullTabPlayerTickets = async (playerId: number, limit = 50) => {
  return query(
    `SELECT * FROM pull_tab_tickets
     WHERE player_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [playerId, limit]
  );
};

export const getPullTabTransactionHistory = async (playerId: number, limit = 50, offset = 0) => {
  return query(
    `SELECT ptt.*, ptd.name as design_name, ptt.ticket_id
     FROM pull_tab_transactions ptt
     LEFT JOIN pull_tab_tickets pkt ON ptt.ticket_id = pkt.id
     LEFT JOIN pull_tab_designs ptd ON pkt.design_id = ptd.id
     WHERE ptt.player_id = $1
     ORDER BY ptt.created_at DESC
     LIMIT $2 OFFSET $3`,
    [playerId, limit, offset]
  );
};

export const getPullTabTransactionHistoryAdmin = async (limit = 100, offset = 0) => {
  return query(
    `SELECT ptt.*, p.username, p.name as player_name, ptd.name as design_name
     FROM pull_tab_transactions ptt
     JOIN players p ON ptt.player_id = p.id
     LEFT JOIN pull_tab_tickets pkt ON ptt.ticket_id = pkt.id
     LEFT JOIN pull_tab_designs ptd ON pkt.design_id = ptd.id
     ORDER BY ptt.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
};

export const getPullTabStats = async () => {
  return query(`
    SELECT
      COUNT(DISTINCT pkt.player_id) as total_players,
      COUNT(pkt.id) as total_tickets_purchased,
      SUM(CASE WHEN ptr.won = true THEN 1 ELSE 0 END) as winning_tickets,
      ROUND(100.0 * SUM(CASE WHEN ptr.won = true THEN 1 ELSE 0 END) / NULLIF(COUNT(pkt.id), 0), 2) as win_percentage,
      SUM(ptr.prize_amount) as total_prizes_awarded,
      SUM(ptd.cost_sc) as total_sc_spent
    FROM pull_tab_tickets pkt
    LEFT JOIN pull_tab_results ptr ON pkt.id = ptr.ticket_id
    LEFT JOIN pull_tab_designs ptd ON pkt.design_id = ptd.id
  `);
};

export const getPullTabResults = async (limit = 100, offset = 0) => {
  return query(
    `SELECT ptr.*, p.username, p.name as player_name, ptd.name as design_name
     FROM pull_tab_results ptr
     JOIN players p ON ptr.player_id = p.id
     JOIN pull_tab_designs ptd ON ptr.design_id = ptd.id
     ORDER BY ptr.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
};

export const listSocialGroups = async () => {
  return query(
    'SELECT * FROM social_groups ORDER BY created_at DESC'
  );
};

export const createSocialGroup = async (name: string, description: string, imageUrl: string | null, isPrivate: boolean, createdBy: number) => {
  return query(
    `INSERT INTO social_groups (name, description, image_url, is_private, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, description, imageUrl, isPrivate, createdBy]
  );
};

export const joinSocialGroup = async (groupId: number, playerId: number, role = 'member') => {
  return query(
    `INSERT INTO social_group_members (group_id, player_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (group_id, player_id) DO NOTHING
     RETURNING *`,
    [groupId, playerId, role]
  );
};

export const getSocialGroupMembers = async (groupId: number) => {
  return query(
    `SELECT p.id, p.username, p.email, sgm.joined_at, sgm.role FROM social_group_members sgm
     JOIN players p ON sgm.player_id = p.id
     WHERE sgm.group_id = $1
     ORDER BY sgm.joined_at DESC`,
    [groupId]
  );
};

// ===== DAILY LOGIN BONUS =====
export const getDailyLoginBonus = async (playerId: number) => {
  return query(
    `SELECT * FROM daily_login_bonuses WHERE player_id = $1 ORDER BY updated_at DESC LIMIT 1`,
    [playerId]
  );
};

export const createDailyLoginBonus = async (playerId: number, bonusDay: number, amountSc: number, amountGc: number, nextAvailableAt: Date) => {
  return query(
    `INSERT INTO daily_login_bonuses (player_id, bonus_day, amount_sc, amount_gc, next_available_at, status)
     VALUES ($1, $2, $3, $4, $5, 'available')
     RETURNING *`,
    [playerId, bonusDay, amountSc, amountGc, nextAvailableAt]
  );
};

export const claimDailyLoginBonus = async (playerId: number, nextAvailableAt: Date) => {
  return query(
    `UPDATE daily_login_bonuses
     SET claimed_at = NOW(), next_available_at = $1, status = 'claimed', updated_at = NOW()
     WHERE player_id = $2 AND status = 'available'
     RETURNING *`,
    [nextAvailableAt, playerId]
  );
};

// ===== REFERRAL SYSTEM =====
export const createReferralLink = async (referrerId: number, uniqueCode: string) => {
  return query(
    `INSERT INTO referral_links (referrer_id, unique_code)
     VALUES ($1, $2)
     RETURNING *`,
    [referrerId, uniqueCode]
  );
};

export const getReferralLink = async (referrerId: number) => {
  return query(
    `SELECT * FROM referral_links WHERE referrer_id = $1 LIMIT 1`,
    [referrerId]
  );
};

export const getReferralLinkByCode = async (code: string) => {
  return query(
    `SELECT * FROM referral_links WHERE unique_code = $1`,
    [code]
  );
};

export const createReferralClaim = async (referrerId: number, referredPlayerId: number, referralCode: string, bonusSc: number, bonusGc: number) => {
  return query(
    `INSERT INTO referral_claims (referrer_id, referred_player_id, referral_code, referral_bonus_sc, referral_bonus_gc, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [referrerId, referredPlayerId, referralCode, bonusSc, bonusGc]
  );
};

export const completeReferralClaim = async (claimId: number) => {
  return query(
    `UPDATE referral_claims SET status = 'completed', claimed_at = NOW() WHERE id = $1 RETURNING *`,
    [claimId]
  );
};

export const getReferralStats = async (referrerId: number) => {
  return query(
    `SELECT
      rl.unique_code,
      COUNT(DISTINCT rc.referred_player_id) as total_referrals,
      SUM(CASE WHEN rc.status = 'completed' THEN 1 ELSE 0 END) as completed_referrals,
      SUM(rc.referral_bonus_sc) as total_sc_earned,
      SUM(rc.referral_bonus_gc) as total_gc_earned
     FROM referral_links rl
     LEFT JOIN referral_claims rc ON rl.referrer_id = rc.referrer_id
     WHERE rl.referrer_id = $1
     GROUP BY rl.unique_code`,
    [referrerId]
  );
};

export const getRecentReferrals = async (referrerId: number, limit = 10) => {
  return query(
    `SELECT
      rc.id,
      p.username,
      rc.status,
      rc.created_at as joined_at,
      rc.claimed_at
     FROM referral_claims rc
     JOIN players p ON rc.referred_player_id = p.id
     WHERE rc.referrer_id = $1
     ORDER BY rc.created_at DESC
     LIMIT $2`,
    [referrerId, limit]
  );
};

// ===== PAYMENT METHODS =====
export const createPaymentMethod = async (playerId: number, methodType: string, methodData: any) => {
  const { bankAccountHolder, bankName, accountNumber, routingNumber, accountType, paypalEmail, cashappHandle } = methodData;

  return query(
    `INSERT INTO player_payment_methods (player_id, method_type, bank_account_holder, bank_name, account_number, routing_number, account_type, paypal_email, cashapp_handle)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, player_id, method_type, is_primary, is_verified, created_at`,
    [playerId, methodType, bankAccountHolder, bankName, accountNumber, routingNumber, accountType, paypalEmail, cashappHandle]
  );
};

export const getPaymentMethods = async (playerId: number) => {
  return query(
    `SELECT id, player_id, method_type, is_primary, is_verified, paypal_email, cashapp_handle, bank_name, account_type, verified_at, last_used_at, created_at
     FROM player_payment_methods WHERE player_id = $1 ORDER BY is_primary DESC, created_at DESC`,
    [playerId]
  );
};

export const setPrimaryPaymentMethod = async (playerId: number, methodId: number) => {
  // First, unset all other methods as primary
  await query(
    `UPDATE player_payment_methods SET is_primary = FALSE WHERE player_id = $1`,
    [playerId]
  );

  // Then set the specified method as primary
  return query(
    `UPDATE player_payment_methods SET is_primary = TRUE WHERE id = $1 AND player_id = $2 RETURNING *`,
    [methodId, playerId]
  );
};

export const deletePaymentMethod = async (methodId: number, playerId: number) => {
  return query(
    `DELETE FROM player_payment_methods WHERE id = $1 AND player_id = $2 RETURNING *`,
    [methodId, playerId]
  );
};

// ===== SALES TRANSACTIONS =====
export const recordSalesTransaction = async (playerId: number, gameType: string, designId: number | null, purchaseCostSc: number, winAmountSc: number) => {
  const netAmount = purchaseCostSc - winAmountSc;

  return query(
    `INSERT INTO sales_transactions (player_id, game_type, design_id, purchase_cost_sc, win_amount_sc, net_amount_sc)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [playerId, gameType, designId, purchaseCostSc, winAmountSc, netAmount]
  );
};

export const getSalesStats = async (startDate: Date | null, endDate: Date | null) => {
  if (!startDate || !endDate) {
    return query(`
      SELECT
        DATE(created_at) as sale_date,
        game_type,
        COUNT(*) as total_sales,
        SUM(purchase_cost_sc) as total_revenue_sc,
        SUM(win_amount_sc) as total_payouts_sc,
        SUM(net_amount_sc) as net_profit_sc
      FROM sales_transactions
      GROUP BY DATE(created_at), game_type
      ORDER BY sale_date DESC
    `);
  }

  return query(
    `SELECT
      DATE(created_at) as sale_date,
      game_type,
      COUNT(*) as total_sales,
      SUM(purchase_cost_sc) as total_revenue_sc,
      SUM(win_amount_sc) as total_payouts_sc,
      SUM(net_amount_sc) as net_profit_sc
     FROM sales_transactions
     WHERE created_at >= $1 AND created_at <= $2
     GROUP BY DATE(created_at), game_type
     ORDER BY sale_date DESC`,
    [startDate, endDate]
  );
};

// ===== ADMIN NOTIFICATIONS =====
export const createAdminNotification = async (adminId: number | null, aiEmployeeId: string, messageType: string, subject: string, message: string, relatedPlayerId: number | null, relatedGameId: number | null, priority: string) => {
  return query(
    `INSERT INTO admin_notifications (admin_id, ai_employee_id, message_type, subject, message, related_player_id, related_game_id, priority, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
     RETURNING *`,
    [adminId, aiEmployeeId, messageType, subject, message, relatedPlayerId, relatedGameId, priority]
  );
};

export const getAdminNotifications = async (adminId: number | null, limit = 50) => {
  if (adminId === null) {
    return query(
      `SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
  }

  return query(
    `SELECT * FROM admin_notifications WHERE admin_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [adminId, limit]
  );
};

export const markAdminNotificationAsRead = async (notificationId: number) => {
  return query(
    `UPDATE admin_notifications SET read_at = NOW() WHERE id = $1 RETURNING *`,
    [notificationId]
  );
};

export const updateAdminNotificationStatus = async (notificationId: number, status: string) => {
  return query(
    `UPDATE admin_notifications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, notificationId]
  );
};

export const recordNotificationAction = async (notificationId: number, actionType: string, actionData: any, takenByAdminId: number) => {
  return query(
    `INSERT INTO notification_actions (notification_id, action_type, action_data, taken_by_admin_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [notificationId, actionType, JSON.stringify(actionData), takenByAdminId]
  );
};

// ===== BETTING LIMITS =====
export const getBettingLimits = async (gameType: string | null) => {
  if (gameType) {
    return query(
      `SELECT * FROM betting_limits_config WHERE game_type = $1`,
      [gameType]
    );
  }

  return query(`SELECT * FROM betting_limits_config ORDER BY game_type`);
};

export const updateBettingLimits = async (gameType: string, limits: any) => {
  const { minBetSc, maxBetSc, maxWinPerSpinSc, minRedemptionSc } = limits;

  return query(
    `UPDATE betting_limits_config
     SET min_bet_sc = $1, max_bet_sc = $2, max_win_per_spin_sc = $3, min_redemption_sc = $4, updated_at = NOW()
     WHERE game_type = $5
     RETURNING *`,
    [minBetSc, maxBetSc, maxWinPerSpinSc, minRedemptionSc, gameType]
  );
};

// ===== KYC ONBOARDING =====
export const createKYCOnboardingProgress = async (playerId: number) => {
  return query(
    `INSERT INTO kyc_onboarding_progress (player_id, current_step)
     VALUES ($1, 1)
     RETURNING *`,
    [playerId]
  );
};

export const getKYCOnboardingProgress = async (playerId: number) => {
  return query(
    `SELECT * FROM kyc_onboarding_progress WHERE player_id = $1`,
    [playerId]
  );
};

export const updateKYCOnboardingStep = async (playerId: number, step: number, verificationData: any) => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  updates.push(`current_step = $${paramIndex++}`);
  values.push(step);

  if (verificationData.identityVerified) {
    updates.push(`identity_verified = $${paramIndex++}`);
    values.push(true);
  }
  if (verificationData.addressVerified) {
    updates.push(`address_verified = $${paramIndex++}`);
    values.push(true);
  }
  if (verificationData.paymentVerified) {
    updates.push(`payment_verified = $${paramIndex++}`);
    values.push(true);
  }
  if (verificationData.emailVerified) {
    updates.push(`email_verified = $${paramIndex++}`);
    values.push(true);
  }
  if (verificationData.phoneVerified) {
    updates.push(`phone_verified = $${paramIndex++}`);
    values.push(true);
  }

  // Check if all verifications complete
  const checkQuery = await query(
    `SELECT identity_verified, address_verified, payment_verified, email_verified, phone_verified
     FROM kyc_onboarding_progress WHERE player_id = $1`,
    [playerId]
  );

  const allVerified = checkQuery.rows[0] &&
    checkQuery.rows[0].identity_verified &&
    checkQuery.rows[0].address_verified &&
    checkQuery.rows[0].payment_verified &&
    checkQuery.rows[0].email_verified &&
    checkQuery.rows[0].phone_verified;

  if (allVerified) {
    updates.push(`completed_at = $${paramIndex++}`);
    values.push(new Date());
  }

  updates.push(`last_prompted_at = NOW()`);
  updates.push(`updated_at = NOW()`);
  values.push(playerId);

  const sql = `UPDATE kyc_onboarding_progress SET ${updates.join(', ')} WHERE player_id = $${paramIndex} RETURNING *`;
  return query(sql, values);
};

// ===== USER MESSAGES =====
export const sendUserMessage = async (senderId: number, recipientId: number | null, adminId: number | null, subject: string, message: string, messageType: string) => {
  return query(
    `INSERT INTO user_messages (sender_id, recipient_id, admin_id, subject, message, message_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [senderId, recipientId, adminId, subject, message, messageType]
  );
};

export const getUserMessages = async (userId: number, limit = 50) => {
  return query(
    `SELECT * FROM user_messages
     WHERE (sender_id = $1 OR recipient_id = $1)
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
};

export const markMessageAsRead = async (messageId: number) => {
  return query(
    `UPDATE user_messages SET is_read = TRUE, read_at = NOW() WHERE id = $1 RETURNING *`,
    [messageId]
  );
};

export const getUnreadMessages = async (userId: number) => {
  return query(
    `SELECT * FROM user_messages
     WHERE recipient_id = $1 AND is_read = FALSE
     ORDER BY created_at DESC`,
    [userId]
  );
};

// ===== SOCIAL SHARING =====
export const recordSocialShare = async (playerId: number, gameId: number | null, winAmount: number, gameName: string, platform: string, message: string, shareLink: string | null) => {
  return query(
    `INSERT INTO social_shares (player_id, game_id, win_amount, game_name, platform, message, share_link)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [playerId, gameId, winAmount, gameName, platform, message, shareLink]
  );
};

export const getSocialShareHistory = async (playerId: number, limit = 50) => {
  return query(
    `SELECT * FROM social_shares
     WHERE player_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [playerId, limit]
  );
};

export const recordSocialShareResponse = async (socialShareId: number, responseType: string, responseData: any, respondentId: string | null) => {
  return query(
    `INSERT INTO social_share_responses (social_share_id, response_type, response_data, respondent_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [socialShareId, responseType, JSON.stringify(responseData), respondentId]
  );
};

export const getSocialShareStats = async () => {
  return query(
    `SELECT platform, COUNT(*) as share_count, SUM(win_amount) as total_win_amount
     FROM social_shares
     GROUP BY platform`
  );
};

// ===== AI CONVERSATIONS =====
export const saveAIMessage = async (playerId: number, sessionId: string, agentId: string, agentName: string, messageType: string, content: string, metadata?: any) => {
  return query(
    `INSERT INTO ai_conversation_history (player_id, session_id, agent_id, agent_name, message_type, message_content, message_metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [playerId, sessionId, agentId, agentName, messageType, content, JSON.stringify(metadata || {})]
  );
};

export const getConversationHistory = async (playerId: number, sessionId: string, limit = 50) => {
  return query(
    `SELECT * FROM ai_conversation_history
     WHERE player_id = $1 AND session_id = $2
     ORDER BY created_at ASC
     LIMIT $3`,
    [playerId, sessionId, limit]
  );
};

export const getConversationContext = async (playerId: number, sessionId: string, lastN = 10) => {
  return query(
    `SELECT id, agent_name, message_type, message_content, created_at
     FROM ai_conversation_history
     WHERE player_id = $1 AND session_id = $2
     ORDER BY created_at DESC
     LIMIT $3`,
    [playerId, sessionId, lastN]
  );
};

export const createConversationSession = async (playerId: number, sessionId: string, title?: string, topic?: string) => {
  return query(
    `INSERT INTO ai_conversation_sessions (player_id, session_id, title, topic, status)
     VALUES ($1, $2, $3, $4, 'active')
     ON CONFLICT (session_id) DO UPDATE SET updated_at = NOW(), last_interaction_at = NOW()
     RETURNING *`,
    [playerId, sessionId, title || 'Chat Session', topic || 'general']
  );
};

export const updateConversationSession = async (sessionId: string, updates: any) => {
  const keys = Object.keys(updates);
  const values = Object.values(updates);
  values.push(sessionId);

  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  return query(
    `UPDATE ai_conversation_sessions SET ${setClause}, updated_at = NOW(), last_interaction_at = NOW()
     WHERE session_id = $${keys.length + 1}
     RETURNING *`,
    values
  );
};

export const getPlayerSessions = async (playerId: number, limit = 20) => {
  return query(
    `SELECT * FROM ai_conversation_sessions
     WHERE player_id = $1 AND status != 'deleted'
     ORDER BY last_interaction_at DESC
     LIMIT $2`,
    [playerId, limit]
  );
};

export const getAIEmployeeById = async (id: string) => {
  return query(
    `SELECT * FROM ai_employees WHERE id = $1`,
    [id]
  );
};

export const updateAIAgentStatus = async (agentId: string, status: string, currentTask?: string) => {
  return query(
    `INSERT INTO ai_agent_status (agent_id, agent_name, status, current_task)
     SELECT $1, name, $2, $3 FROM ai_employees WHERE id = $1
     ON CONFLICT (agent_id) DO UPDATE SET status = $2, current_task = $3, updated_at = NOW()
     RETURNING *`,
    [agentId, status, currentTask || null]
  );
};

export const getAIAgentStatus = async (agentId?: string) => {
  if (agentId) {
    return query(
      `SELECT * FROM ai_agent_status WHERE agent_id = $1`,
      [agentId]
    );
  }
  return query(`SELECT * FROM ai_agent_status ORDER BY agent_name ASC`);
};

export const logContentFilter = async (playerId: number | null, originalMessage: string, filteredMessage: string, reason: string, severity: string, action: string) => {
  return query(
    `INSERT INTO ai_content_filter_logs (player_id, original_message, filtered_message, filter_reason, severity, action_taken)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [playerId, originalMessage, filteredMessage, reason, severity, action]
  );
};

export const checkRateLimit = async (playerId: number, endpoint: string, limit: number = 10, windowSeconds: number = 60) => {
  const windowStart = new Date(Date.now() - (windowSeconds * 1000));

  const result = await query(
    `SELECT request_count, window_start FROM ai_rate_limits
     WHERE player_id = $1 AND endpoint = $2 AND window_start > $3`,
    [playerId, endpoint, windowStart]
  );

  if (result.rows.length === 0) {
    // Create new window
    await query(
      `INSERT INTO ai_rate_limits (player_id, endpoint, request_count, window_start, window_end)
       VALUES ($1, $2, 1, NOW(), NOW() + INTERVAL '${windowSeconds} seconds')`,
      [playerId, endpoint]
    );
    return { allowed: true, remaining: limit - 1 };
  }

  const current = result.rows[0].request_count;
  if (current >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Increment counter
  await query(
    `UPDATE ai_rate_limits SET request_count = request_count + 1 WHERE player_id = $1 AND endpoint = $2`,
    [playerId, endpoint]
  );

  return { allowed: true, remaining: limit - current - 1 };
};
