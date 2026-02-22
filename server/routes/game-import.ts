import { RequestHandler } from "express";
import { query } from "../db/connection";

// Game data to import
const GAMES_TO_ADD = [
  {
    title: 'Emerald King Wheel of Wealth',
    provider: 'Reel Kingdom',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2025/12/emerald-king-wheel-of-wealth-logo.jpg',
    game_url: 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?stylename=demo_clienthub&lang=en&cur=USD&websiteUrl=https%3A%2F%2Fclienthub.pragmaticplay.com%2Fru%2F&gcpif=2273&gameSymbol=vs10dublin&jurisdiction=99',
    rtp: 96.5,
    enabled: true,
  },
  {
    title: 'Lucky Tiger Gold',
    provider: 'Fat Panda',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2026/02/lucky-tiger-gold-logo.jpg',
    game_url: 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?stylename=demo_clienthub&lang=en&cur=USD&websiteUrl=https%3A%2F%2Fclienthub.pragmaticplay.com%2Fru%2F&gcpif=2273&gameSymbol=vs5luckytru&jurisdiction=99',
    rtp: 96.0,
    enabled: true,
  },
  {
    title: '3 Blades & Blessings',
    provider: 'Play\'n GO',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2026/01/3-blades-blessings-logo.jpg',
    game_url: 'https://released.playngonetwork.com/casino/ContainerLauncher?pid=2&gid=3bladesandblessings&lang=en_GB&practice=1&channel=desktop&demo=2',
    rtp: 96.2,
    enabled: true,
  },
  {
    title: 'Arcanum',
    provider: 'ELK Studios',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2025/11/arcanum-logo.jpg',
    game_url: 'https://static-stage.contentmedia.eu/ecf3/index.html?gameid=10256&operatorid=44&currency=EUR&mode=demo&device=desktop&gamename=arcanum&language=en_gb&xdm=1&capi=https%3A%2F%2Fgc5-stage.contentmedia.eu%2Fcapi&papi=https%3A%2F%2Fpapi-stage.contentmedia.eu',
    rtp: 96.3,
    enabled: true,
  },
  {
    title: 'Bunny Heist',
    provider: 'Peter & Sons',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2026/02/bunny-heist-logo.jpg',
    game_url: 'https://peterandsons.org/launcher.html?gameId=bunny-heist',
    rtp: 95.8,
    enabled: true,
  },
  {
    title: 'Dragon Boyz',
    provider: 'Red Tiger Gaming',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2025/12/dragon-boyz-logo.jpg',
    game_url: 'https://playin.com/embed/v1/demo/dragonboyz000000',
    rtp: 96.1,
    enabled: true,
  },
  {
    title: 'Knights vs Barbarians',
    provider: 'Pragmatic Play',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2025/12/knights-vs-barbarians-logo-1.jpg',
    game_url: 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?stylename=demo_clienthub&lang=en&cur=USD&websiteUrl=https%3A%2F%2Fclienthub.pragmaticplay.com%2F&gcpif=2273&gameSymbol=vs10cenrlgdevl&jurisdiction=99&lobbyUrl=https://clienthub.pragmaticplay.com/slots/game-library/',
    rtp: 96.4,
    enabled: true,
  },
  {
    title: 'Love Show',
    provider: 'Endorphina',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2026/02/love-show-logo.jpg',
    game_url: 'https://endorphina.com/games/love-show/play',
    rtp: 96.0,
    enabled: true,
  },
  {
    title: 'Once Again upon a Time',
    provider: 'Betsoft',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2026/01/once-again-upon-a-time-logo.jpg',
    game_url: 'http://democasino.betsoftgaming.com/cwguestlogin.do?bankId=675&CDN=AUTO&gameId=996',
    rtp: 96.2,
    enabled: true,
  },
  {
    title: 'Once Upon a Time',
    provider: 'Betsoft',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2010/01/once-upon-a-time-logo.jpg',
    game_url: 'https://democasino.betsoftgaming.com/cwguestlogin.do?bankId=675&CDN=AUTO&gameId=792',
    rtp: 96.0,
    enabled: true,
  },
  {
    title: 'Shippy D Pop',
    provider: 'AvatarUX',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2026/02/shippy-d-pop-logo.jpg',
    game_url: 'https://cdn-replay-eu.avatarux.app/shippy-d-pop/index.html?game=shippy-d-pop&wallet=demo&operator=demo&key=&server=https%3A%2F%2Freplay-eu.avatarux.app&language=en&provider=avatarux&channel=desktop&rgs=avatarux-rgs',
    rtp: 95.9,
    enabled: true,
  },
  {
    title: 'Sticky Wild: Farm 51',
    provider: 'Gamebeat',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/themes/clashofslots/images/slot_upcoming_thumb.svg',
    game_url: 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?stylename=demo_clienthub&lang=en&cur=USD&websiteUrl=https%3A%2F%2Fclienthub.pragmaticplay.com%2F&gcpif=2273&gameSymbol=vs25buffalo',
    rtp: 96.0,
    enabled: true,
  },
  {
    title: 'Zeus Ze Zecond',
    provider: 'Hacksaw Gaming',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2025/11/zeus-ze-zecond-logo.jpg',
    game_url: 'https://static-live.hacksawgaming.com/launcher/static-launcher.html?gameid=2077&channel=desktop&language=en&partner=bigwinboard&mode=demo&token=123',
    rtp: 96.3,
    enabled: true,
  },
  {
    title: 'Only Diamonds',
    provider: 'Gamzix',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2026/02/only-diamonds-logo.jpg',
    game_url: 'https://link.gamzix.com/Only-Diamonds',
    rtp: 96.1,
    enabled: true,
  },
  {
    title: 'Red Hot Multipliers',
    provider: 'Push Gaming',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2025/11/red-hot-multipliers-logo.jpg',
    game_url: 'https://player.eu.demo.pushgaming.com/hive/b2c/game/redhotmultipliers-96/client/index.html?igpCode=pg-com&guest=true&mode=demo&lang=en&country=GB&meshSessionId=d2f5550c-8ab5-456e-b939-d357931ed636&ccyCode=fun&authToken=fae0ae82-cd2b-4d07-a0da-865496095a22&jurisdiction=NA',
    rtp: 95.8,
    enabled: true,
  },
  {
    title: 'Snack Me Up!',
    provider: 'Mancala Gaming',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2026/02/snack-me-up-logo.jpg',
    game_url: 'https://slots.mancala66.com/?gameid=77002',
    rtp: 96.2,
    enabled: true,
  },
  {
    title: 'Fortune Love',
    provider: 'Amigo Gaming',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2026/02/fortune-love-logo.jpg',
    game_url: 'https://demo.amigogaming.cloud/games-alt-wgl/amigo/FortuneLove/index.html?session=4448DC12B436427D949A5446426D12DE&sign=b445c25b6f0c55555fa89b799d543884&endpointUri=wss://sdemo.amigogaming.cloud/organic2/websocket/endpoint/2&resetSettings=true&profile=nofullscreen.xml&replayLink=https%3A%2F%2Fdemo.amigogaming.cloud%2Forganic2%2Freplay%2Flaunch%3Freplay%3Dtrue%26session%3D4448DC12B436427D949A5446426D12DE%26sign%3Db445c25b6f0c55555fa89b799d543884&replaySize=10&historyUrl=https%3A%2F%2Fdemo.amigogaming.cloud%2Fhistorya%2Findex.html%3Fsession%3D4448DC12B436427D949A5446426D12DE%26replaySize%3D10%26historyUrl%3Dhttps%253A%252F%252Fdemo.amigogaming.cloud%252Forganic2%252Fwebsocket%252Fhistory%253Fsession%253D4448DC12B436427D949A5446426D12DE%2526sign%253Db445c25b6f0c55555fa89b799d543884&exit=https%3A%2F%2Fdemo.amigogaming.cloud%2Forganic2%2Fwebsocket%2Fclose%3Fsession%3D4448DC12B436427D949A5446426D12DE%26sign%3Db445c25b6f0c55555fa89b799d543884%26exit%3Dhttps%253A%252F%252Flaunch.amigogaming.com%252Fsession%252Fback%253Flink%253Dabout%253Ablank',
    rtp: 96.0,
    enabled: true,
  },
  {
    title: 'Lucy Luck and the Quest for Coins',
    provider: 'Slotmill',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2026/01/lucy-luck-and-the-quest-for-coins-logo.jpg',
    game_url: 'https://quest-for-coins.slotmill.com/?language=en&org=SlotMill&currency=EUR&homeurl=https://slotmill.com',
    rtp: 96.1,
    enabled: true,
  },
  {
    title: 'Olympus 7\'s Dream Drop',
    provider: 'Relax Gaming',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2026/02/olympus-7s-dream-drop-logo.jpg',
    game_url: 'https://d3nsdzdtjbr5ml.cloudfront.net/casino/launcher.html?channel=web&gameid=olympus7sdd&moneymode=fun&jurisdiction=MT&partnerid=1&apex=1&fullscreen=false',
    rtp: 96.4,
    enabled: true,
  },
  {
    title: 'Robbits',
    provider: 'Quickspin',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2025/12/robbits-logo.jpg',
    game_url: 'https://d1oij17g4yikkz.cloudfront.net/casino/launcher.html?gameid=robbits&partnerid=quickspin',
    rtp: 96.2,
    enabled: true,
  },
  {
    title: 'Supersized',
    provider: 'NoLimit City',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2025/12/supersized-logo.jpg',
    game_url: 'https://www.nolimitcity.com/affiliates/?game=Supersized',
    rtp: 96.3,
    enabled: true,
  },
  {
    title: 'Fire Stampede Ultimate',
    provider: 'Pragmatic Play',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2025/12/fire-stampede-ultimatelogo.jpg',
    game_url: 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?stylename=demo_clienthub&lang=en&cur=USD&websiteUrl=https%3A%2F%2Fclienthub.pragmaticplay.com%2F&gcpif=2273&gameSymbol=vswaysfirest3&jurisdiction=99&lobbyUrl=https://clienthub.pragmaticplay.com/slots/game-library/',
    rtp: 96.5,
    enabled: true,
  },
  {
    title: '3 Magic Eggs',
    provider: 'Pragmatic Play',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2025/12/3-magic-eggs-logo.jpg',
    game_url: 'https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?stylename=demo_clienthub&lang=en&cur=USD&websiteUrl=https%3A%2F%2Fclienthub.pragmaticplay.com%2F&gcpif=2273&gameSymbol=vs25wolfgmm&jurisdiction=99&lobbyUrl=https://clienthub.pragmaticplay.com/slots/game-library/',
    rtp: 96.1,
    enabled: true,
  },
  {
    title: '4 Supercharged Clovers: Hold and Win',
    provider: 'Playson',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2026/02/4-supercharged-clovers-hold-and-win-logo.jpg',
    game_url: 'https://xplatformwl-lrs.box-int-54f2g.com/launch?key=TEST1100000&partner=playsonsite-prod&wl=pl_gate&gameName=4_supercharged_clovers&lang=en',
    rtp: 96.0,
    enabled: true,
  },
  {
    title: 'Digging for Wilds',
    provider: 'Red Tiger Gaming',
    category: 'Slots',
    image: 'https://clashofslots.com/wp-content/uploads/2025/11/digging-for-wilds-logo.jpg',
    game_url: 'https://playin.com/embed/v1/demo/diggingforwilds0',
    rtp: 96.2,
    enabled: true,
  },
];

