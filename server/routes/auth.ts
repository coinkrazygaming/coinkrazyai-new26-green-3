import { RequestHandler } from 'express';
import { AuthService } from '../services/auth-service';
import { asyncHandler } from '../middleware/error-handler';
import * as bcrypt from 'bcrypt';

// Register new player
export const handleRegister: RequestHandler = asyncHandler(async (req, res) => {
  const { username, name, email, password, referralCode } = req.body;

  const result = await AuthService.registerPlayer(username, name, email, password);

  if (!result.success) {
    return res.status(400).json(result);
  }

  const player = result.player;

  // Handle referral if code present
  if (referralCode) {
    try {
      const dbQueries = await import('../db/queries');
      const linkResult = await dbQueries.getReferralLinkByCode(referralCode);
      if (linkResult.rows.length > 0) {
        const referralLink = linkResult.rows[0];
        const referrerId = referralLink.referrer_id;

        // Create referral claim (pending until first purchase)
        await dbQueries.createReferralClaim(
          referrerId,
          player.id,
          referralCode,
          5.00, // Reward for referrer
          10000 // GC Reward
        );
        console.log(`[Referral] Recorded referral for player ${player.id} from referrer ${referrerId}`);
      }
    } catch (e) {
      console.warn('[Referral] Failed to process referral code:', e);
    }
  }

  // Set auth cookie
  res.cookie('auth_token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(201).json({
    success: true,
    data: {
      token: result.token,
      player: result.player
    }
  });
});

// Login player
export const handleLogin: RequestHandler = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const result = await AuthService.loginPlayer(username, password);

  if (!result.success) {
    return res.status(401).json(result);
  }

  // Set auth cookie
  res.cookie('auth_token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    data: {
      token: result.token,
      player: result.player
    }
  });
});

// Verify admin session (check if admin_token is valid)
export const handleVerifyAdminSession: RequestHandler = asyncHandler(async (req, res) => {
  try {
    // Get admin token from cookie
    const adminToken = req.cookies?.admin_token;

    if (!adminToken) {
      return res.status(401).json({
        success: false,
        error: 'No admin session'
      });
    }

    // Verify the token
    const decoded = AuthService.verifyJWT(adminToken);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin token'
      });
    }

    // Check if token is blacklisted
    const blacklisted = await query('SELECT id FROM token_blacklist WHERE token = $1', [adminToken]);
    if (blacklisted.rows.length > 0) {
      return res.status(401).json({
        success: false,
        error: 'Admin token revoked'
      });
    }

    // Token is valid
    res.json({
      success: true,
      isAdmin: true,
      decoded
    });
  } catch (error: any) {
    console.debug('[Auth] Admin session verification failed:', error.message);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired admin session'
    });
  }
});

// Admin login - with sitewide admin recognition
export const handleAdminLogin: RequestHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await AuthService.loginAdmin(email, password);

  if (!result.success) {
    return res.status(401).json(result);
  }

  // Set admin cookie
  res.cookie('admin_token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  // Try to find a player account with the same email (sitewide admin recognition)
  let playerProfile = null;
  let playerToken = null;

  try {
    const dbQueries = await import('../db/queries');
    const playerResult = await dbQueries.getPlayerByEmail(email);

    if (playerResult.rows.length > 0) {
      const player = playerResult.rows[0];
      // Generate a player token for sitewide access
      playerToken = AuthService.generateJWT({
        playerId: player.id,
        username: player.username,
        email: player.email,
        role: 'player'
      }, false);

      // Set auth cookie for the player account too
      res.cookie('auth_token', playerToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      playerProfile = {
        id: player.id,
        username: player.username,
        name: player.name,
        email: player.email,
        gc_balance: player.gc_balance,
        sc_balance: player.sc_balance,
        status: player.status,
        kyc_level: player.kyc_level,
        kyc_verified: player.kyc_verified,
        created_at: player.created_at,
        last_login: player.last_login
      };
    }
  } catch (e) {
    console.warn('[Auth] Could not find associated player account for admin');
  }

  res.json({
    success: true,
    admin: result.admin,
    playerProfile: playerProfile || null,
    isSitewideAdmin: !!playerProfile
  });
});

