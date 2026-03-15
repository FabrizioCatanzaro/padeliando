import { useState } from "react";
import { expandPair, emptyForm, localDateStr } from "../../utils/helpers";
import MatchCard from "./MatchCard";
import MatchForm from "./MatchForm";
export default function Matches({ tournament, isOwner, onAddMatch, onEditMatch, onDeleteMatch }) {
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

    const matchData = { team1, team2, score1: s1, score2: s2, date: form.date, duration_seconds: form.duration_seconds };
    if (editId) {
      await onEditMatch(editId, matchData);
    } else {
      await onAddMatch(matchData);
    }
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
        date: m.date || localDateStr() });
    } else {
      setForm({ team1: [...m.team1], team2: [...m.team2],
        score1: String(m.score1), score2: String(m.score2),
        date: m.date || localDateStr() });
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
      <div className="flex justify-between items-center mb-4">
        <div className="font-condensed font-bold text-[16px] tracking-[3px] text-muted">PARTIDOS</div>
        {isOwner && (
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-brand text-base border-0 px-5 py-2.5 font-condensed font-bold text-[13px] tracking-wide cursor-pointer rounded-sm whitespace-nowrap">
            {showForm ? "CANCELAR" : "+ NUEVO PARTIDO"}
          </button>
        )}
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
        <div className="text-center text-dim py-10 px-5 font-sans leading-loose">
          No hay partidos registrados todavía.<br />¡Jugá el primero!
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((m) => (
            <MatchCard key={m.id} match={m} tournament={tournament} isOwner={isOwner}
              onEdit={() => handleEdit(m)} onDelete={() => handleDelete(m.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
