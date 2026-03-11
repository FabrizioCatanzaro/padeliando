import { useState, useEffect } from "react";
import {
  loadCurrentTournament, saveTournamentLocal, deleteCurrentTournament,
  getPlayersDB, savePlayersDB, resolvePlayer,
} from "../utils/storage";
import { uid } from "../utils/helpers";

export function useTournament() {
  const [mode, setMode]           = useState("loading");
  const [tournament, setTournament] = useState(null);
  const [readonlyId, setReadonlyId] = useState(null);
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#readonly:")) {
      setReadonlyId(hash.slice(10));
      setMode("readonly");
    } else {
      const existing = loadCurrentTournament();
      if (existing) { setTournament(existing); setMode("main"); }
      else setMode("setup");
    }
  }, []);

  function persist(t) {
    setTournament(t);
    saveTournamentLocal(t);
  }

  /**
   * playerNames: string[]
   * pairsInput: [{ p1Name, p2Name }] | null  (null → free mode)
   */
  async function handleCreate(name, playerNames, pairsInput) {
    let db = getPlayersDB();
    const players = [];
    for (const n of playerNames.filter(Boolean)) {
      const { player, db: newDb } = resolvePlayer(n, db);
      db = newDb;
      players.push(player);
    }
    savePlayersDB(db);

    const pairs = pairsInput
      ? pairsInput.map(({ p1Name, p2Name }) => {
          const p1 = players.find((p) => p.name.toLowerCase() === p1Name.toLowerCase());
          const p2 = players.find((p) => p.name.toLowerCase() === p2Name.toLowerCase());
          return { id: uid(), p1: p1?.id, p2: p2?.id };
        })
      : [];

    const t = {
      id: uid(),
      name,
      createdAt: new Date().toISOString(),
      mode: pairsInput ? "pairs" : "free",
      players,
      pairs,
      matches: [],
    };
    persist(t);
    setMode("main");
  }

  function handleUpdate(updated) {
    persist(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleReset() {
    deleteCurrentTournament();
    setTournament(null);
    setMode("setup");
  }

  /** Adds a player mid-tournament, resolving against global DB */
  function handleAddPlayer(name) {
    let db = getPlayersDB();
    const { player, db: newDb } = resolvePlayer(name, db);
    savePlayersDB(newDb);
    // Avoid duplicates inside the tournament
    if (tournament.players.some((p) => p.id === player.id)) return;
    handleUpdate({ ...tournament, players: [...tournament.players, player] });
  }

  /** Edits a player's name globally (updates DB + all tournament references) */
  function handleEditPlayer(playerId, newName) {
    let db = getPlayersDB();
    // Check new name doesn't collide with another existing DB entry
    const collision = Object.values(db).find(
      (p) => p.id !== playerId && p.name.toLowerCase() === newName.trim().toLowerCase()
    );
    if (collision) {
      alert(`Ya existe un jugador llamado "${collision.name}" en la base de datos.`);
      return;
    }
    if (db[playerId]) db[playerId].name = newName.trim();
    savePlayersDB(db);
    // Update in current tournament
    const players = tournament.players.map((p) =>
      p.id === playerId ? { ...p, name: newName.trim() } : p
    );
    handleUpdate({ ...tournament, players });
  }

  function handleDeletePlayer(playerId) {
    const players = tournament.players.filter((p) => p.id !== playerId);
    const pairs   = tournament.pairs?.filter((p) => p.p1 !== playerId && p.p2 !== playerId) ?? [];
    handleUpdate({ ...tournament, players, pairs });
  }

  function handleAddPair(p1Id, p2Id) {
    const pairs = [...(tournament.pairs ?? []), { id: uid(), p1: p1Id, p2: p2Id }];
    handleUpdate({ ...tournament, pairs });
  }

  function handleEditPair(pairId, p1Id, p2Id) {
    const pairs = tournament.pairs.map((p) =>
      p.id === pairId ? { ...p, p1: p1Id, p2: p2Id } : p
    );
    handleUpdate({ ...tournament, pairs });
  }

  function handleDeletePair(pairId) {
    const pairs = tournament.pairs.filter((p) => p.id !== pairId);
    handleUpdate({ ...tournament, pairs });
  }

  function handleResetScores() {
    handleUpdate({ ...tournament, matches: [] });
  }

  function getShareLink() {
    if (!tournament) return "";
    return `${window.location.href.split("#")[0]}#readonly:${tournament.id}`;
  }

  return {
    mode, tournament, readonlyId, saved,
    handleCreate, handleUpdate, handleReset,
    handleAddPlayer, handleEditPlayer, handleDeletePlayer,
    handleAddPair, handleEditPair, handleDeletePair,
    handleResetScores,
    getShareLink,
  };
}