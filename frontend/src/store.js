/**
 * Konsolidierter Store, Services und Hooks
 * Alle Zustand Stores, Socket-Service und Custom Hooks in einer Datei
 */

import { useState, useEffect, useCallback } from 'react'
import { create } from 'zustand'
import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

// ==========================================
// SOCKET-SERVICE
// ==========================================
class SocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
  }

  connect() {
    if (this.socket?.connected) {
      console.log('Socket already connected')
      return
    }

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    this.socket.on('connect', () => {
      console.log('✅ Mit Server verbunden:', this.socket.id)
      this.emit('connectionStatusChanged', 'connected')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Vom Server getrennt:', reason)
      this.emit('connectionStatusChanged', 'disconnected')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Verbindungsfehler:', error.message)
      this.emit('connectionStatusChanged', 'error')
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Erneut verbunden nach', attemptNumber, 'Versuchen')
    })

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection-Versuch:', attemptNumber)
      this.emit('connectionStatusChanged', 'connecting')
    })

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Wiederverbindung fehlgeschlagen')
      this.emit('connectionStatusChanged', 'failed')
    })

    this.setupEventListeners()
  }

  setupEventListeners() {
    if (!this.socket) return

    this.socket.on('registration_success', (data) => {
      console.log('Spieler registriert:', data)
      this.emit('registrationSuccess', data)
    })

    this.socket.on('room_created', (data) => {
      console.log('Raum erstellt:', data)
      this.emit('roomCreated', data)
    })

    this.socket.on('rooms_updated', (data) => {
      this.emit('roomsUpdated', data)
    })

    this.socket.on('rooms_list', (data) => {
      this.emit('roomsList', data)
    })

    this.socket.on('player_joined', (data) => {
      console.log('Spieler beigetreten:', data)
      this.emit('playerJoined', data)
    })

    this.socket.on('player_left', (data) => {
      console.log('Spieler verlassen:', data)
      this.emit('playerLeft', data)
    })

    this.socket.on('player_ready_status', (data) => {
      this.emit('playerReadyStatus', data)
    })

    this.socket.on('game_started', (data) => {
      console.log('Spiel gestartet:', data)
      this.emit('gameStarted', data)
    })

    this.socket.on('game_state_updated', (data) => {
      console.log('socketService erhielt game_state_updated:', data)
      this.emit('game_state_updated', data)
    })

    this.socket.on('move_made', (data) => {
      this.emit('moveMade', data)
    })

    this.socket.on('chat_message', (data) => {
      this.emit('chatMessage', data)
    })

    this.socket.on('error', (data) => {
      console.error('Serverfehler:', data)
      this.emit('serverError', data)
    })

    this.socket.on('game_over', (data) => {
      this.emit('gameOver', data)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
    return () => {
      const callbacks = this.listeners.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  registerPlayer(username) {
    this.socket?.emit('register_player', { username })
  }

  createRoom(roomName, maxPlayers = 4) {
    this.socket?.emit('create_room', { roomName, maxPlayers })
  }

  joinRoom(roomId) {
    this.socket?.emit('join_room', { roomId })
  }

  leaveRoom() {
    this.socket?.emit('leave_room')
  }

  getRooms() {
    this.socket?.emit('get_rooms')
  }

  setPlayerReady() {
    this.socket?.emit('player_ready')
  }

  startGame() {
    this.socket?.emit('start_game')
  }

  sendMove(roomId, move) {
    this.socket?.emit('send_move', { roomId, move })
  }

  // Dev-Modus: Sende aktualisierte Hand an Server
  updateDevHand(roomId, hand) {
    this.socket?.emit('dev_update_hand', { roomId, hand })
  }

  drawTile(roomId) {
    this.socket?.emit('draw_tile', { roomId })
  }

  discardTile(roomId, tile) {
    this.socket?.emit('discard_tile', { roomId, tile })
  }

  sendChatMessage(roomId, message) {
    this.socket?.emit('chat_message', { roomId, message })
  }

  isConnected() {
    return this.socket?.connected || false
  }

  getSocketId() {
    return this.socket?.id
  }
}

export const socketService = new SocketService()

// ==========================================
// BENUTZER-STORE
// ==========================================
export const useUserStore = create((set) => ({
  user: null,
  isRegistered: false,

  setUser: (userData) => set({ 
    user: userData,
    isRegistered: true 
  }),

  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),

  clearUser: () => set({ 
    user: null,
    isRegistered: false 
  }),

  getUsername: () => {
    const state = useUserStore.getState()
    return state.user?.username || ''
  },

  getUserId: () => {
    const state = useUserStore.getState()
    return state.user?.id || ''
  }
}))

// ==========================================
// SPIEL-STORE
// ==========================================
export const useGameStore = create((set, get) => ({
  rooms: [],
  currentRoom: null,
  roomPlayers: [],
  gameState: null,
  isPlaying: false,
  isReady: false,
  selectedTiles: [],
  isLoading: false,
  error: null,

  setRooms: (rooms) => set({ rooms }),

  addRoom: (room) => set((state) => ({
    rooms: [...state.rooms, room]
  })),

  updateRoom: (roomId, updates) => set((state) => ({
    rooms: state.rooms.map(room => 
      room.id === roomId ? { ...room, ...updates } : room
    ),
    currentRoom: state.currentRoom?.id === roomId 
      ? { ...state.currentRoom, ...updates }
      : state.currentRoom
  })),

  removeRoom: (roomId) => set((state) => ({
    rooms: state.rooms.filter(room => room.id !== roomId)
  })),

  setCurrentRoom: (room) => set({ 
    currentRoom: room,
    roomPlayers: room?.players || []
  }),

  clearCurrentRoom: () => set({ 
    currentRoom: null,
    roomPlayers: [],
    isReady: false
  }),

  setRoomPlayers: (players) => set({ roomPlayers: players }),

  addPlayerToRoom: (player) => set((state) => ({
    roomPlayers: [...state.roomPlayers, player]
  })),

  removePlayerFromRoom: (playerId) => set((state) => ({
    roomPlayers: state.roomPlayers.filter(p => p.id !== playerId)
  })),

  updatePlayerInRoom: (playerId, updates) => set((state) => ({
    roomPlayers: state.roomPlayers.map(p =>
      p.id === playerId ? { ...p, ...updates } : p
    )
  })),

  setGameState: (gameState) => {
    console.log('🎮 Stelle Spielzustand im Store ein:', {
      turnNumber: gameState?.turnNumber,
      currentPlayerId: gameState?.currentPlayerId,
      playersCount: gameState?.players?.length
    })
    set({ 
      gameState,
      isPlaying: gameState?.status === 'playing'
    })
  },

  updateGameState: (updates) => set((state) => ({
    gameState: state.gameState ? { ...state.gameState, ...updates } : null
  })),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  toggleReady: () => set((state) => ({ isReady: !state.isReady })),

  setReady: (isReady) => set({ isReady }),

  selectTile: (tile) => set((state) => ({
    selectedTiles: [...state.selectedTiles, tile]
  })),

  deselectTile: (tileId) => set((state) => ({
    selectedTiles: state.selectedTiles.filter(t => t.id !== tileId)
  })),

  clearSelectedTiles: () => set({ selectedTiles: [] }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  reset: () => set({
    rooms: [],
    currentRoom: null,
    roomPlayers: [],
    gameState: null,
    isPlaying: false,
    isReady: false,
    selectedTiles: [],
    isLoading: false,
    error: null
  })
}))

// ==========================================
// BENUTZERDEFINIERTER HOOK: useSocket
// ==========================================
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  useEffect(() => {
    setIsConnected(socketService.isConnected())

    const unsubscribe = socketService.on('connectionStatusChanged', (status) => {
      setConnectionStatus(status)
      setIsConnected(status === 'connected')
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const subscribe = useCallback((event, callback) => {
    return socketService.on(event, callback)
  }, [])

  const emit = useCallback((event, data) => {
    socketService.socket?.emit(event, data)
  }, [])

  return {
    isConnected,
    connectionStatus,
    subscribe,
    emit,
    socketId: socketService.getSocketId()
  }
}

export default socketService