export const handleImportGames: RequestHandler = async (req, res) => {
  try {
    // Admin check
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    console.log('[GameImport] Starting import of', GAMES_TO_ADD.length, 'slot games...');

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const game of GAMES_TO_ADD) {
      try {
        // Generate slug if not present
        const slug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        // Check if game already exists
        const existingGame = await query(
          'SELECT id FROM games WHERE name = $1 AND provider = $2',
          [game.title, 'External']
        );

        if (existingGame.rows.length > 0) {
          console.log(`[GameImport] Game already exists: ${game.title} by External`);
          skipped++;
          continue;
        }

        // Insert new game
        const result = await query(
          `INSERT INTO games (name, provider, category, image_url, embed_url, launch_url, rtp, enabled, slug, is_branded_popup, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW())
           RETURNING id`,
          [game.title, game.provider, 'Slots', game.image, game.game_url, game.game_url, game.rtp, game.enabled, slug]
        );

        const gameId = result.rows[0].id;
        console.log(`[GameImport] Added: ${game.title} (ID: ${gameId})`);

        // Configure SC wallet
        try {
          await query(
            `INSERT INTO game_compliance (game_id, is_external, is_sweepstake, is_social_casino, currency, max_win_amount, min_bet, max_bet)
             VALUES ($1, true, true, true, 'SC', 20.00, 0.01, 5.00)
             ON CONFLICT (game_id) DO UPDATE SET
                is_external = true,
                is_sweepstake = true,
                is_social_casino = true,
                currency = 'SC'`,
            [gameId]
          );
        } catch (compErr) {
          console.warn(`[GameImport] Failed to configure SC wallet for ${game.title}:`, (compErr as Error).message);
        }

        imported++;
      } catch (gameError: any) {
        console.error(`[GameImport] Failed to add ${game.title}:`, gameError.message);
        errors.push({
          game: game.title,
          error: gameError.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        total: GAMES_TO_ADD.length,
        imported,
        skipped,
        errors,
        message: `Import completed: ${imported} games added, ${skipped} skipped${errors.length > 0 ? ', ' + errors.length + ' errors' : ''}`
      }
    });
  } catch (error) {
    console.error('[GameImport] Fatal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import games'
    });
  }
};
