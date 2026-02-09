/**
 * Konsolidierte App-Komponente
 * Alle Komponenten in eine Datei integriert
 */

import { useEffect, useState } from 'react'
import { socketService, useSocket, useUserStore, useGameStore } from './store'
import { 
  DndContext, 
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ==========================================
// STEIN-EDITOR MODAL (DEV-MODUS)
// ==========================================
function TileEditorModal({ isOpen, onClose, hand, onUpdateTile, onGenerateValidHand }) {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [editColor, setEditColor] = useState('red')
  const [editNumber, setEditNumber] = useState(1)
  const [editIsJoker, setEditIsJoker] = useState(false)

  if (!isOpen) return null

  const colors = ['red', 'black', 'blue', 'yellow']
  const numbers = Array.from({ length: 13 }, (_, i) => i + 1)

  const handleSelectTile = (index) => {
    setSelectedIndex(index)
    const tile = hand[index]
    if (tile) {
      setEditColor(tile.color || 'red')
      setEditNumber(tile.number || 1)
      setEditIsJoker(tile.isJoker || false)
    }
  }

  const handleApply = () => {
    if (selectedIndex !== null) {
      onUpdateTile(selectedIndex, {
        color: editColor,
        number: editNumber,
        isJoker: editIsJoker
      })
      setSelectedIndex(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-yellow-500/50 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-yellow-400">DEV: Stein-Editor</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={onGenerateValidHand} 
              className="btn-primary btn-sm"
              title="Generiert automatisch eine gültige 14-Steine Hand"
            >
              ✨ Gültiges Okey generieren
            </button>
            <button onClick={onClose} className="btn-secondary btn-sm">✕ Schließen</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Links: Hand */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Deine Hand</h3>
            <div className="grid grid-cols-5 gap-2">
              {hand.map((tile, index) => (
                <div
                  key={tile.id}
                  onClick={() => handleSelectTile(index)}
                  className={`cursor-pointer transform transition-all ${
                    selectedIndex === index ? 'scale-110 ring-4 ring-yellow-400' : 'hover:scale-105'
                  }`}
                >
                  <Tile tile={tile} isDraggable={false} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Rechts: Editor */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              {selectedIndex !== null ? `Stein #${selectedIndex + 1} bearbeiten` : 'Wähle einen Stein'}
            </h3>
            
            {selectedIndex !== null && (
              <div className="space-y-4">
                {/* Farbauswahl */}
                <div>
                  <label className="block text-sm font-medium mb-2">Farbe</label>
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setEditColor(color)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          editColor === color
                            ? 'border-yellow-400 bg-yellow-400/20'
                            : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full mx-auto ${
                          color === 'red' ? 'bg-red-500' :
                          color === 'black' ? 'bg-gray-900' :
                          color === 'blue' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}></div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zahlenauswahl */}
                <div>
                  <label className="block text-sm font-medium mb-2">Zahl</label>
                  <div className="grid grid-cols-7 gap-2">
                    {numbers.map(num => (
                      <button
                        key={num}
                        onClick={() => setEditNumber(num)}
                        className={`p-2 rounded-lg border-2 font-bold transition-all ${
                          editNumber === num
                            ? 'border-yellow-400 bg-yellow-400/20'
                            : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spezielle Steine */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsJoker}
                      onChange={(e) => setEditIsJoker(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600"
                    />
                    <span>Als Joker markieren</span>
                  </label>
                </div>

                {/* Vorschau */}
                <div>
                  <label className="block text-sm font-medium mb-2">Vorschau</label>
                  <div className="flex justify-center p-4 bg-black/30 rounded-lg">
                    <Tile
                      tile={{
                        id: 'preview',
                        color: editColor,
                        number: editNumber,
                        isJoker: editIsJoker
                      }}
                      isDraggable={false}
                    />
                  </div>
                </div>

                {/* Anwenden-Button */}
                <button
                  onClick={handleApply}
                  className="btn-primary w-full"
                >
                  ✓ Änderungen übernehmen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// STEIN-KOMPONENTE
// ==========================================
function Tile({ tile, isDraggable = true, isSelected = false, onClick = null, size = 'md' }) {
  const isValidTile = Boolean(tile && tile.id)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: tile?.id || 'invalid-tile',
    disabled: !isDraggable || !isValidTile
  })

  if (!isValidTile) return null

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none'
  }

  const sizeClasses = {
    sm: 'w-12 h-[68px] text-sm',
    md: 'w-16 h-[88px] text-base',
    lg: 'w-20 h-[112px] text-lg'
  }

  const colorClasses = {
    red: 'text-tile-red',
    black: 'text-tile-black',
    blue: 'text-tile-blue',
    yellow: 'text-tile-yellow'
  }

  const getTileDisplay = () => {
    if (tile?.isJoker) return <span className="text-xs font-bold">JOKER</span>
    return tile?.number || '?'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        ${sizeClasses[size] || sizeClasses.md}
        ${tile?.color ? (colorClasses[tile.color] || 'text-gray-400') : 'text-gray-400'}
        ${isSelected ? 'ring-4 ring-yellow-400 -translate-y-2' : ''}
        bg-white rounded-lg shadow-tile hover:shadow-tile-hover
        flex flex-col items-center justify-center
        font-bold select-none transition-all duration-200
        ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:-translate-y-1' : 'cursor-default opacity-75'}
        border-2 border-gray-200
      `}
    >
      <div className="text-center">{getTileDisplay()}</div>
      {!tile?.isJoker && (
        <div className="flex gap-0.5 mt-1">
          <div className={`w-1.5 h-1.5 rounded-full bg-current`}></div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// SPIELERHAND-KOMPONENTE
// ==========================================
function PlayerHand({ tiles, onTilesReorder, onTileSelect, selectedTileId = null, canDiscard = false }) {
  const validTiles = Array.isArray(tiles) ? tiles.filter(t => t && t.id && typeof t.id === 'string') : []
  const rackSlotCount = 15

  const buildRackFromTiles = (tileList) => {
    const next = Array.from({ length: rackSlotCount }, () => null)
    for (let i = 0; i < Math.min(tileList.length, rackSlotCount); i++) {
      next[i] = tileList[i]
    }
    return next
  }

  const reconcileRack = (prevRack, incomingTiles) => {
    const prevPositions = new Map()
    for (let index = 0; index < prevRack.length; index++) {
      const t = prevRack[index]
      if (t?.id) prevPositions.set(t.id, index)
    }

    const next = Array.from({ length: rackSlotCount }, () => null)
    const remaining = []

    for (const tile of incomingTiles) {
      const prevIndex = prevPositions.get(tile.id)
      if (typeof prevIndex === 'number' && prevIndex >= 0 && prevIndex < rackSlotCount && next[prevIndex] === null) {
        next[prevIndex] = tile
      } else {
        remaining.push(tile)
      }
    }

    let freeIndex = 0
    for (const tile of remaining) {
      while (freeIndex < rackSlotCount && next[freeIndex] !== null) freeIndex++
      if (freeIndex >= rackSlotCount) break
      next[freeIndex] = tile
      freeIndex++
    }

    return next
  }
  
  const [items, setItems] = useState(buildRackFromTiles(validTiles))
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  )

  const handleDragStart = (event) => setActiveId(event.active.id)

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    setItems((currentRack) => {
      const oldIndex = currentRack.findIndex(t => t?.id === active.id)
      if (oldIndex === -1) return currentRack

      let newIndex = -1
      if (typeof over.id === 'string' && over.id.startsWith('slot-')) {
        const parsed = Number(over.id.slice('slot-'.length))
        newIndex = Number.isFinite(parsed) ? parsed : -1
      } else {
        newIndex = currentRack.findIndex(t => t?.id === over.id)
      }

      if (newIndex < 0 || newIndex >= rackSlotCount || newIndex === oldIndex) return currentRack

      const next = [...currentRack]
      const tmp = next[newIndex]
      next[newIndex] = next[oldIndex]
      next[oldIndex] = tmp ?? null

      if (onTilesReorder) {
        onTilesReorder(next.filter(Boolean))
      }

      return next
    })
  }

  const handleTileClick = (tile) => {
    if (onTileSelect) {
      onTileSelect(tile.id === selectedTileId ? null : tile.id)
    }
  }

  const handleSort = (mode) => {
    const currentTiles = Array.isArray(items) ? items.filter(Boolean) : []
    if (currentTiles.length === 0) return

    const colorOrder = { red: 0, black: 1, blue: 2, yellow: 3 }
    const validItems = currentTiles.filter(t => t && t.id)
    const sorted = [...validItems].sort((a, b) => {
      if (a.isJoker && !b.isJoker) return 1
      if (!a.isJoker && b.isJoker) return -1
      
      if (mode === 'number') {
        if (a.number !== b.number) return a.number - b.number
        return (colorOrder[a.color] || 0) - (colorOrder[b.color] || 0)
      } else {
        const aColorOrder = colorOrder[a.color] || 0
        const bColorOrder = colorOrder[b.color] || 0
        if (aColorOrder !== bColorOrder) return aColorOrder - bColorOrder
        return a.number - b.number
      }
    })

    const nextRack = buildRackFromTiles(sorted)
    setItems(nextRack)
    if (onTilesReorder) {
      onTilesReorder(sorted)
    }
  }

  useEffect(() => {
    if (Array.isArray(tiles)) {
      const validTiles = tiles.filter(t => t && t.id && typeof t.id === 'string')
      setItems((prev) => reconcileRack(Array.isArray(prev) ? prev : [], validTiles))
    }
  }, [tiles])

  const activeTile = activeId ? items.find(t => t?.id === activeId) : null

  const RackSlot = ({ slotIndex, tile }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `slot-${slotIndex}` })
    const hasTile = Boolean(tile && tile.id)

    return (
      <div
        ref={setNodeRef}
        className={`relative flex items-end justify-center w-16 h-[96px] rounded-xl transition-colors ${
          hasTile ? 'bg-white/5 border border-white/10' : 'bg-black/10 border border-dashed border-white/15'
        } ${isOver ? 'ring-2 ring-yellow-400/70 bg-yellow-500/10' : ''}`}
      >
        {hasTile ? (
          <Tile
            tile={tile}
            isDraggable={true}
            isSelected={selectedTileId === tile.id}
            onClick={() => handleTileClick(tile)}
            size="md"
          />
        ) : (
          <button
            type="button"
            className="absolute inset-0 rounded-xl"
            onClick={() => onTileSelect?.(null)}
            aria-label={`Leerer Slot ${slotIndex + 1}`}
          />
        )}
        <div className="pointer-events-none absolute bottom-0 left-1 right-1 h-2 rounded-b-xl bg-black/20" />
      </div>
    )
  }

  const renderRow = (startIndex, count) => {
    const cells = []
    for (let rowIndex = 0; rowIndex < count; rowIndex++) {
      const slotIndex = startIndex + rowIndex
      const tile = items?.[slotIndex] ?? null

      if (rowIndex === 4) {
        cells.push(<div key={`spacer-${slotIndex}`} className="w-4" />)
      }

      cells.push(<RackSlot key={`slot-${slotIndex}`} slotIndex={slotIndex} tile={tile} />)
    }
    return cells
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Deine Hand</h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-700/50 rounded-lg p-1 gap-1">
             <button 
              onClick={() => handleSort('color')}
              className="px-3 py-1 text-xs rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              title="Nach Farbe sortieren"
            >
              🎨 Farbe
            </button>
            <button 
              onClick={() => handleSort('number')}
              className="px-3 py-1 text-xs rounded-md bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              title="Nach Zahl sortieren"
            >
              🔢 Zahl
            </button>
          </div>
          <span className="badge badge-info">{items?.length || 0} Steine</span>
        </div>
      </div>

      <div className={`bg-board-dark rounded-xl p-4 border-2 shadow-2xl min-h-[280px] ${canDiscard ? 'border-yellow-500/50' : 'border-board-green'}`}>
        {canDiscard && !selectedTileId && (
          <div className="mb-3 p-2 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-center">
            <p className="text-sm text-yellow-300">Zum Beenden wähle einen Stein zum Abwerfen aus</p>
          </div>
        )}
        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={items.filter(Boolean).map(t => t.id)} strategy={rectSortingStrategy}>
            <div className="rounded-2xl p-3 bg-gradient-to-b from-amber-900/25 via-slate-900/20 to-amber-950/30 border border-amber-700/20 shadow-inner">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-start">{renderRow(0, 8)}</div>
                <div className="flex gap-2 items-start">{renderRow(8, 7)}</div>
              </div>
              <div className="mt-2 text-xs text-white/50">Tipp: Ziehen zum Umordnen, Klick zum Auswählen.</div>
            </div>
          </SortableContext>
           
          <DragOverlay>
            {activeTile ? (<div style={{ cursor: 'grabbing' }}><Tile tile={activeTile} size="md" isDraggable={false} /></div>) : null}
          </DragOverlay>
        </DndContext>

        {(!items || items.length === 0) && (
          <div className="text-center py-10 text-gray-400">
            <p>Keine Steine in der Hand</p>
            <p className="text-xs mt-2 opacity-50">Warte auf Spielstart...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// ABLAGESTAPEL-KOMPONENTE
// ==========================================
function DiscardPile({ tiles, onDrawFromDiscard, canDraw = false }) {
  const topTile = tiles.length > 0 ? tiles[tiles.length - 1] : null

  return (
    <div className="card bg-board-dark border-board-green">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Ablagestapel</h3>
        <span className="badge badge-info">{tiles.length} Steine</span>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[150px] bg-black/20 rounded-lg p-4">
        {topTile ? (
          <div className="relative">
            {tiles.length > 1 && (
              <>
                <div className="absolute -right-1 -top-1 w-16 h-22 bg-white/20 rounded-lg"></div>
                <div className="absolute -right-2 -top-2 w-16 h-22 bg-white/10 rounded-lg"></div>
              </>
            )}
            
            <div 
              className={canDraw ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
              onClick={canDraw ? onDrawFromDiscard : undefined}
            >
              <Tile tile={topTile} isDraggable={false} size="md" />
            </div>

            {canDraw && (
              <button onClick={onDrawFromDiscard} className="btn-secondary btn-sm mt-2 w-full">Ziehen</button>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">🃏</div>
            <p className="text-sm">Leer</p>
          </div>
        )}
      </div>

      {tiles.length > 1 && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-xs text-gray-400 mb-2">Letzte Würfe:</p>
          <div className="flex gap-1 overflow-x-auto">
            {tiles.slice(-5).reverse().map((tile, index) => (
              <div key={`${tile.id}-${index}`} className="flex-shrink-0">
                <Tile tile={tile} isDraggable={false} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// KOPFZEILEN-KOMPONENTE
// ==========================================
function Header({ isConnected, connectionStatus }) {
  const { user } = useUserStore()

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold">OKEY</div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Okey Multiplayer</h1>
              <p className="text-xs text-gray-400">Türkisches Rommé</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-full">
              <div className={`status-dot ${isConnected ? 'status-connected' : connectionStatus === 'connecting' ? 'status-connecting' : 'status-disconnected'}`}></div>
              <span className="text-sm font-medium hidden sm:inline">
                {connectionStatus === 'connected' ? 'Verbunden' : connectionStatus === 'connecting' ? 'Verbinde...' : 'Getrennt'}
              </span>
            </div>

            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-full">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{user.username}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

// ==========================================
// FUSSZEILEN-KOMPONENTE
// ==========================================
function Footer() {
  return (
    <footer className="bg-slate-800/30 border-t border-slate-700 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-400">Okey Multiplayer - Semesterprojekt 2025/26</p>
            <p className="text-xs text-gray-500">Entwickelt mit React, Node.js & Socket.io</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              <span className="text-xl">📂</span>
            </a>
            <span className="text-gray-600">|</span>
            <span className="text-xs text-gray-500">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ==========================================
// RAUM ERSTELLEN - KOMPONENTE
// ==========================================
function CreateRoom({ onClose, onCreate }) {
  const [roomName, setRoomName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (roomName.trim()) {
      onCreate(roomName.trim(), maxPlayers)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="card max-w-md w-full animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Neuen Raum erstellen</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-2">Raumname</label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="z.B. Gemütliche Runde"
              className="input-field"
              maxLength={30}
              required
            />
          </div>

          <div>
            <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-300 mb-2">Max. Spieler</label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMaxPlayers(num)}
                  className={`py-3 rounded-lg font-semibold transition-all ${
                    maxPlayers === num ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {num} Spieler
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Abbrechen</button>
            <button type="submit" className="btn-primary flex-1" disabled={!roomName.trim()}>Erstellen</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==========================================
// RAUMLISTEN-KOMPONENTE
// ==========================================
function RoomList({ rooms, onJoinRoom }) {
  if (!rooms || rooms.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">🎲</div>
        <h3 className="text-xl font-semibold mb-2">Keine Räume verfügbar</h3>
        <p className="text-gray-400">Erstelle einen neuen Raum, um zu spielen!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} onJoin={onJoinRoom} />
      ))}
    </div>
  )
}

function RoomCard({ room, onJoin }) {
  const isFull = room.players.length >= room.maxPlayers
  const isPlaying = room.status === 'playing'
  const canJoin = !isFull && !isPlaying

  return (
    <div className="card hover:border-blue-500/50 transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1">{room.name}</h3>
          <p className="text-xs text-gray-400">ID: {room.id.substring(0, 12)}...</p>
        </div>
        
        {isPlaying ? (
          <span className="badge badge-warning">Läuft</span>
        ) : isFull ? (
          <span className="badge badge-info">Voll</span>
        ) : (
          <span className="badge badge-success">Offen</span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1">
          {[...Array(room.maxPlayers)].map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                i < room.players.length ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-500'
              }`}
            >
              {i < room.players.length ? '👤' : ''}
            </div>
          ))}
        </div>
        <span className="text-sm text-gray-400">{room.players.length}/{room.maxPlayers}</span>
      </div>

      <button
        onClick={() => onJoin(room.id)}
        disabled={!canJoin}
        className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
          canJoin ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isPlaying ? 'Spiel läuft' : isFull ? 'Raum voll' : 'Beitreten'}
      </button>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Erstellt: {new Date(room.createdAt).toLocaleTimeString('de-DE')}
      </p>
    </div>
  )
}

// ==========================================
// SPIELBRETT-KOMPONENTE (SPIEL)
// ==========================================
function Board() {
  const { gameState, setGameState } = useGameStore()
  const { user } = useUserStore()
  const [selectedTiles, setSelectedTiles] = useState([])
  const [devModeOpen, setDevModeOpen] = useState(false)

  if (!gameState || !gameState.players || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#15202b]">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Fehler</h2>
          <p className="text-gray-300">Spielzustand konnte nicht geladen werden.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const unsubscribeGameStateUpdated = socketService.on('game_state_updated', (data) => {
      if (data?.gameState) {
        console.log('📥 Frontend: Empfangene game_state_updated')
        setGameState(data.gameState)
        // Nicht mehr clearen - gameState ist die Source of Truth
      }
    })

    const unsubscribeGameOver = socketService.on('gameOver', (data) => {
      const winnerName = data?.winnerName || 'Unbekannt'
      alert(`🎉 Spiel vorbei! ${winnerName} hat gewonnen!`)
      if (data?.gameState) {
        setGameState(data.gameState)
      }
    })

    return () => {
      unsubscribeGameStateUpdated()
      unsubscribeGameOver()
    }
  }, [setGameState])

  // Dev-Modus Tastaturkürzel: Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setDevModeOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const currentPlayer = gameState.players.find(p => p?.id === user?.id)
  
  if (!currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#15202b]">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Fehler</h2>
          <p className="text-gray-300">Dein Spieler wurde nicht gefunden.</p>
        </div>
      </div>
    )
  }

  // Verwende DIREKT gameState, nicht devHandOverride
  const actualHand = currentPlayer.hand

  const isMyTurn = gameState.currentPlayerId === user?.id
  const canDraw = isMyTurn && !currentPlayer?.hasDrawn
  const canDiscard = isMyTurn && currentPlayer?.hasDrawn && !currentPlayer?.hasDiscarded

  const handleTilesReorder = (newOrder) => {
    const updatedPlayers = gameState.players.map(p => 
      p.id === user?.id ? { ...p, hand: newOrder } : p
    )
    setGameState({ ...gameState, players: updatedPlayers })
  }

  const handleDrawTile = () => {
    socketService.sendMove(gameState.roomId, { type: 'draw', fromDiscard: false })
  }

  const handleDrawFromDiscard = () => {
    socketService.sendMove(gameState.roomId, { type: 'draw', fromDiscard: true })
  }

  const handleSelectDiscard = (tileId) => {
    setSelectedTiles(tileId ? [tileId] : [])
  }

  const handleConfirmTurnEnd = () => {
    if (selectedTiles.length !== 1) return
    socketService.sendMove(gameState.roomId, { type: 'discard', tileId: selectedTiles[0] })
    setSelectedTiles([])
  }

  const handleDeclareWin = () => {
    if (!selectedTiles.length) {
      alert('Bitte wähle zuerst den Stein aus, den du abwerfen würdest.')
      return
    }

    if (confirm('Möchtest du Okey erklären und mit deiner Hand gewinnen?')) {
      socketService.sendMove(gameState.roomId, { type: 'declare', discardTileId: selectedTiles[0] })
    }
  }

  const handleUpdateTile = (index, newTileData) => {
    // Aktualisiere DIREKT im gameState, nicht im Override
    const updatedPlayers = gameState.players.map(p => {
      if (p.id === user?.id) {
        const updatedHand = [...p.hand]
        const oldTile = updatedHand[index]
        updatedHand[index] = {
          ...oldTile,
          ...newTileData
        }
        console.log(`Frontend: Aktualisiere Stein ${index} lokal, sende an Server:`, updatedHand.map(t => t.id))
        // Sende an Server
        socketService.updateDevHand(gameState.roomId, updatedHand)
        // Lokal im State aktualisieren
        return { ...p, hand: updatedHand }
      }
      return p
    })
    setGameState({ ...gameState, players: updatedPlayers })
  }

  const handleGenerateValidHand = () => {
    // Generiere eine gültige 15-Steine Hand
    const validHand = [
      // Rot 1-2-3
      { id: 'dev_tile_0', color: 'red', number: 1, isJoker: false },
      { id: 'dev_tile_1', color: 'red', number: 2, isJoker: false },
      { id: 'dev_tile_2', color: 'red', number: 3, isJoker: false },
      // Blau 4-5-6-7
      { id: 'dev_tile_3', color: 'blue', number: 4, isJoker: false },
      { id: 'dev_tile_4', color: 'blue', number: 5, isJoker: false },
      { id: 'dev_tile_5', color: 'blue', number: 6, isJoker: false },
      { id: 'dev_tile_6', color: 'blue', number: 7, isJoker: false },
      // Schwarz 8-9-10
      { id: 'dev_tile_7', color: 'black', number: 8, isJoker: false },
      { id: 'dev_tile_8', color: 'black', number: 9, isJoker: false },
      { id: 'dev_tile_9', color: 'black', number: 10, isJoker: false },
      // Gelb 11-12-13-1
      { id: 'dev_tile_10', color: 'yellow', number: 11, isJoker: false },
      { id: 'dev_tile_11', color: 'yellow', number: 12, isJoker: false },
      { id: 'dev_tile_12', color: 'yellow', number: 13, isJoker: false },
      { id: 'dev_tile_13', color: 'yellow', number: 1, isJoker: false },
      // EXTRA Stein zum Abwerfen
      { id: 'dev_tile_14', color: 'red', number: 5, isJoker: false }
    ]
    
    // Update DIREKT im gameState
    const updatedPlayers = gameState.players.map(p => {
      if (p.id === user?.id) {
        console.log('✨ Frontend: Generiere gültige Hand lokal, sende an Server')
        socketService.updateDevHand(gameState.roomId, validHand)
        return { ...p, hand: validHand }
      }
      return p
    })
    setGameState({ ...gameState, players: updatedPlayers })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-board-dark via-board-green to-board-dark p-4">
      <TileEditorModal
        isOpen={devModeOpen}
        onClose={() => setDevModeOpen(false)}
        hand={actualHand}
        onUpdateTile={handleUpdateTile}
        onGenerateValidHand={handleGenerateValidHand}
      />
      
      <div className="max-w-7xl mx-auto space-y-4">{/* Dev Mode Hint */}
        {devModeOpen && (
          <div className="card bg-yellow-500/10 border-2 border-yellow-500/50">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">[DEV]</span>
              <div>
                <p className="font-bold text-yellow-400">DEV MODE AKTIV</p>
                <p className="text-sm text-gray-300">Drücke Ctrl+Shift+D zum Schließen</p>
              </div>
            </div>
          </div>
        )}
        {/* Game Header */}
        <div className="card bg-slate-800/90">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold">Spiel läuft</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-400">Zug {gameState.turnNumber}</p>
                <span className="text-gray-500">•</span>
                <div className={`px-3 py-1 rounded-full font-semibold text-sm ${
                  isMyTurn ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-700/50 text-gray-400'
                }`}>
                  {isMyTurn ? 'DEIN ZUG' : 'Warten...'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {gameState.indicator && (
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">Indikator</p>
                  <Tile tile={gameState.indicator} isDraggable={false} size="sm" />
                </div>
              )}

              {gameState.joker && (
                <div className="text-center">
                  <p className="text-xs text-yellow-400 mb-1">Okey (Joker)</p>
                  <Tile 
                    tile={{
                      id: 'joker-display',
                      color: gameState.joker.color,
                      number: gameState.joker.number,
                      isJoker: true
                    }} 
                    isDraggable={false} 
                    size="sm" 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Side - Deck & Discard */}
          <div className="space-y-4">
            <div className="card bg-board-dark border-board-green">
              <h3 className="text-lg font-semibold mb-3">Nachziehstapel</h3>
              <div className="flex flex-col items-center justify-center min-h-[150px] bg-black/20 rounded-lg p-4">
                <div className="relative">
                  <div className="absolute -right-2 -top-2 w-16 h-22 bg-blue-600/30 rounded-lg"></div>
                  <div className="absolute -right-1 -top-1 w-16 h-22 bg-blue-600/50 rounded-lg"></div>
                  <div className={`w-16 h-22 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold border-2 ${
                    canDraw ? 'border-green-400 shadow-lg shadow-green-500/50' : 'border-blue-400'
                  }`}>
                    🎴
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-3">{gameState.deckSize} Steine</p>
                <button
                  onClick={handleDrawTile}
                  disabled={!canDraw}
                  className={`btn-sm mt-3 ${canDraw ? 'btn-primary' : 'btn-disabled'}`}
                >
                  {canDraw ? '✓ Ziehen' : '✗ Nicht verfügbar'}
                </button>
              </div>
            </div>

            <DiscardPile
              tiles={gameState.discardPile}
              onDrawFromDiscard={handleDrawFromDiscard}
              canDraw={canDraw}
            />
          </div>

          {/* Center - Other Players */}
          <div className="space-y-4">
            <div className="card bg-slate-800/90">
              <h3 className="text-lg font-semibold mb-3">Andere Spieler</h3>
              <div className="space-y-2">
                {gameState.players.filter(p => p.id !== user?.id).map(player => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-lg ${
                      gameState.currentPlayerId === player.id ? 'bg-green-500/20 border border-green-500/40' : 'bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm">
                          {player.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{player.username}</span>
                      </div>
                      <span className="badge badge-info">{player.handSize} Steine</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isMyTurn && currentPlayer?.hasDrawn && (
              <div className={`card ${selectedTiles.length === 1 ? 'bg-indigo-900/50 border-indigo-500' : 'bg-slate-800/90'} transition-colors`}>
                <h3 className="text-lg font-semibold mb-3">Zug beenden</h3>
                <div className="space-y-3">
                  {!selectedTiles.length ? (
                    <div className="text-center p-4 border border-dashed border-gray-600 rounded-lg text-gray-400">
                      Wähle einen Stein zum Abwerfen
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={handleConfirmTurnEnd} className="btn-primary w-1/2 flex flex-col items-center py-3">
                        <span className="text-lg">→</span>
                        <span>Zug beenden</span>
                      </button>
                      
                      <button onClick={handleDeclareWin} className="btn-success w-1/2 flex flex-col items-center py-3">
                        <span className="text-lg">◆</span>
                        <span>Okey erklären</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Info */}
          <div className="card bg-slate-800/90">
            <h3 className="text-lg font-semibold mb-3">Spielinfo</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <p className="text-sm text-blue-300 font-semibold mb-1">Spielablauf:</p>
                <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Ziehe einen Stein vom Stapel oder Ablage</li>
                  <li>Ordne deine Steine</li>
                  <li>Wähle einen Stein zum Abwerfen</li>
                  <li>Entscheide: Zug beenden oder Gewinnen</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Player's Hand */}
        <PlayerHand
          tiles={actualHand || []}
          onTilesReorder={handleTilesReorder}
          onTileSelect={handleSelectDiscard}
          selectedTileId={selectedTiles[0] || null}
          canDiscard={isMyTurn && currentPlayer?.hasDrawn}
        />
      </div>
    </div>
  )
}

// ==========================================
// LOBBY-KOMPONENTE
// ==========================================
function Lobby() {
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const { rooms, currentRoom, gameState, isPlaying, setRooms, setCurrentRoom, clearCurrentRoom, setGameState, setIsPlaying } = useGameStore()
  const { user } = useUserStore()
  const [roomPlayers, setRoomPlayers] = useState([])

  useEffect(() => {
    socketService.getRooms()

    const unsubscribeRoomsList = socketService.on('roomsList', (roomsList) => setRooms(roomsList))
    const unsubscribeRoomsUpdated = socketService.on('roomsUpdated', (roomsList) => setRooms(roomsList))
    const unsubscribeRoomCreated = socketService.on('roomCreated', (data) => {
      setCurrentRoom(data.room)
      if (data.players) setRoomPlayers(data.players)
      setShowCreateRoom(false)
    })
    const unsubscribePlayerJoined = socketService.on('playerJoined', (data) => {
      if (data.room) setCurrentRoom(data.room)
      if (data.players) setRoomPlayers(data.players)
    })
    const unsubscribeGameStarted = socketService.on('gameStarted', (data) => {
      if (data?.gameState) {
        setGameState(data.gameState)
        setIsPlaying(true)
      }
    })
    const unsubscribeError = socketService.on('serverError', (error) => alert(error.message))

    return () => {
      unsubscribeRoomsList()
      unsubscribeRoomsUpdated()
      unsubscribeRoomCreated()
      unsubscribePlayerJoined()
      unsubscribeGameStarted()
      unsubscribeError()
    }
  }, [setRooms, setCurrentRoom, setGameState, setIsPlaying])

  const handleJoinRoom = (roomId) => socketService.joinRoom(roomId)
  const handleCreateRoom = (roomName, maxPlayers) => socketService.createRoom(roomName, maxPlayers)
  const handleLeaveRoom = () => {
    socketService.leaveRoom()
    clearCurrentRoom()
  }
  const handleStartGame = () => socketService.startGame()

  if (isPlaying && gameState) {
    return <Board />
  }

  if (currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-2xl w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{currentRoom.name}</h2>
              <p className="text-gray-400 text-sm">Raum-ID: {currentRoom.id.substring(0, 12)}...</p>
            </div>
            <button onClick={handleLeaveRoom} className="btn-danger">Verlassen</button>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Spieler ({roomPlayers.length}/{currentRoom.maxPlayers})</h3>
              <div className="space-y-2">
                {roomPlayers.map((player) => (
                  <div key={player.id} className="flex items-center gap-3 bg-slate-600/50 rounded-lg p-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      {player.id === user?.id ? 'YOU' : 'AI'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{player.username}</p>
                      {player.id === currentRoom.host && <span className="text-xs text-yellow-400">Host</span>}
                    </div>
                    {player.id === user?.id && <span className="badge badge-info">Du</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {currentRoom.host === user?.id && (
                <button onClick={handleStartGame} className="btn-primary w-full" disabled={currentRoom.players.length < 2}>
                  Spiel starten ({currentRoom.players.length}/4 Spieler)
                </button>
              )}
              {currentRoom.host !== user?.id && (
                <div className="text-center w-full p-3 bg-slate-700/50 rounded-lg text-gray-400">
                  Warte auf Host zum Starten...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-white">Okey Lobby</h1>
          <p className="text-gray-400">Willkommen, <span className="font-semibold text-white">{user?.username}</span>!</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button onClick={() => setShowCreateRoom(true)} className="btn-primary flex items-center gap-2">
            <span className="text-xl">+</span>Raum erstellen
          </button>
          <button onClick={() => socketService.getRooms()} className="btn-secondary flex items-center gap-2">
            <span className="text-xl">🔄</span>Aktualisieren
          </button>
        </div>

        <RoomList rooms={rooms} onJoinRoom={handleJoinRoom} />

        {showCreateRoom && <CreateRoom onClose={() => setShowCreateRoom(false)} onCreate={handleCreateRoom} />}
      </div>
    </div>
  )
}

// ==========================================
// HAUPT-APP-KOMPONENTE
// ==========================================
function App() {
  const { isConnected, connectionStatus, subscribe } = useSocket()
  const { user, isRegistered, setUser } = useUserStore()
  const { reset: resetGame } = useGameStore()
  const [username, setUsername] = useState('')

  useEffect(() => {
    socketService.connect()

    const unsubscribe = subscribe('registrationSuccess', (data) => {
      setUser(data)
    })

    return () => {
      socketService.disconnect()
      unsubscribe()
      resetGame()
    }
  }, [subscribe, setUser, resetGame])

  const handleRegister = (e) => {
    e.preventDefault()
    if (username.trim()) {
      socketService.registerPlayer(username.trim())
    }
  }

  // Show registration screen if not registered
  if (!isRegistered) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isConnected={isConnected} connectionStatus={connectionStatus} />
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="card max-w-md w-full space-y-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2 text-white">
                Okey Multiplayer
              </h1>
              <p className="text-gray-400">Türkisches Rommé Online</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Benutzername
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Dein Name..."
                  className="input-field"
                  maxLength={20}
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">
                  Wähle einen Namen für das Spiel
                </p>
              </div>
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={!isConnected || !username.trim()}
              >
                {isConnected ? 'Weiter zur Lobby' : 'Verbinde mit Server...'}
              </button>
            </form>

            {/* Connection Info */}
            <div className="pt-4 border-t border-slate-700">
              <p className="text-xs text-gray-500 text-center">
                WebSocket Verbindung zu localhost:3001
              </p>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header isConnected={isConnected} connectionStatus={connectionStatus} />
      
      <main className="flex-1">
        <Lobby />
      </main>

      <Footer />
    </div>
  )
}

export default App
