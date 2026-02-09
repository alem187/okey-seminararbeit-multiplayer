/**
 * Okey Multiplayer Spiel-Server
 * Hauptserverdatei mit Socket.io Integration
 * Alle Modelle, Services und Utilities konsolidiert hier
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

// ==========================================
// LOGGER-DIENSTPROGRAMM
// ==========================================
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'INFO';
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  error(message, data) {
    console.error(this.formatMessage(LOG_LEVELS.ERROR, message, data));
  }

  warn(message, data) {
    console.warn(this.formatMessage(LOG_LEVELS.WARN, message, data));
  }

  info(message, data) {
    console.log(this.formatMessage(LOG_LEVELS.INFO, message, data));
  }

  debug(message, data) {
    if (this.level === 'DEBUG') {
      console.log(this.formatMessage(LOG_LEVELS.DEBUG, message, data));
    }
  }
}

const logger = new Logger();

// ==========================================
// STEIN-MODELL
// ==========================================
class Tile {
  constructor(id, color, number, isJoker = false) {
    this.id = id
    this.color = color
    this.number = number
    this.isJoker = isJoker
  }

  canBeUsedAsJoker() {
    return this.isJoker
  }

  getDisplayValue() {
    if (this.isJoker) return 'JOKER'
    return this.number
  }

  clone() {
    return new Tile(this.id, this.color, this.number, this.isJoker)
  }

  equals(other) {
    if (!other) return false
    return (
      this.color === other.color &&
      this.number === other.number &&
      this.isJoker === other.isJoker &&
      this.isFakeJoker === other.isFakeJoker
    )
  }

  toJSON() {
    return {
      id: this.id,
      color: this.color,
      number: this.number,
      isJoker: this.isJoker
    }
  }

  static fromJSON(json) {
    return new Tile(json.id, json.color, json.number, json.isJoker)
  }
}

// ==========================================
// SPIELER-MODELL
// ==========================================
class Player {
  constructor(id, username) {
    this.id = id
    this.username = username
    this.hand = []
    this.score = 0
    this.isReady = false
    this.hasDrawn = false
    this.hasDiscarded = false
  }

  addTile(tile) {
    this.hand.push(tile)
  }

  removeTile(tileId) {
    const index = this.hand.findIndex(t => t.id === tileId)
    if (index !== -1) {
      return this.hand.splice(index, 1)[0]
    }
    return null
  }

  getTile(tileId) {
    return this.hand.find(t => t.id === tileId)
  }

  sortHand() {
    const colorOrder = { red: 0, black: 1, blue: 2, yellow: 3 }
    this.hand.sort((a, b) => {
      if (a.color === b.color) {
        return a.number - b.number
      }
      return colorOrder[a.color] - colorOrder[b.color]
    })
  }

  resetTurn() {
    this.hasDrawn = false
    this.hasDiscarded = false
  }

  toJSON(hideHand = false) {
    return {
      id: this.id,
      username: this.username,
      hand: hideHand ? [] : this.hand.map(t => t.toJSON()),
      handSize: this.hand.length,
      score: this.score,
      isReady: this.isReady,
      hasDrawn: this.hasDrawn,
      hasDiscarded: this.hasDiscarded
    }
  }
}

// ==========================================
// SPIEL-MODELL
// ==========================================
class Game {
  constructor(roomId, players) {
    this.roomId = roomId
    this.players = players.map(p => new Player(p.id, p.username))
    this.deck = []
    this.discardPile = []
    this.indicator = null
    this.joker = null
    this.currentPlayerIndex = 0
    this.turnNumber = 0
    this.status = 'playing'
    this.winner = null
    this.startedAt = new Date()
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex]
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId)
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length
    this.turnNumber++
    this.getCurrentPlayer().resetTurn()
  }

  drawTile() {
    if (this.deck.length === 0) return null
    return this.deck.pop()
  }

  drawFromDiscard() {
    if (this.discardPile.length === 0) return null
    return this.discardPile.pop()
  }

  discard(tile) {
    this.discardPile.push(tile)
  }

  isFinished() {
    return this.status === 'finished'
  }

  endGame(winnerId) {
    this.status = 'finished'
    this.winner = winnerId
  }

  toJSON(forPlayerId = null) {
    return {
      roomId: this.roomId,
      players: this.players.map(p => p.toJSON(forPlayerId && p.id !== forPlayerId)),
      deckSize: this.deck.length,
      discardPile: this.discardPile.map(t => t.toJSON()),
      topDiscardTile: this.discardPile.length > 0 
        ? this.discardPile[this.discardPile.length - 1].toJSON() 
        : null,
      indicator: this.indicator ? this.indicator.toJSON() : null,
      joker: this.joker,
      currentPlayerId: this.getCurrentPlayer().id,
      currentPlayerIndex: this.currentPlayerIndex,
      turnNumber: this.turnNumber,
      status: this.status,
      winner: this.winner,
      startedAt: this.startedAt
    }
  }
}

// ==========================================
// STEIN-SERVICE
// ==========================================
const COLORS = ['red', 'black', 'blue', 'yellow']
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

class TileService {
  static createDeck() {
    const tiles = []
    let id = 0
    for (let set = 0; set < 2; set++) {
      for (const color of COLORS) {
        for (const number of NUMBERS) {
          tiles.push(new Tile(`tile_${id++}`, color, number, false))
        }
      }
    }
    return tiles
  }

  static shuffleDeck(deck) {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  static selectIndicatorAndJoker(deck) {
    const indicator = deck.pop()
    let jokerNumber = indicator.number + 1
    if (jokerNumber > 13) jokerNumber = 1
    const joker = { color: indicator.color, number: jokerNumber }
    return { indicator, joker, deck }
  }

  static markJokerTiles(deck, jokerInfo) {
    return deck.map(tile => {
      // Normale Steine, die den Joker-Wert haben, werden zu Jokern
      if (tile.color === jokerInfo.color && tile.number === jokerInfo.number) {
        tile.isJoker = true
      }
      return tile
    })
  }

  static dealTiles(deck, playerCount, tilesPerPlayer = 14) {
    const hands = Array(playerCount).fill(null).map(() => [])
    for (let i = 0; i < tilesPerPlayer; i++) {
      for (let p = 0; p < playerCount; p++) {
        if (deck.length > 0) {
          hands[p].push(deck.pop())
        }
      }
    }
    return { hands, remainingDeck: deck }
  }

  static sortTiles(tiles) {
    const colorOrder = { red: 0, black: 1, blue: 2, yellow: 3 }
    return [...tiles].sort((a, b) => {
      if (a.canBeUsedAsJoker() && !b.canBeUsedAsJoker()) return 1
      if (!a.canBeUsedAsJoker() && b.canBeUsedAsJoker()) return -1
      if (a.color === b.color) {
        return a.number - b.number
      }
      return colorOrder[a.color] - colorOrder[b.color]
    })
  }
}

// ==========================================
// VALIDIERUNGS-SERVICE
// ==========================================
class ValidationService {
  static validateHand(hand, joker, indicator) {
    if (!hand || hand.length !== 14) return false
    const tiles = []
    const wildcards = []
    hand.forEach(t => {
      if (t.isJoker) {
        wildcards.push(t)
      } else {
        tiles.push({ ...t, isWildcard: false })
      }
    })
    return this.canPartition(tiles, wildcards.length)
  }

  static canPartition(tiles, wildcardCount) {
    if (tiles.length === 0 && wildcardCount >= 0) {
      return true
    }
    if (tiles.length < 3) {
      return false
    }
    
    tiles.sort((a, b) => {
      if (a.color !== b.color) return a.color.localeCompare(b.color)
      return a.number - b.number
    })
    
    const current = tiles[0]
    const remaining = tiles.slice(1)
    
    // Versuche alle möglichen Gruppenlängen von 3 aufwärts
    const maxLength = Math.min(remaining.length + 1, tiles.length)
    for (let length = 3; length <= maxLength; length++) {
      // Versuche Sequenz vorwärts
      if (this.tryRun(current, remaining, wildcardCount, length)) return true
      // Versuche Sequenz rückwärts (für Wrap-around wie 11-12-13-1)
      if (this.tryRunReverse(current, remaining, wildcardCount, length)) return true
      // Versuche Set
      if (this.trySet(current, remaining, wildcardCount, length)) return true
    }
    
    return false
  }

  static tryRun(startTile, otherTiles, wildcardCount, length) {
    const targetSequence = []
    let nextNum = startTile.number
    for (let i = 0; i < length; i++) {
      targetSequence.push(nextNum)
      nextNum++
      if (nextNum > 13) nextNum = 1
    }
    let usedIndices = []
    let currentWildcards = wildcardCount
    for (let i = 1; i < length; i++) {
      const targetNum = targetSequence[i]
      const matchIndex = otherTiles.findIndex((t, idx) => 
        !usedIndices.includes(idx) && t.color === startTile.color && t.number === targetNum
      )
      if (matchIndex !== -1) {
        usedIndices.push(matchIndex)
      } else {
        if (currentWildcards > 0) {
          currentWildcards--
        } else {
          return false
        }
      }
    }
    const nextTiles = otherTiles.filter((_, idx) => !usedIndices.includes(idx))
    return this.canPartition(nextTiles, currentWildcards)
  }
  
  static tryRunReverse(startTile, otherTiles, wildcardCount, length) {
    // Versuche Sequenz rückwärts zu bauen (z.B. bei 1 starte mit 13-12-11-...-1)
    const targetSequence = []
    let prevNum = startTile.number
    for (let i = 0; i < length; i++) {
      targetSequence.push(prevNum)
      prevNum--
      if (prevNum < 1) prevNum = 13
    }
    targetSequence.reverse() // Richtige Reihenfolge
    
    let usedIndices = []
    let currentWildcards = wildcardCount
    for (let i = 0; i < length - 1; i++) {
      const targetNum = targetSequence[i]
      const matchIndex = otherTiles.findIndex((t, idx) => 
        !usedIndices.includes(idx) && t.color === startTile.color && t.number === targetNum
      )
      if (matchIndex !== -1) {
        usedIndices.push(matchIndex)
      } else {
        if (currentWildcards > 0) {
          currentWildcards--
        } else {
          return false
        }
      }
    }
    const nextTiles = otherTiles.filter((_, idx) => !usedIndices.includes(idx))
    return this.canPartition(nextTiles, currentWildcards)
  }

  static trySet(startTile, otherTiles, wildcardCount, length) {
    const usedColors = [startTile.color]
    let usedIndices = []
    let currentWildcards = wildcardCount
    for (let i = 1; i < length; i++) {
      const matchIndex = otherTiles.findIndex((t, idx) => 
        !usedIndices.includes(idx) && t.number === startTile.number && !usedColors.includes(t.color)
      )
      if (matchIndex !== -1) {
        usedIndices.push(matchIndex)
        usedColors.push(otherTiles[matchIndex].color)
      } else {
        if (currentWildcards > 0) {
          currentWildcards--
        } else {
          return false
        }
      }
    }
    const nextTiles = otherTiles.filter((_, idx) => !usedIndices.includes(idx))
    return this.canPartition(nextTiles, currentWildcards)
  }
}

// ==========================================
// SPIEL-SERVICE
// ==========================================
class GameService {
  constructor() {
    this.games = new Map()
  }

  initializeGame(roomId, players) {
    logger.info(`Initializing game for room: ${roomId}`)
    let deck = TileService.createDeck()
    deck = TileService.shuffleDeck(deck)
    const { indicator, joker, deck: deckAfterIndicator } = TileService.selectIndicatorAndJoker(deck)
    let finalDeck = TileService.markJokerTiles(deckAfterIndicator, joker)
    const game = new Game(roomId, players)
    game.indicator = indicator
    game.joker = joker
    const { hands, remainingDeck } = TileService.dealTiles(finalDeck, players.length, 14)
    game.players.forEach((player, index) => {
      player.hand = TileService.sortTiles(hands[index])
    })
    game.deck = remainingDeck
    this.games.set(roomId, game)
    logger.info(`Game initialized: ${roomId}, Players: ${players.length}`)
    return game
  }

  getGame(roomId) {
    return this.games.get(roomId)
  }

  drawTile(roomId, playerId, fromDiscard = false) {
    const game = this.getGame(roomId)
    if (!game) throw new Error('Game not found')
    const player = game.getPlayer(playerId)
    if (!player) throw new Error('Player not found')
    if (game.getCurrentPlayer().id !== playerId) throw new Error('Not your turn')
    if (player.hasDrawn) throw new Error('Already drew this turn')
    const tile = fromDiscard ? game.drawFromDiscard() : game.drawTile()
    if (!tile) throw new Error('No tiles available')
    player.addTile(tile)
    player.hasDrawn = true
    logger.info(`Player ${playerId} drew tile: ${tile.id}, hand size now: ${player.hand.length}`)
    return { game, tile }
  }

  discardTile(roomId, playerId, tileId) {
    const game = this.getGame(roomId)
    if (!game) throw new Error('Game not found')
    const player = game.getPlayer(playerId)
    if (!player) throw new Error('Player not found')
    if (game.getCurrentPlayer().id !== playerId) throw new Error('Not your turn')
    if (!player.hasDrawn) throw new Error('Must draw before discarding')
    if (player.hasDiscarded) throw new Error('Already discarded this turn')
    const tile = player.removeTile(tileId)
    if (!tile) throw new Error('Tile not found in hand')
    game.discard(tile)
    player.hasDiscarded = true
    game.nextTurn()
    logger.info(`Player ${playerId} discarded tile: ${tileId}`)
    return { game, tile }
  }

  declareWin(roomId, playerId, discardTileId = null) {
    const game = this.getGame(roomId)
    if (!game) throw new Error('Game not found')
    const player = game.getPlayer(playerId)
    if (!player) throw new Error('Player not found')
    
    logger.info(`🏆 ${playerId} attempting to declare win. Hand size: ${player.hand.length}, Discard tile: ${discardTileId}`)
    
    let handToValidate = [...player.hand]
    if (discardTileId) {
      const tileToDiscard = player.hand.find(t => t.id === discardTileId)
      if (!tileToDiscard) {
        logger.error(`Tile ${discardTileId} not found in player's hand`)
        logger.error(`Player hand tile IDs: ${player.hand.map(t => t.id).join(', ')}`)
        throw new Error(`Stein mit ID ${discardTileId} nicht in der Hand gefunden!`)
      }
      handToValidate = handToValidate.filter(t => t.id !== discardTileId)
      logger.info(`✓ After discarding ${discardTileId}, hand size: ${handToValidate.length}`)
    }
    
    if (handToValidate.length !== 14) {
      throw new Error(`Ungültige Handgröße (${handToValidate.length}). Man braucht 14 Steine zum Gewinnen.`)
    }
    
    if (!ValidationService.validateHand(handToValidate, game.joker, game.indicator)) {
      logger.error(`Hand validation failed for ${playerId}`)
      throw new Error('Ungültige Hand! Die Steine bilden kein gültiges Okey.')
    }
    
    // Abwerfen und Spielerhand aktualisieren
    if (discardTileId) {
      const discardedTile = player.hand.find(t => t.id === discardTileId)
      game.discard(discardedTile)
    }
    player.hand = handToValidate
    game.endGame(playerId)
    logger.info(`🎉 Player ${playerId} won the game in room ${roomId}`)
    return game
  }

  removeGame(roomId) {
    this.games.delete(roomId)
    logger.info(`Game removed: ${roomId}`)
  }

  getActiveGames() {
    return Array.from(this.games.values())
  }
}

const gameService = new GameService();

// Express-App initialisieren
const app = express();
const server = http.createServer(app);

// Socket.io mit CORS konfigurieren
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-Memory-Speicher (für Entwicklung - später durch DB ersetzen)
const rooms = new Map();
const players = new Map();

// Basis-Health-Check-Endpunkt
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    players: players.size,
    timestamp: new Date().toISOString()
  });
});

// Socket.io Verbindungs-Handler
io.on('connection', (socket) => {
  console.log(`Neuer Client verbunden: ${socket.id}`);

  // Spielerdaten auf Socket speichern
  socket.on('register_player', (data) => {
    const { username } = data;
    players.set(socket.id, {
      id: socket.id,
      username: username || `Player_${socket.id.substring(0, 5)}`,
      roomId: null,
      ready: false
    });
    
    console.log(`Player registered: ${username} (${socket.id})`);
    socket.emit('registration_success', players.get(socket.id));
  });

  // Raum erstellen - Event
  socket.on('create_room', (data) => {
    const { roomName, maxPlayers = 4 } = data;
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const player = players.get(socket.id);
    if (!player) {
      socket.emit('error', { message: 'Player not registered' });
      return;
    }

    const room = {
      id: roomId,
      name: roomName || `Room ${rooms.size + 1}`,
      host: socket.id,
      players: [socket.id],
      maxPlayers: maxPlayers,
      status: 'waiting', // waiting, playing, finished
      createdAt: new Date()
    };

    rooms.set(roomId, room);
    player.roomId = roomId;
    socket.join(roomId);

    console.log(`Raum erstellt: ${roomId} von ${player.username}`);
    
    // Benachrichtige Raumersteller
    socket.emit('room_created', { 
      room,
      players: [{
        id: player.id,
        username: player.username
      }]
    });
    
    // Aktualisierte Raumliste an alle Clients broadcasten
    io.emit('rooms_updated', Array.from(rooms.values()));
  });

  // Raum beitreten - Event
  socket.on('join_room', (data) => {
    const { roomId } = data;
    const player = players.get(socket.id);
    
    if (!player) {
      socket.emit('error', { message: 'Player not registered' });
      return;
    }

    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    if (room.status !== 'waiting') {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }

    // Füge Spieler zum Raum hinzu
    room.players.push(socket.id);
    player.roomId = roomId;
    socket.join(roomId);

    console.log(`${player.username} trat Raum bei: ${roomId}`);

    // Benachrichtige alle Spieler im Raum
    io.to(roomId).emit('player_joined', {
      player: {
        id: player.id,
        username: player.username
      },
      room: room,
      players: room.players.map(pid => {
        const p = players.get(pid);
        return {
          id: p.id,
          username: p.username
        };
      })
    });

    // Aktualisierte Raumliste broadcasten
    io.emit('rooms_updated', Array.from(rooms.values()));
  });

  // Raum verlassen - Event
  socket.on('leave_room', () => {
    handlePlayerLeaveRoom(socket);
  });

  // Spieler bereit - Event
  socket.on('player_ready', () => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      socket.emit('error', { message: 'Not in a room' });
      return;
    }

    player.ready = !player.ready;
    const room = rooms.get(player.roomId);

    io.to(player.roomId).emit('player_ready_status', {
      playerId: socket.id,
      ready: player.ready,
      allReady: room.players.every(pid => players.get(pid)?.ready)
    });

    console.log(`${player.username} Bereit-Status: ${player.ready}`);
  });

  // Spiel starten - Event
  socket.on('start_game', () => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      socket.emit('error', { message: 'Not in a room' });
      return;
    }

    const room = rooms.get(player.roomId);
    
    // Nur Host kann Spiel starten
    if (room.host !== socket.id) {
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }

    // Mindestens 2 Spieler erforderlich
    if (room.players.length < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    room.status = 'playing';
    
    // Spiel mit gameService initialisieren
    const roomPlayers = room.players.map(pid => ({
      id: pid,
      username: players.get(pid)?.username || `Spieler ${pid.substring(0, 5)}`
    }));
    
    const game = gameService.initializeGame(room.id, roomPlayers);
    
    // Spielzustand an jeden Spieler senden (versteckte Karten für andere)
    room.players.forEach(playerId => {
      const gameStateForPlayer = game.toJSON(playerId);
      io.to(playerId).emit('game_started', { gameState: gameStateForPlayer });
    });
    
    console.log(`Spiel gestartet im Raum: ${room.id}`);
  });

  // Spielzug senden - Event
  socket.on('send_move', (data) => {
    const { roomId, move } = data;
    const player = players.get(socket.id);
    
    if (!player || player.roomId !== roomId) {
      socket.emit('error', { message: 'Invalid room or player' });
      return;
    }

    try {
      let game;
      let result;

      console.log(`${player.username} attempting move:`, move.type);

      // Verschiedene Spielzug-Typen verarbeiten
      switch (move.type) {
        case 'draw':
          result = gameService.drawTile(roomId, socket.id, move.fromDiscard);
          game = result.game;
          
          // Aktualisierter Spielzustand an alle Spieler senden
          const room = rooms.get(roomId);
          console.log(`Ziehen erfolgreich, sende aktualisierten Spielzustand an ${room.players.length} Spieler`);
          
          room.players.forEach(playerId => {
            const gameStateForPlayer = game.toJSON(playerId);
            const playerInState = gameStateForPlayer.players.find(p => p.id === playerId);
            console.log(`Sende an ${playerId}: Handgröße = ${playerInState?.hand?.length || playerInState?.handSize}`);
            io.to(playerId).emit('game_state_updated', { gameState: gameStateForPlayer });
          });
          
          console.log(`${player.username} zog einen Stein (fromDiscard: ${move.fromDiscard}`);
          break;

        case 'discard':
          result = gameService.discardTile(roomId, socket.id, move.tileId);
          game = result.game;
          
          // Aktualisierter Spielzustand an alle Spieler senden
          const room2 = rooms.get(roomId);
          room2.players.forEach(playerId => {
            const gameStateForPlayer = game.toJSON(playerId);
            io.to(playerId).emit('game_state_updated', { gameState: gameStateForPlayer });
          });
          
          console.log(`${player.username} warf einen Stein ab, nächster Spieler ist am Zug`);
          break;

        case 'declare':
          try {
            const discardTileId = move.discardTileId; // Hole optionalen Abwurfstein
            game = gameService.declareWin(roomId, socket.id, discardTileId);
            
            // Benachrichtige alle Spieler vom Spielende mit VOLLEM Zustand (zeige alle Karten)
            const fullGameState = game.toJSON(null); // null = zeige alle Karten
            
            io.to(roomId).emit('game_over', {
              winner: socket.id,
              winnerName: player.username,
              gameState: fullGameState
            });
            
            console.log(`${player.username} hat das Spiel gewonnen!`);
          } catch (e) {
            socket.emit('error', { message: e.message });
          }
          break;

        default:
          socket.emit('error', { message: 'Ungültiger Spielzugtyp' });
      }
    } catch (error) {
      console.error('Spielzugfehler:', error.message);
      socket.emit('error', { message: error.message });
    }
  });

  // Chat-Nachricht - Event
  socket.on('chat_message', (data) => {
    const { roomId, message } = data;
    const player = players.get(socket.id);
    
    if (!player || player.roomId !== roomId) {
      return;
    }

    io.to(roomId).emit('chat_message', {
      playerId: socket.id,
      username: player.username,
      message: message,
      timestamp: new Date()
    });
  });

  // Abrufen: Verfügbare Räume
  socket.on('get_rooms', () => {
    socket.emit('rooms_list', Array.from(rooms.values()));
  });

  // Dev-Modus: Aktualisiere Spielerhand
  socket.on('dev_update_hand', (data) => {
    const { roomId, hand } = data;
    const player = players.get(socket.id);
    
    if (!player || player.roomId !== roomId) {
      console.log(`DEV: Invalid player or room`);
      return;
    }

    try {
      const game = gameService.getGame(roomId);
      if (!game) {
        console.log(`DEV: Game not found for room ${roomId}`);
        return;
      }
      
      const gamePlayer = game.getPlayer(socket.id);
      if (!gamePlayer) {
        console.log(`DEV: Player not found in game`);
        return;
      }
      
      console.log(`DEV: Updating ${player.username}'s hand from ${gamePlayer.hand.length} to ${hand.length} tiles`);
      console.log(`DEV: Old tile IDs: ${gamePlayer.hand.map(t => t.id).join(', ')}`);
      console.log(`DEV: New tile IDs: ${hand.map(t => t.id).join(', ')}`);
      
      // Aktualisiere die Hand des Spielers mit den Dev-Änderungen
      gamePlayer.hand = hand.map(tile => Tile.fromJSON(tile));
      
      console.log(`DEV: Successfully updated ${player.username}'s hand to ${gamePlayer.hand.length} tiles`);
      
      // Sende Update an alle Spieler
      const room = rooms.get(roomId);
      room.players.forEach(playerId => {
        const gameStateForPlayer = game.toJSON(playerId);
        io.to(playerId).emit('game_state_updated', { gameState: gameStateForPlayer });
      });
      
      console.log(`DEV: Sent game_state_updated to all players`);
    } catch (error) {
      console.error('Dev update hand error:', error.message);
      console.error(error.stack);
    }
  });

  // Disconnect-Handler
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    handlePlayerDisconnect(socket);
  });
});

/**
 * Hilfsfunktion um Spieler zu behandeln, der Raum verlässt
 */
