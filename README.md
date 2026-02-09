# 🎮 Okey Multiplayer - Semesterprojekt

Ein vollständiges Browser-basiertes Multiplayer-Spiel des türkischen Rommé-Spiels "Okey".

## 🎯 Projektziel

Entwicklung einer modernen Web-Anwendung mit Echtzeit-Multiplayer-Funktionalität als Semesterprojekt. Fokus auf Code-Qualität, saubere Architektur und akademische Anforderungen.

## 🛠️ Tech-Stack

### Backend
- **Node.js** mit Express.js
- **Socket.io** für Echtzeit-Kommunikation
- In-Memory Storage (später optional: PostgreSQL/MongoDB)

### Frontend
- **React 18** mit Vite
- **Tailwind CSS** für Styling
- **Zustand** für State Management
- **dnd-kit** für Drag & Drop
- **Socket.io-client** für Websocket-Verbindung

## 📁 Projektstruktur

```
okey-multiplayer/
├── backend/          # Node.js Server
│   ├── src/
│   │   ├── config/   # Konfiguration
│   │   ├── models/   # Datenmodelle
│   │   ├── services/ # Business-Logik
│   │   ├── utils/    # Hilfsfunktionen
│   │   └── server.js # Hauptserver
│   └── package.json
│
├── frontend/         # React App
│   ├── src/
│   │   ├── components/  # React-Komponenten
│   │   ├── hooks/       # Custom Hooks
│   │   ├── store/       # State Management
│   │   └── services/    # API/Socket Services
│   └── package.json
│
└── shared/          # Gemeinsame Konstanten/Typen
    └── constants.js
```

## 🚀 Installation & Start

### Backend

```bash
cd backend
npm install
npm run dev
```

Der Server läuft auf `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Die App läuft auf `http://localhost:5173`

## 🎲 Spielregeln (Okey)

### Spielmaterial
- 106 Steine total:
  - 4 Farben (Rot, Schwarz, Blau, Gelb)
  - Zahlen 1-13 (jeweils doppelt vorhanden)
  - 2 falsche Joker

### Spielablauf
1. Jeder Spieler erhält 14 Steine
2. Ein Indikator-Stein wird gezogen (bestimmt den Okey/Joker)
3. Spieler ziehen und werfen Steine ab
4. Ziel: Gültige Kombinationen bilden

### Gewinn-Kombinationen
- **Set**: 3-4 Steine gleicher Zahl, verschiedene Farben
- **Run**: 3+ aufeinanderfolgende Steine gleicher Farbe
- **Gewinn**: Alle Steine in gültigen Kombinationen + 1 Paar

## 📡 Socket.io Events

### Client → Server
- `register_player` - Spieler registrieren
- `create_room` - Raum erstellen
- `join_room` - Raum beitreten
- `leave_room` - Raum verlassen
- `player_ready` - Bereitschaft signalisieren
- `start_game` - Spiel starten
- `send_move` - Spielzug senden

### Server → Client
- `registration_success` - Registrierung bestätigt
- `room_created` - Raum erstellt
- `rooms_updated` - Raumliste aktualisiert
- `player_joined` - Spieler beigetreten
- `player_left` - Spieler verlassen
- `game_started` - Spiel gestartet
- `move_made` - Zug ausgeführt
- `error` - Fehler aufgetreten

## 🔧 Nächste Schritte

1. ✅ Backend-Server mit Socket.io implementiert
2. ⏳ Frontend-Setup mit React + Vite
3. ⏳ Lobby-System implementieren
4. ⏳ Spiellogik entwickeln
5. ⏳ Drag & Drop für Spielsteine
6. ⏳ Gewinn-Validierung implementieren
7. ⏳ UI/UX Design & Styling

## 👥 Team

3 Studenten - Semesterprojekt

## 📝 Lizenz

MIT License - Bildungsprojekt
