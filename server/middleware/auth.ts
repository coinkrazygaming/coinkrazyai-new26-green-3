import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth-service';
import { query } from '../db/connection';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        playerId: number;
        username: string;
        email: string;
        role: 'player' | 'admin';
        token: string;
      };
    }
  }
}

// Middleware to verify player authentication
export const verifyPlayer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header or cookie
    const tokenFromHeader = req.headers.authorization?.replace('Bearer ', '');
    const tokenFromCookie = req.cookies?.auth_token;
    const token = tokenFromHeader || tokenFromCookie;

    const tokenSource = tokenFromHeader ? 'header' : tokenFromCookie ? 'cookie' : 'none';

    if (!token) {
      console.debug(`[Auth] /api${req.path} - No token found (source: ${tokenSource})`);
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check blacklist
    let blacklisted;
    try {
      blacklisted = await query('SELECT id FROM token_blacklist WHERE token = $1', [token]);
    } catch (err) {
      console.error(`[Auth] Error checking token blacklist`);
      return res.status(401).json({
        success: false,
        error: 'Authentication service error'
      });
    }

    if (blacklisted.rows.length > 0) {
      console.debug(`[Auth] /api${req.path} - Blacklisted token rejected`);
      return res.status(401).json({
        success: false,
        error: 'Token has been revoked'
      });
    }

    let decoded;
    try {
      decoded = AuthService.verifyJWT(token);
    } catch (err) {
      console.debug(`[Auth] /api${req.path} - JWT verification failed`);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    if (!decoded) {
      console.debug(`[Auth] /api${req.path} - Token verification returned null`);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    if (decoded.role !== 'player') {
      console.debug(`[Auth] /api${req.path} - Invalid role for player endpoint`);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Log authentication success without PII (no username or email)
    console.debug(`[Auth] ✓ Player authenticated (ID: ${decoded.playerId})`);

    // Attach user to request
    req.user = {
      id: decoded.playerId,
      playerId: decoded.playerId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      token
    };

    next();
  } catch (error) {
    console.error(`[Auth] Unexpected error during authentication - ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Middleware to verify admin authentication
export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header or cookie
    const tokenFromHeader = req.headers.authorization?.replace('Bearer ', '');
    const tokenFromCookie = req.cookies?.admin_token;
    const token = tokenFromHeader || tokenFromCookie;

    const tokenSource = tokenFromHeader ? 'header' : tokenFromCookie ? 'cookie' : 'none';

    if (!token) {
      console.debug(`[Admin Auth] /api${req.path} - No token found (source: ${tokenSource})`);
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required'
      });
    }

    // Check blacklist
    let blacklisted;
    try {
      blacklisted = await query('SELECT id FROM token_blacklist WHERE token = $1', [token]);
    } catch (err) {
      console.error(`[Admin Auth] Error checking token blacklist`);
      return res.status(401).json({
        success: false,
        error: 'Authentication service error'
      });
    }

    if (blacklisted.rows.length > 0) {
      console.debug(`[Admin Auth] /api${req.path} - Blacklisted token rejected`);
      return res.status(401).json({
        success: false,
        error: 'Token has been revoked'
      });
    }

    let decoded;
    try {
      decoded = AuthService.verifyJWT(token);
    } catch (err) {
      console.debug(`[Admin Auth] /api${req.path} - JWT verification failed`);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired admin token'
      });
    }

    if (!decoded) {
      console.debug(`[Admin Auth] /api${req.path} - Token verification returned null`);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired admin token'
      });
    }

    if (decoded.role !== 'admin') {
      console.debug(`[Admin Auth] /api${req.path} - Invalid role for admin endpoint`);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired admin token'
      });
    }

    // Log authentication success without PII
    console.debug(`[Admin Auth] ✓ Admin authenticated (ID: ${decoded.playerId})`);

    // Attach user to request
    req.user = {
      id: decoded.playerId,
      playerId: decoded.playerId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      token
    };

    next();
  } catch (error) {
    console.error(`[Admin Auth] Unexpected error during authentication - ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(401).json({
      success: false,
      error: 'Admin authentication failed'
    });
  }
};

// Optional auth middleware - continues even if not authenticated
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.auth_token;

    if (token) {
      // Check blacklist
      const blacklisted = await query('SELECT id FROM token_blacklist WHERE token = $1', [token]);
      if (blacklisted.rows.length === 0) {
        const decoded = AuthService.verifyJWT(token);
        if (decoded) {
          req.user = {
            id: decoded.playerId,
            playerId: decoded.playerId,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role,
            token
          };
        }
      }
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

// Flexible auth middleware - accepts either player or admin token
export const verifyPlayerOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Try player token first
    let tokenFromHeader = req.headers.authorization?.replace('Bearer ', '');
    let tokenFromCookie = req.cookies?.auth_token || req.cookies?.admin_token;
    let token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      console.debug(`[Auth] /api${req.path} - No token found`);
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check blacklist
    let blacklisted;
    try {
      blacklisted = await query('SELECT id FROM token_blacklist WHERE token = $1', [token]);
    } catch (err) {
      console.error(`[Auth] Error checking token blacklist`);
      return res.status(401).json({
        success: false,
        error: 'Authentication service error'
      });
    }

    if (blacklisted.rows.length > 0) {
      console.debug(`[Auth] /api${req.path} - Blacklisted token rejected`);
      return res.status(401).json({
        success: false,
        error: 'Token has been revoked'
      });
    }

    let decoded;
    try {
      decoded = AuthService.verifyJWT(token);
    } catch (err) {
      console.debug(`[Auth] /api${req.path} - JWT verification failed`);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    if (!decoded) {
      console.debug(`[Auth] /api${req.path} - Token verification returned null`);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Accept both player and admin roles
    if (decoded.role !== 'player' && decoded.role !== 'admin') {
      console.debug(`[Auth] /api${req.path} - Invalid role: ${decoded.role}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    console.debug(`[Auth] ✓ Authenticated (ID: ${decoded.playerId}, role: ${decoded.role})`);

    // Attach user to request
    req.user = {
      id: decoded.playerId,
      playerId: decoded.playerId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      token
    };

    next();
  } catch (error) {
    console.error(`[Auth] Unexpected error during authentication - ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};
