import { describe, it, expect } from 'vitest';

/**
 * Tests for AI game generation and parsing
 * Ensures robustness of AI response parsing and validation
 */

describe('AI Game Generation and Parsing', () => {
  /**
   * Helper function to simulate JSON extraction and parsing
   * (This mirrors the logic in generateGameWithAI and createGameFromAI)
   */
  function parseAIResponse(responseText: string) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseErr) {
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Helper function to sanitize game data
   * (This mirrors the sanitization logic)
   */
  function sanitizeGameData(gameData: any) {
    return {
      name: String(gameData.name || '').substring(0, 50),
      slug: String(gameData.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      category: ['Slots', 'Poker', 'Bingo', 'Sportsbook'].includes(gameData.category) ? gameData.category : 'Slots',
      type: gameData.type || 'slots',
      volatility: ['Low', 'Medium', 'High'].includes(gameData.volatility) ? gameData.volatility : 'Medium',
      rtp: Math.max(90, Math.min(98, parseFloat(gameData.rtp) || 96)),
      description: String(gameData.description || '').substring(0, 500),
      max_bet: Math.min(5, parseFloat(gameData.max_bet) || 5),
      min_bet: parseFloat(gameData.min_bet) || 0.1,
      image_url: gameData.image_url || '',
    };
  }

  describe('JSON Parsing', () => {
    it('should parse valid AI response', () => {
      const response = `{
        "name": "Fire Dragon Slots",
        "slug": "fire-dragon-slots",
        "category": "Slots",
        "type": "slots",
        "volatility": "High",
        "rtp": 96.5,
        "description": "Epic dragon-themed slot",
        "max_bet": 5,
        "min_bet": 0.1,
        "image_url": ""
      }`;

      const parsed = parseAIResponse(response);
      expect(parsed.name).toBe('Fire Dragon Slots');
      expect(parsed.rtp).toBe(96.5);
    });

    it('should extract JSON from markdown code blocks', () => {
      const response = `Here's your game design:
\`\`\`json
{
  "name": "Viking Quest",
  "slug": "viking-quest",
  "category": "Slots",
  "type": "slots",
  "volatility": "Medium",
  "rtp": 95.0,
  "description": "Norse mythology adventure",
  "max_bet": 5,
  "min_bet": 0.1,
  "image_url": ""
}
\`\`\`
`;

      const parsed = parseAIResponse(response);
      expect(parsed.name).toBe('Viking Quest');
    });

    it('should handle JSON with extra whitespace', () => {
      const response = `{
        "name"  :  "Treasure Hunt"  ,
        "slug": "treasure-hunt",
        "category": "Slots",
        "type": "slots",
        "volatility": "Low",
        "rtp": 94.0,
        "description": "Pirate themed adventure",
        "max_bet": 5,
        "min_bet": 0.1,
        "image_url": ""
      }`;

      const parsed = parseAIResponse(response);
      expect(parsed.name).toBe('Treasure Hunt');
    });

    it('should handle partial JSON responses', () => {
      const response = `Based on your description, here's the game:
{
  "name": "Jungle Rush",
  "slug": "jungle-rush",
  "category": "Slots",
  "type": "slots",
  "volatility": "High",
  "rtp": 97.0,
  "description": "Adventure in the jungle",
  "max_bet": 5,
  "min_bet": 0.1,
  "image_url": ""
}
That should work great!`;

      const parsed = parseAIResponse(response);
      expect(parsed.name).toBe('Jungle Rush');
    });

    it('should reject invalid JSON', () => {
      const response = `{
        "name": "Broken Game",
        "slug": "broken",
        ...invalid json...
      }`;

      expect(() => parseAIResponse(response)).toThrow();
    });

    it('should reject responses without JSON', () => {
      const response = `I can't generate that game for you.`;

      expect(() => parseAIResponse(response)).toThrow();
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should sanitize valid game data', () => {
      const gameData = {
        name: 'Casino Royale',
        slug: 'casino-royale',
        category: 'Slots',
        type: 'slots',
        volatility: 'Medium',
        rtp: 95.5,
        description: 'James Bond themed slot machine',
        max_bet: 5,
        min_bet: 0.1,
        image_url: 'https://example.com/game.png'
      };

      const sanitized = sanitizeGameData(gameData);

      expect(sanitized.name).toBe('Casino Royale');
      expect(sanitized.category).toBe('Slots');
      expect(sanitized.rtp).toBe(95.5);
    });

    it('should truncate long game names', () => {
      const gameData = {
        name: 'A'.repeat(100), // 100 characters
        slug: 'long-game',
        category: 'Slots',
        type: 'slots',
        volatility: 'Medium',
        rtp: 95,
        description: 'Test',
        max_bet: 5,
        min_bet: 0.1,
        image_url: ''
      };

      const sanitized = sanitizeGameData(gameData);
      expect(sanitized.name.length).toBeLessThanOrEqual(50);
    });

    it('should sanitize slug to lowercase with hyphens only', () => {
      const gameData = {
        name: 'Game Name',
        slug: 'Game-Name_123!@#',
        category: 'Slots',
        type: 'slots',
        volatility: 'Medium',
        rtp: 95,
        description: 'Test',
        max_bet: 5,
        min_bet: 0.1,
        image_url: ''
      };

      const sanitized = sanitizeGameData(gameData);
      expect(sanitized.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should clamp RTP to valid range (90-98)', () => {
      const testCases = [
        { input: 50, expected: 90 },
        { input: 95.5, expected: 95.5 },
        { input: 150, expected: 98 },
        { input: -10, expected: 90 }
      ];

      testCases.forEach(testCase => {
        const gameData = {
          name: 'Test Game',
          slug: 'test',
          category: 'Slots',
          type: 'slots',
          volatility: 'Medium',
          rtp: testCase.input,
          description: 'Test',
          max_bet: 5,
          min_bet: 0.1,
          image_url: ''
        };

        const sanitized = sanitizeGameData(gameData);
        expect(sanitized.rtp).toBe(testCase.expected);
      });
    });

    it('should clamp max_bet to 5 maximum', () => {
      const gameData = {
        name: 'Test Game',
        slug: 'test',
        category: 'Slots',
        type: 'slots',
        volatility: 'Medium',
        rtp: 95,
        description: 'Test',
        max_bet: 100, // Way too high
        min_bet: 0.1,
        image_url: ''
      };

      const sanitized = sanitizeGameData(gameData);
      expect(sanitized.max_bet).toBe(5);
    });

    it('should default missing volatility to Medium', () => {
      const gameData = {
        name: 'Test Game',
        slug: 'test',
        category: 'Slots',
        type: 'slots',
        // volatility missing
        rtp: 95,
        description: 'Test',
        max_bet: 5,
        min_bet: 0.1,
        image_url: ''
      };

      const sanitized = sanitizeGameData(gameData);
      expect(sanitized.volatility).toBe('Medium');
    });

    it('should default invalid category to Slots', () => {
      const gameData = {
        name: 'Test Game',
        slug: 'test',
        category: 'InvalidCategory',
        type: 'slots',
        volatility: 'Medium',
        rtp: 95,
        description: 'Test',
        max_bet: 5,
        min_bet: 0.1,
        image_url: ''
      };

      const sanitized = sanitizeGameData(gameData);
      expect(sanitized.category).toBe('Slots');
    });

    it('should accept valid categories', () => {
      const validCategories = ['Slots', 'Poker', 'Bingo', 'Sportsbook'];

      validCategories.forEach(category => {
        const gameData = {
          name: 'Test Game',
          slug: 'test',
          category,
          type: 'slots',
          volatility: 'Medium',
          rtp: 95,
          description: 'Test',
          max_bet: 5,
          min_bet: 0.1,
          image_url: ''
        };

        const sanitized = sanitizeGameData(gameData);
        expect(sanitized.category).toBe(category);
      });
    });

    it('should handle empty or missing fields gracefully', () => {
      const gameData = {
        name: null,
        slug: undefined,
        // Missing category
        // Missing type
        volatility: 'Invalid',
        // Missing rtp
        description: null,
        max_bet: null,
        min_bet: null,
        // Missing image_url
      };

      const sanitized = sanitizeGameData(gameData);

      expect(sanitized.name).toBe('');
      expect(sanitized.category).toBe('Slots');
      expect(sanitized.rtp).toBe(96);
      expect(sanitized.min_bet).toBe(0.1);
      expect(sanitized.image_url).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle game names with special characters', () => {
      const gameData = {
        name: 'Game™ with © symbols & special chars',
        slug: 'game-slug',
        category: 'Slots',
        type: 'slots',
        volatility: 'Medium',
        rtp: 95,
        description: 'Test',
        max_bet: 5,
        min_bet: 0.1,
        image_url: ''
      };

      const sanitized = sanitizeGameData(gameData);
      expect(sanitized.name.length).toBeLessThanOrEqual(50);
    });

    it('should handle extremely long descriptions', () => {
      const gameData = {
        name: 'Test Game',
        slug: 'test',
        category: 'Slots',
        type: 'slots',
        volatility: 'Medium',
        rtp: 95,
        description: 'X'.repeat(1000),
        max_bet: 5,
        min_bet: 0.1,
        image_url: ''
      };

      const sanitized = sanitizeGameData(gameData);
      expect(sanitized.description.length).toBeLessThanOrEqual(500);
    });

    it('should handle floating point RTP values', () => {
      const gameData = {
        name: 'Test Game',
        slug: 'test',
        category: 'Slots',
        type: 'slots',
        volatility: 'Medium',
        rtp: 95.5555555,
        description: 'Test',
        max_bet: 5,
        min_bet: 0.1,
        image_url: ''
      };

      const sanitized = sanitizeGameData(gameData);
      expect(sanitized.rtp).toBe(95.5555555);
      expect(sanitized.rtp).toBeGreaterThanOrEqual(90);
      expect(sanitized.rtp).toBeLessThanOrEqual(98);
    });

    it('should handle numeric strings for RTP', () => {
      const gameData = {
        name: 'Test Game',
        slug: 'test',
        category: 'Slots',
        type: 'slots',
        volatility: 'Medium',
        rtp: '95.5' as any,
        description: 'Test',
        max_bet: '5' as any,
        min_bet: '0.1' as any,
        image_url: ''
      };

      const sanitized = sanitizeGameData(gameData);
      expect(sanitized.rtp).toBe(95.5);
      expect(sanitized.max_bet).toBe(5);
      expect(sanitized.min_bet).toBe(0.1);
    });
  });

  describe('Full Pipeline Tests', () => {
    it('should handle complete generate-then-sanitize flow', () => {
      const aiResponse = `{
        "name": "Mystical Forest",
        "slug": "mystical-forest",
        "category": "Slots",
        "type": "slots",
        "volatility": "Low",
        "rtp": 94.2,
        "description": "Explore an enchanted forest with magical creatures",
        "max_bet": 4.5,
        "min_bet": 0.25,
        "image_url": ""
      }`;

      const parsed = parseAIResponse(aiResponse);
      const sanitized = sanitizeGameData(parsed);

      expect(sanitized.name).toBe('Mystical Forest');
      expect(sanitized.category).toBe('Slots');
      expect(sanitized.rtp).toBe(94.2);
      expect(sanitized.volatility).toBe('Low');
    });
  });
});
