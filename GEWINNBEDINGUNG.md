# Okey Gewinnbedingung Erklärung

## Wann löst die Gewinnbedingung aus?

### 1. **Spieler muss "Okey erklären"**
Der Spieler muss aktiv den Sieg erklären durch:
- Button "🏆 Okey erklären!" im Frontend
- Sendet `{ type: 'declare', discardTileId: ... }` an Server

### 2. **Handgröße muss 14 Steine betragen**
Nach dem Abwerfen des ausgewählten Steins muss die Hand **exakt 14 Steine** haben.

```javascript
// Backend: server.js Zeile ~472
declareWin(roomId, playerId, discardTileId = null) {
  let handToValidate = [...player.hand]
  if (discardTileId) {
    handToValidate = handToValidate.filter(t => t.id !== discardTileId)
  }
  if (handToValidate.length !== 14) {
    throw new Error('Ungültige Handgröße. Man braucht 14 Steine zum Gewinnen.')
  }
  // ...
}
```

### 3. **Hand muss gültiges Okey bilden**
Die 14 Steine müssen **vollständig in Gruppen** aufteilbar sein:

#### Gültige Gruppen:
- **Sequenz (Run)**: 3-4 Steine derselben Farbe in aufsteigender Folge
  - Beispiel: Rot 5-6-7 oder Blau 11-12-13-1
  - Zahlen rotieren: Nach 13 kommt 1

- **Set**: 3-4 Steine mit **derselben Zahl** aber **verschiedenen Farben**
  - Beispiel: Rote 8, Schwarze 8, Blaue 8
  - Keine doppelten Farben erlaubt!

#### Joker als Wildcard:
- Steine mit `isJoker: true` können **jede Rolle** einnehmen
- Füllen fehlende Positionen in Sequenzen/Sets
- Werden separat gezählt und flexibel eingesetzt

```javascript
// Backend: server.js Zeile ~322
static validateHand(hand, joker, indicator) {
  const tiles = []
  const wildcards = []
  hand.forEach(t => {
    if (t.isJoker) {
      wildcards.push(t)  // Joker separat sammeln
    } else {
      tiles.push({ ...t, isWildcard: false })
    }
  })
  return this.canPartition(tiles, wildcards.length)
}
```

### 4. **Partitionierungs-Algorithmus**

Der Algorithmus (`canPartition`) versucht **rekursiv** alle möglichen Gruppierungen:

```javascript
// Backend: server.js Zeile ~338
static canPartition(tiles, wildcardCount) {
  // Basisfall: Alle Steine aufgeteilt
  if (tiles.length === 0 && wildcardCount >= 0) {
    return true
  }
  
  // Sortiere Steine für systematisches Durchprobieren
  tiles.sort((a, b) => { /* ... */ })
  
  const current = tiles[0]  // Nimm ersten Stein
  const remaining = tiles.slice(1)
  
  // Probiere alle möglichen Gruppierungen
  if (this.tryRun(current, remaining, wildcardCount, 3)) return true
  if (this.tryRun(current, remaining, wildcardCount, 4)) return true
  if (this.trySet(current, remaining, wildcardCount, 3)) return true
  if (this.trySet(current, remaining, wildcardCount, 4)) return true
  
  return false  // Keine gültige Gruppierung gefunden
}
```

#### Beispiel: `tryRun` (Sequenz prüfen)
```javascript
static tryRun(startTile, otherTiles, wildcardCount, length) {
  // Ziel: Sequenz wie Rot 5-6-7 (length=3) oder Rot 5-6-7-8 (length=4)
  const targetSequence = []
  let nextNum = startTile.number
  
  for (let i = 0; i < length; i++) {
    targetSequence.push(nextNum)
    nextNum++
    if (nextNum > 13) nextNum = 1  // Rotation: 13 → 1
  }
  
  // Suche passende Steine oder verwende Joker
  for (let i = 1; i < length; i++) {
    const targetNum = targetSequence[i]
    const matchIndex = otherTiles.findIndex(t => 
      t.color === startTile.color && t.number === targetNum
    )
    
    if (matchIndex !== -1) {
      usedIndices.push(matchIndex)  // Stein gefunden
    } else {
      if (currentWildcards > 0) {
        currentWildcards--  // Joker einsetzen
      } else {
        return false  // Nicht möglich
      }
    }
  }
  
  // Prüfe Rest der Hand rekursiv
  const nextTiles = otherTiles.filter((_, idx) => !usedIndices.includes(idx))
  return this.canPartition(nextTiles, currentWildcards)
}
```

## Zusammenfassung

**Gewinnbedingung trifft zu wenn:**
1. ✅ Spieler erklärt aktiv "Okey"
2. ✅ Hand hat nach Abwurf exakt 14 Steine
3. ✅ Alle 14 Steine lassen sich in gültige 3er/4er Gruppen aufteilen
4. ✅ Gruppen sind entweder Sequenzen (gleiche Farbe, aufsteigende Zahlen) oder Sets (gleiche Zahl, verschiedene Farben)
5. ✅ Joker können flexibel als Platzhalter eingesetzt werden

**Typisches Gewinner-Beispiel:**
- Rot 1-2-3 (Sequenz)
- Blau 5-6-7-8 (Sequenz)
- Rote 10, Schwarze 10, Blaue 10 (Set)
- Gelb 11-12-⭐ (Sequenz mit Joker)

= **14 Steine** vollständig aufgeteilt ✅
