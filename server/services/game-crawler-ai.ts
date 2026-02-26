import axios from 'axios';
import * as cheerio from 'cheerio';
import { query } from '../db/connection';
import { emitAIEvent } from '../socket';

export interface CrawledGameData {
  name: string;
  theme: string;
  artStyle: string;
  mechanics: string[];
  payTable: any;
  bonusRounds: string[];
  rtp: number;
  volatility: string;
  sounds: string[];
  animations: string[];
  uiColors: string[];
  uiFonts: string[];
  features: string[];
}

export class GameCrawlerAI {
  static async crawlGameFromURL(url: string): Promise<CrawledGameData> {
    try {
      console.log(`[GameCrawler] Crawling game from URL: ${url}`);

      // Fetch the page
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const css = response.data;

      // Extract game information from meta tags and page structure
      const gameName = this.extractGameName($);
      const theme = this.extractTheme($, css);
      const mechanics = this.extractMechanics($);
      const payTable = this.extractPayTable($);
      const bonusRounds = this.extractBonusRounds($);
      const volatility = this.extractVolatility($);
      const sounds = this.extractSounds($);
      const animations = this.extractAnimations($);
      const colors = this.extractColors($, css);
      const fonts = this.extractFonts($, css);
      const features = this.extractFeatures($);

      const crawledData: CrawledGameData = {
        name: gameName,
        theme,
        artStyle: theme,
        mechanics,
        payTable,
        bonusRounds,
        rtp: this.extractRTP($),
        volatility,
        sounds,
        animations,
        uiColors: colors,
        uiFonts: fonts,
        features,
      };

      console.log(`[GameCrawler] Successfully crawled game: ${gameName}`);
      emitAIEvent('game_crawled', {
        url,
        gameName,
        dataExtracted: Object.keys(crawledData).length,
      });

      return crawledData;
    } catch (error) {
      console.error(`[GameCrawler] Error crawling URL: ${error}`);
      throw new Error(`Failed to crawl game from URL: ${(error as Error).message}`);
    }
  }

  static rebrandGameData(
    crawledData: CrawledGameData,
    newBrandName: string = 'PlayCoinKrazy'
  ): any {
    console.log(`[GameCrawler] Rebranding game: ${crawledData.name} -> ${newBrandName} Studios`);

    return {
      name: `${newBrandName}: ${crawledData.name}`,
      slug: `${newBrandName.toLowerCase()}-${crawledData.name
        .toLowerCase()
        .replace(/\s+/g, '-')}`,
      description: `A ${crawledData.theme} slot game brought to you by ${newBrandName} Studios`,
      provider: `${newBrandName} Studios`,
      category: 'Slots',
      type: 'slots',
      theme: crawledData.theme,
      art_style: crawledData.artStyle,
      mechanics: crawledData.mechanics,
      paytable: crawledData.payTable,
      bonus_rounds: crawledData.bonusRounds,
      rtp: Math.round(crawledData.rtp * 10) / 10,
      volatility: crawledData.volatility,
      sounds: crawledData.sounds,
      animations: crawledData.animations,
      ui_colors: crawledData.uiColors,
      ui_fonts: crawledData.uiFonts,
      features: crawledData.features,
      branded: true,
      brand_name: newBrandName,
      branding_config: {
        logo: `${newBrandName} Studios`,
        watermark: `Brought to you by ${newBrandName}`,
        splash_screen: `${newBrandName} Studios Presents`,
        theme_colors: {
          primary: '#FF8C00', // Orange
          secondary: '#DC2626', // Red
          accent: '#FFA500', // Light Orange
        },
      },
      min_bet: 0.1,
      max_bet: 5,
      max_win_amount: 10, // SC cap
      enabled: true,
    };
  }

  private static extractGameName($: any): string {
    // Try multiple selectors for game name
    const selectors = [
      'h1',
      '[data-game-name]',
      '.game-title',
      '[class*="title"]',
      'meta[property="og:title"]',
    ];

    for (const selector of selectors) {
      const elem = $(selector).first();
      if (elem.length > 0) {
        const text = elem.attr('content') || elem.text();
        if (text && text.length > 0) {
          return text.trim().substring(0, 255);
        }
      }
    }

    return 'Unknown Game';
  }

  private static extractTheme($: any): string {
    const content = $('body').html();
    const themes = [
      'Egyptian',
      'Fantasy',
      'Underwater',
      'Fire',
      'Space',
      'Wildlife',
      'Ancient',
      'Modern',
    ];

    for (const theme of themes) {
      if (
        content?.toLowerCase().includes(theme.toLowerCase()) ||
        $(`[class*="${theme.toLowerCase()}"]`).length > 0
      ) {
        return theme;
      }
    }

    return 'Modern Casino';
  }