function handlePlayerLeaveRoom(socket) {
  const player = players.get(socket.id);
  if (!player || !player.roomId) return;

  const room = rooms.get(player.roomId);
  if (!room) return;

  // Entferne Spieler aus dem Raum
  room.players = room.players.filter(pid => pid !== socket.id);
  socket.leave(player.roomId);

  console.log(`${player.username} verließ Raum: ${player.roomId}`);

  // Wenn Raum leer ist, lösche ihn
  if (room.players.length === 0) {
    rooms.delete(player.roomId);
    console.log(`Raum gelöscht: ${player.roomId}`);
  } else {
    // Wenn Host den Raum verließ, weise neuen Host zu
    if (room.host === socket.id) {
      room.host = room.players[0];
      console.log(`Neuer Host zugewiesen: ${players.get(room.host)?.username}`);
    }

    // Benachrichtige verbleibende Spieler
    io.to(player.roomId).emit('player_left', {
      playerId: socket.id,
      room: {
        ...room,
        players: room.players.map(pid => players.get(pid))
      }
    });
  }

  player.roomId = null;
  player.ready = false;

  // Aktualisierte Raumliste broadcasten
  io.emit('rooms_updated', Array.from(rooms.values()));
}

/**
 * Hilfsfunktion zur Behandlung von Spieler-Disconnect
 */
function handlePlayerDisconnect(socket) {
  handlePlayerLeaveRoom(socket);
  players.delete(socket.id);
}

// Server starten
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   Okey Multiplayer Server             ║
  ║   Server running on port ${PORT}      ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}         ║
  ╚═══════════════════════════════════════╝
  `);
});

// Sauberes Herunterfahren
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = { app, io, server };
