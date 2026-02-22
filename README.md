# 🎮 Okey Multiplayer - Semesterprojekt

Ein vollständig funktionsfähiges Browser-basiertes Multiplayer-Spiel des türkischen Rommé-Spiels "Okey".

## 🎯 Über das Projekt

Dieses Projekt wurde als Seminararbeit für Web-Technologien entwickelt. Es handelt sich um eine vollständige Echtzeit-Multiplayer-Webanwendung mit konsolidierter Codestruktur, bei der alle Komponenten, Services und Modelle in einzelnen Dateien zusammengefasst sind.

## 🛠️ Technologien

### Backend
- **Node.js** mit Express.js - Web-Server
- **Socket.io** - Echtzeit-Kommunikation zwischen Clients
- In-Memory Storage - Spielzustands-Verwaltung

### Frontend
- **React 18** mit Vite - UI Framework & Build-Tool
- **Tailwind CSS** - Utility-First Styling
- **Zustand** - Leichtgewichtiges State Management
- **@dnd-kit** - Drag & Drop für Spielsteine
- **Socket.io-client** - WebSocket-Verbindung zum Server

## ✨ Features

- 🎮 **Vollständige Okey-Spielmechanik** - Alle Spielregeln implementiert
- 👥 **Multiplayer-Lobby** - Erstelle/Trete Räumen bei (2-4 Spieler)
- 🎯 **Drag & Drop Interface** - Intuitive Stein-Verwaltung
- ⚡ **Echtzeit-Synchronisation** - Socket.io für Live-Updates
- 🎨 **Modernes UI** - Responsive Design mit Tailwind CSS
- 🔄 **Automatische Validierung** - Gewinn-Bedingungen werden geprüft
- 🛠️ **Dev-Mode** (Ctrl+Shift+D) - Steine manuell bearbeiten zum Testen

## 📁 Projektstruktur

```
okey-multiplayer/
├── backend/
│   └── src/
│       └── server.js        # Konsolidierter Backend-Code
│                            # (Models, Services, Socket-Handler)
├── frontend/
│   └── src/
│       ├── App.jsx          # Alle UI-Komponenten konsolidiert
│       ├── store.js         # Zustand Stores + Socket Service
│       └── utils/
│           └── constants.js # Frontend-Konstanten
│
└── shared/
    └── constants.js         # Gemeinsame Konstanten (Backend/Frontend)
```

**Konsolidierte Architektur:** Alle zusammengehörigen Code-Teile sind in einzelnen Dateien gebündelt für bessere Übersicht und einfachere Wartung.

## 🚀 Installation & Start

### Voraussetzungen

### Option 1: Lokal mit npm (Development)

**Backend starten:**
```bash
cd backend
npm install
npm run dev
```
Server läuft auf **http://localhost:3001**


**Frontend starten:**
```bash
cd frontend
npm install
npm run dev
```
App läuft auf **http://localhost:5173**


### Option 2: Docker (Production)

**Mit Docker Compose (empfohlen):**
```bash
# Alle Container bauen und starten
docker-compose up --build

# Im Hintergrund laufen lassen
docker-compose up -d

# Stoppen
docker-compose down
```

App läuft auf **http://localhost** (Port 80)  
Backend läuft auf **http://localhost:3001**

**Einzelne Container:**
```bash
# Backend
cd backend
docker build -t okey-backend .
docker run -p 3001:3001 okey-backend

# Frontend
cd frontend
docker build -t okey-frontend .
docker run -p 80:80 okey-frontend
```

### Deployment auf Cloud-Plattformen

Die containerisierte App kann einfach deployed werden auf:
- **Render.com** (kostenlos)
- **Railway.app** (kostenlos)
- **Fly.io** (kostenlos)
- **DigitalOcean App Platform**
- **AWS / Google Cloud / Azure**

## 🎲 Spielregeln (Okey)

**Okey** ist ein traditionelles türkisches Kachelspiel, ähnlich wie Rommé.

### Spielmaterial
- **104 Steine:** 4 Farben (Rot, Schwarz, Blau, Gelb) × 13 Zahlen × 2 Sets
- **Dynamische Joker:** Jeweils 2 Steine pro Farbe und Zahl, wobei einer als Joker fungiert (abhängig vom Spiel. Wird automatisch bestimmt).

### Spielablauf
1. Jeder Spieler erhält **14 Steine**
2. Ein **Joker** wird bestimmt (automatisch durch das System)
3. Der aktive Spieler zieht einen Stein (vom Stapel oder Ablage)
4. Danach muss ein Stein abgeworfen werden
5. Ziel: Alle 14 Steine in gültige Kombinationen bringen (und den 15. Stein abwerfen)

### Gewinn-Bedingungen
Um zu gewinnen, müssen alle 14 Steine in folgenden Kombinationen organisiert sein:

- **Set (Gruppe):** 3-4 Steine mit gleicher Zahl, aber verschiedenen Farben
  - Beispiel: Rot 5, Blau 5, Gelb 5
  
- **Run (Sequenz):** 3+ aufeinanderfolgende Zahlen in der gleichen Farbe
  - Beispiel: Rot 3, Rot 4, Rot 5, Rot 6

- **Paar:** 2 identische Steine (für das letzte Paar)

**Okey (Joker)** können als Ersatz für jeden beliebigen Stein verwendet werden.

## 📡 Technische Details

### Socket.io Events

**Client → Server:**
- `register_player` - Spieler registrieren
- `create_room` - Neuen Raum erstellen
- `join_room` - Bestehendem Raum beitreten
- `leave_room` - Raum verlassen
- `player_ready` - Bereitschaft signalisieren
- `start_game` - Spiel starten (nur Host)
- `send_move` - Spielzug senden (draw/discard/declare)

**Server → Client:**
- `registration_success` - Registrierung bestätigt
- `room_created` - Raum erfolgreich erstellt
- `rooms_updated` - Aktualisierte Raumliste
- `player_joined` / `player_left` - Spieler-Bewegungen
- `game_started` - Spiel wurde gestartet
- `game_state_updated` - Spielzustand aktualisiert
- `game_over` - Spiel beendet (mit Gewinner)
- `error` - Fehler aufgetreten

### Implementierte Services (Backend)

- **TileService** - Deck erstellen, mischen, verteilen
- **ValidationService** - Gewinn-Bedingungen prüfen
- **GameService** - Spiellogik (Züge, Spielzustand)
- **Logger** - Strukturiertes Logging

## 🎮 Spielanleitung

1. **Registrierung:** Benutzernamen eingeben
2. **Lobby:** Raum erstellen oder bestehendem beitreten
3. **Warten:** Auf weitere Spieler warten (mind. 2, max. 4)
4. **Spiel starten:** Host startet das Spiel
5. **Spielen:**
   - Stein vom Stapel oder Ablage ziehen
   - Steine per Drag & Drop sortieren
   - Stein zum Abwerfen auswählen
   - "Zug beenden" oder "Okey erklären" (bei Gewinn)
6. **Gewinnen:** Alle Steine in gültigen Kombinationen → "Okey erklären"

## 🛠️ Dev-Modus

Drücke **Ctrl+Shift+D** im Spiel um den Entwickler-Modus zu öffnen:
- Steine manuell bearbeiten (Farbe, Zahl, Joker)
- Gültige Hand automatisch generieren zum Testen
- Hilfreich für Debugging und Präsentationen

## 👥 Autoren

Semesterprojekt - Web Technologien  
3 Studenten

## 📝 Lizenz

MIT License - Bildungsprojekt