  private static extractMechanics($: any): string[] {
    const mechanics: string[] = [];
    const content = $('body').text().toLowerCase();

    const mechanicKeywords: { [key: string]: string[] } = {
      'Free Spins': ['free spin', 'bonus spin'],
      'Bonus Round': ['bonus round', 'bonus game'],
      'Wild Symbols': ['wild', 'substitute'],
      'Scatter Symbols': ['scatter'],
      Multipliers: ['multiplier', 'x2', 'x3', 'x5'],
      'Expanding Reels': ['expanding', 'expanding reel'],
      'Cascading Reels': ['cascade', 'cascading'],
    };

    for (const [mechanic, keywords] of Object.entries(mechanicKeywords)) {
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          mechanics.push(mechanic);
          break;
        }
      }
    }

    return mechanics.length > 0 ? mechanics : ['Standard Reels'];
  }

  private static extractPayTable($: any): any {
    // Extract pay table if visible
    const payTableElement = $(
      '[class*="paytable"], [class*="pay-table"], table'
    ).first();

    if (payTableElement.length > 0) {
      return { description: 'Dynamic paytable extracted from game' };
    }

    return { description: 'Standard paytable' };
  }

  private static extractBonusRounds($: any): string[] {
    const bonuses: string[] = [];
    const content = $('body').text().toLowerCase();

    if (content.includes('free spin')) bonuses.push('Free Spins');
    if (content.includes('bonus game')) bonuses.push('Bonus Game');
    if (content.includes('jackpot')) bonuses.push('Progressive Jackpot');
    if (content.includes('multiplier')) bonuses.push('Multiplier Bonus');

    return bonuses.length > 0 ? bonuses : ['Standard Payouts'];
  }

  private static extractRTP($: any): number {
    const content = $('body').text();
    const rtpMatch = content.match(/(\d{2}(?:\.\d{1})?)\s*%?\s*RTP/i);

    if (rtpMatch && rtpMatch[1]) {
      const rtp = parseFloat(rtpMatch[1]);
      return rtp >= 90 && rtp <= 98 ? rtp : 96;
    }

    return 96;
  }

  private static extractVolatility($: any): string {
    const content = $('body').text().toLowerCase();

    if (content.includes('low volatility') || content.includes('low variance')) {
      return 'Low';
    } else if (
      content.includes('high volatility') ||
      content.includes('high variance')
    ) {
      return 'High';
    }

    return 'Medium';
  }

  private static extractSounds($: any): string[] {
    const sounds: string[] = [];
    const audioElements = $('audio, [class*="sound"], [class*="audio"]');

    if (audioElements.length > 0) {
      sounds.push('Spin Sound', 'Win Sound', 'Bonus Sound');
    }

    return sounds.length > 0 ? sounds : ['Standard Sounds'];
  }

  private static extractAnimations($: any): string[] {
    const animations = [
      'Reel Spin Animation',
      'Win Celebration',
      'Symbol Appearance',
    ];

    // Check for animation-related classes
    const htmlStr = $('body').html();
    if (htmlStr?.includes('animate') || htmlStr?.includes('animation')) {
      animations.push('Smooth Transitions', 'Particle Effects');
    }

    return animations;
  }

  private static extractColors($: any, css: string): string[] {
    const colors: string[] = [];
    const colorPattern = /#[0-9a-fA-F]{6}\b/g;
    const matches = css.match(colorPattern);

    if (matches) {
      colors.push(...[...new Set(matches)].slice(0, 5));
    }

    // Also check for named colors in CSS
    const namedColorPattern = /(blue|red|green|gold|orange|purple)/gi;
    const namedMatches = css.match(namedColorPattern);
    if (namedMatches) {
      colors.push(...[...new Set(namedMatches.map((c) => c.toLowerCase()))]);
    }

    return colors.slice(0, 8);
  }

  private static extractFonts($: any, css: string): string[] {
    const fonts: string[] = [];
    const fontPattern =
      /font-family:\s*['"]?([^,;'"]+)['"]?[,;]/gi;
    const matches = css.matchAll(fontPattern);

    for (const match of matches) {
      const font = match[1]?.trim();
      if (font && font.length > 0) {
        fonts.push(font);
      }
    }

    return [...new Set(fonts)].slice(0, 3);
  }

  private static extractFeatures($: any): string[] {
    const features: string[] = [];
    const content = $('body').text().toLowerCase();

    const featureKeywords: { [key: string]: string[] } = {
      'Auto Play': ['auto play', 'autoplay'],
      'Turbo Mode': ['turbo mode', 'fast play'],
      'Mobile Optimized': ['mobile', 'responsive'],
      'High RTP': ['96', '97', '98'],
      'Low House Edge': ['house edge', 'low edge'],
      'Instant Play': ['instant play', 'no download'],
    };

    for (const [feature, keywords] of Object.entries(featureKeywords)) {
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          features.push(feature);
          break;
        }
      }
    }

    return features.length > 0
      ? features
      : ['Standard Game Features'];
  }

  // Save crawled game to database
  static async saveGameToDatabase(brandedData: any): Promise<any> {
    try {
      const result = await query(
        `INSERT INTO games (name, slug, category, provider, rtp, volatility, description, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          brandedData.name,
          brandedData.slug,
          brandedData.category,
          brandedData.provider,
          brandedData.rtp,
          brandedData.volatility,
          brandedData.description,
          brandedData.enabled,
        ]
      );

      console.log(`[GameCrawler] Game saved to database: ${brandedData.name}`);
      return result.rows[0];
    } catch (error) {
      console.error(`[GameCrawler] Error saving game: ${error}`);
      throw error;
    }
  }
}