// Get current player profile
export const handleGetProfile: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  const profile = await AuthService.getPlayerProfile(req.user.playerId);

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: 'Player not found'
    });
  }

  // Check if they also have an admin session
  const isAdmin = req.cookies?.admin_token ? true : false;

  res.json({
    success: true,
    data: {
      ...profile,
      role: req.user.role,
      isAdmin: isAdmin || req.user.role === 'admin'
    }
  });
});

// Update player profile
export const handleUpdateProfile: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  const { name, email, password } = req.body;

  const updates: any = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (password) updates.password = password;

  const updated = await AuthService.updatePlayerProfile(req.user.playerId, updates);

  res.json({
    success: true,
    data: updated
  });
});

// Logout player
export const handleLogout: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  // Revoke token in database
  await AuthService.logoutPlayer(req.user.token);

  // Clear cookies
  res.clearCookie('auth_token');
  res.clearCookie('admin_token');

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// DEBUG: Check if test users exist (for debugging login issues)
export const handleDebugCheckUsers: RequestHandler = asyncHandler(async (req, res) => {
  const testUsers = ['johndoe', 'janesmith', 'mikejohnson', 'sarahwilson', 'tombrown'];
  const results: any[] = [];

  for (const username of testUsers) {
    try {
      const userResult = await (await import('../db/queries')).getPlayerByUsername(username);
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        results.push({
          username: user.username,
          name: user.name,
          email: user.email,
          status: user.status,
          hasPasswordHash: !!user.password_hash,
          createdAt: user.created_at
        });
      } else {
        results.push({
          username,
          found: false
        });
      }
    } catch (err) {
      results.push({
        username,
        error: (err as Error).message
      });
    }
  }

  res.json({
    success: true,
    message: 'Test user check complete',
    testUsersAvailable: results,
    hint: 'Test credentials - username: johndoe, password: testpass123'
  });
});

// DEBUG: Re-seed test users (for fixing login issues)
export const handleDebugReseedUsers: RequestHandler = asyncHandler(async (req, res) => {
  const dbQueries = await import('../db/queries');
  const { query: dbQuery } = await import('../db/connection');

  // Hash password for test users
  const playerPassword = await bcrypt.hash('testpass123', 10);

  const testPlayers: any[] = [
    ['johndoe', 'John Doe', 'john@example.com', playerPassword, 5250, 125, 'Active', 'Full', true],
    ['janesmith', 'Jane Smith', 'jane@example.com', playerPassword, 12000, 340, 'Active', 'Full', true],
    ['mikejohnson', 'Mike Johnson', 'mike@example.com', playerPassword, 2100, 89, 'Active', 'Intermediate', true],
    ['sarahwilson', 'Sarah Wilson', 'sarah@example.com', playerPassword, 8500, 215, 'Active', 'Full', true],
  ];

  let created = 0;
  let updated = 0;

  for (const playerData of testPlayers) {
    try {
      // Check if player exists
      const existingResult = await dbQueries.getPlayerByUsername(playerData[0]);

      if (existingResult.rows.length > 0) {
        // Update existing player with password hash
        await dbQuery(
          `UPDATE players SET password_hash = $1, status = $2 WHERE username = $3`,
          [playerData[3], playerData[6], playerData[0]]
        );
        updated++;
        console.log(`[Auth] Updated user: ${playerData[0]}`);
      } else {
        // Insert new player
        await dbQuery(
          `INSERT INTO players (username, name, email, password_hash, gc_balance, sc_balance, status, kyc_level, kyc_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          playerData
        );
        created++;
        console.log(`[Auth] Created user: ${playerData[0]}`);
      }
    } catch (err: any) {
      console.error(`[Auth] Error processing user ${playerData[0]}:`, err.message);
    }
  }

  res.json({
    success: true,
    message: `Reseeded test users - Created: ${created}, Updated: ${updated}`,
    testCredentials: {
      username: 'johndoe',
      password: 'testpass123'
    }
  });
});
