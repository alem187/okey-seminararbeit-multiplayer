/**
 * Frontend-spezifische Konstanten
 * Importiert geteilte Konstanten vom Backend
 */

// Diese Werte spiegeln die Backend-Konstanten wider
export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,
  TILES_PER_PLAYER: 14,
  INITIAL_TILES_DRAW: 14,
  TILES_ON_BOARD: 106
}

export const COLORS = {
  RED: 'red',
  BLACK: 'black',
  BLUE: 'blue',
  YELLOW: 'yellow'
}

export const GAME_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
  PAUSED: 'paused'
}

export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  REGISTER_PLAYER: 'register_player',
  REGISTRATION_SUCCESS: 'registration_success',
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_CREATED: 'room_created',
  GET_ROOMS: 'get_rooms',
  ROOMS_LIST: 'rooms_list',
  ROOMS_UPDATED: 'rooms_updated',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  PLAYER_READY: 'player_ready',
  PLAYER_READY_STATUS: 'player_ready_status',
  START_GAME: 'start_game',
  GAME_STARTED: 'game_started',
  SEND_MOVE: 'send_move',
  MOVE_MADE: 'move_made',
  DRAW_TILE: 'draw_tile',
  DISCARD_TILE: 'discard_tile',
  GAME_OVER: 'game_over',
  CHAT_MESSAGE: 'chat_message',
  ERROR: 'error'
}

export const MOVE_TYPES = {
  DRAW: 'draw',
  DISCARD: 'discard',
  ARRANGE: 'arrange',
  DECLARE: 'declare'
}

export const COMBINATION_TYPES = {
  SET: 'set',
  RUN: 'run',
  PAIR: 'pair'
}

export const VALIDATION_RULES = {
  MIN_SET_SIZE: 3,
  MIN_RUN_SIZE: 3,
  MIN_TILE_VALUE: 1,
  MAX_TILE_VALUE: 13
}

// UI-spezifische Konstanten
export const UI_CONSTANTS = {
  TILE_WIDTH: 60,
  TILE_HEIGHT: 80,
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 3000
}
