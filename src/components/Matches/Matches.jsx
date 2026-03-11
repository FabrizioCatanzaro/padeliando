import { useState } from "react";
import S from "../../styles/theme";
import { expandPair } from "../../utils/helpers";
import MatchCard from "./MatchCard";
import MatchForm, { emptyForm } from "./MatchForm";

export default function Matches({ tournament, onAddMatch, onEditMatch, onDeleteMatch }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm());
  const [editId, setEditId]     = useState(null);

  const isPairs = tournament.mode === "pairs";

  function resetForm() { setForm(emptyForm()); setEditId(null); }

  async function handleSave() {
    const { score1, score2 } = form;
    const s1 = parseInt(score1), s2 = parseInt(score2);

    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0)
      return alert("Ingresá un marcador válido");

    let team1, team2;
    if (isPairs) {
      if (!form.team1Pair || !form.team2Pair) return alert("Seleccioná las dos parejas");
      team1 = expandPair(form.team1Pair, tournament.pairs);
      team2 = expandPair(form.team2Pair, tournament.pairs);
    } else {
      team1 = form.team1; team2 = form.team2;
      if (!team1[0] || !team1[1] || !team2[0] || !team2[1])
        return alert("Completá los 4 jugadores");
      if (new Set([...team1, ...team2]).size !== 4)
        return alert("Los jugadores no pueden repetirse");
    }

    /*const match = {
      id: editId || uid(), team1, team2,
      score1: s1, score2: s2, date,
      createdAt: editId
        ? tournament.matches.find((m) => m.id === editId)?.createdAt
        : new Date().toISOString(),
    };

    const matches = editId
      ? tournament.matches.map((m) => (m.id === editId ? match : m))
      : [...tournament.matches, match];
    */
    const matchData = { team1, team2, score1: s1, score2: s2, date: form.date };
    if (editId) {
      await onEditMatch(editId, matchData);
    } else {
      await onAddMatch(matchData);
    }
    resetForm();
    setShowForm(false);


    //onUpdate({ ...tournament, matches });
    resetForm();
    setShowForm(false);
  }

  function handleEdit(m) {
    if (isPairs) {
      const pair1 = tournament.pairs?.find(
        (p) => (p.p1 === m.team1[0] && p.p2 === m.team1[1]) ||
               (p.p1 === m.team1[1] && p.p2 === m.team1[0])
      );
      const pair2 = tournament.pairs?.find(
        (p) => (p.p1 === m.team2[0] && p.p2 === m.team2[1]) ||
               (p.p1 === m.team2[1] && p.p2 === m.team2[0])
      );
      setForm({ ...emptyForm(), team1Pair: pair1?.id ?? "", team2Pair: pair2?.id ?? "",
        score1: String(m.score1), score2: String(m.score2),
        date: m.date || new Date().toISOString().slice(0, 10) });
    } else {
      setForm({ team1: [...m.team1], team2: [...m.team2],
        score1: String(m.score1), score2: String(m.score2),
        date: m.date || new Date().toISOString().slice(0, 10) });
    }
    setEditId(m.id);
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este partido?')) return;
    await onDeleteMatch(id);
  }

  const sorted = [...tournament.matches].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={S.sectionTitle}>PARTIDOS</div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={S.primaryBtn}>
          {showForm ? "CANCELAR" : "+ NUEVO PARTIDO"}
        </button>
      </div>

      {showForm && (
        <MatchForm
          form={form} setForm={setForm}
          tournament={tournament}
          onSave={handleSave}
          onCancel={() => { resetForm(); setShowForm(false); }}
          isEditing={!!editId}
        />
      )}

      {sorted.length === 0 ? (
        <div style={S.empty}>No hay partidos registrados todavía.<br />¡Jugá el primero!</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((m) => (
            <MatchCard key={m.id} match={m} tournament={tournament}
              onEdit={() => handleEdit(m)} onDelete={() => handleDelete(m.id)} />
          ))}
        </div>
      )}
    </div>
  );
}