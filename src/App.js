import { useTournament } from "./hooks/useTournament";
import Loader       from "./components/Loader/Loader";
import Setup        from "./components/Setup/Setup";
import Main         from "./components/Main/Main";
import ReadonlyView from "./components/ReadonlyView/ReadonlyView";

export default function App() {
  const {
    mode, tournament, readonlyId, saved,
    handleCreate, handleUpdate, handleReset,
    handleAddPlayer, handleEditPlayer, handleDeletePlayer,
    handleAddPair, handleEditPair, handleDeletePair,
    handleResetScores,
    getShareLink,
  } = useTournament();

  if (mode === "loading")  return <Loader />;
  if (mode === "setup")    return <Setup onCreate={handleCreate} />;
  if (mode === "readonly") return <ReadonlyView id={readonlyId} />;

  return (
    <Main
      tournament={tournament}
      onUpdate={handleUpdate}
      onAddPlayer={handleAddPlayer}
      onEditPlayer={handleEditPlayer}
      onDeletePlayer={handleDeletePlayer}
      onAddPair={handleAddPair}
      onEditPair={handleEditPair}
      onDeletePair={handleDeletePair}
      onResetScores={handleResetScores}
      onReset={handleReset}
      shareLink={getShareLink()}
      saved={saved}
    />
  );
}