/**
 * Gemeinsame Konstanten für Backend und Frontend
 * Diese Datei kann von beiden Seiten importiert werden
 */

// Spiel-Konfiguration
const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,
  TILES_PER_PLAYER: 14,
  INITIAL_TILES_DRAW: 14,
  TILES_ON_BOARD: 106 // 4 Farben × 13 Zahlen × 2 + 2 Joker
};

// Farben der Spielsteine
const COLORS = {
  RED: 'red',
  BLACK: 'black',
  BLUE: 'blue',
  YELLOW: 'yellow'
};

// Spielstatus
const GAME_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
  PAUSED: 'paused'
};

// Socket-Events
const SOCKET_EVENTS = {
  // Verbindung
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Spieler
  REGISTER_PLAYER: 'register_player',
  REGISTRATION_SUCCESS: 'registration_success',
  
  // Raum
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_CREATED: 'room_created',
  GET_ROOMS: 'get_rooms',
  ROOMS_LIST: 'rooms_list',
  ROOMS_UPDATED: 'rooms_updated',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  
  // Spiel
  PLAYER_READY: 'player_ready',
  PLAYER_READY_STATUS: 'player_ready_status',
  START_GAME: 'start_game',
  GAME_STARTED: 'game_started',
  SEND_MOVE: 'send_move',
  MOVE_MADE: 'move_made',
  DRAW_TILE: 'draw_tile',
  DISCARD_TILE: 'discard_tile',
  GAME_OVER: 'game_over',
  
  // Chat
  CHAT_MESSAGE: 'chat_message',
  
  // Fehler
  ERROR: 'error'
};

// Spielzug-Typen
const MOVE_TYPES = {
  DRAW: 'draw',
  DISCARD: 'discard',
  ARRANGE: 'arrange',
  DECLARE: 'declare'
};

// Gewinn-Kombinationen
const COMBINATION_TYPES = {
  SET: 'set',      // Gleiche Zahl, verschiedene Farben (min. 3)
  RUN: 'run',      // Aufeinanderfolgende Zahlen, gleiche Farbe (min. 3)
  PAIR: 'pair'     // 2 gleiche Steine
};

// Validierungs-Regeln
const VALIDATION_RULES = {
  MIN_SET_SIZE: 3,
  MIN_RUN_SIZE: 3,
  MIN_TILE_VALUE: 1,
  MAX_TILE_VALUE: 13
};

// Export für CommonJS (Backend) und ES6 (Frontend)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GAME_CONFIG,
    COLORS,
    GAME_STATUS,
    SOCKET_EVENTS,
    MOVE_TYPES,
    COMBINATION_TYPES,
    VALIDATION_RULES
  };
} else {
  window.GAME_CONSTANTS = {
    GAME_CONFIG,
    COLORS,
    GAME_STATUS,
    SOCKET_EVENTS,
    MOVE_TYPES,
    COMBINATION_TYPES,
    VALIDATION_RULES
  };
}
