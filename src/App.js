import { useState, useEffect } from 'react';
import { useTournament } from './hooks/useTournament';
import Loader       from './components/Loader/Loader';
import Setup        from './components/Setup/Setup';
import Main         from './components/Main/Main';
import ReadonlyView from './components/ReadonlyView/ReadonlyView';
import HomeView     from './components/Home/HomeView';
import GroupView    from './components/Group/GroupView';
import AuthView     from './components/Auth/AuthView';
import ProfileView  from './components/Auth/ProfileView';
 
function parseHash() {
  const hash = window.location.hash.slice(1) || '/';
  if (hash.startsWith('readonly:'))
    return { view: 'readonly', tournamentId: hash.slice(9) };
  const parts = hash.replace(/^\//, '').split('/');
  if (parts[0] === '' || hash === '/')
    return { view: 'home' };
  if (parts[0] === 'login')
    return { view: 'login' };
  if (parts[0] === 'register')
    return { view: 'register' };
  if (parts[0] === 'u' && parts[1])
    return { view: 'profile', username: parts[1] };
  if (parts[0] === 'groups' && parts[2] === 'tournament' && parts[3] === 'new')
    return { view: 'setup', groupId: parts[1] };
  if (parts[0] === 'groups' && parts[2] === 'tournament' && parts[3])
    return { view: 'main', groupId: parts[1], tournamentId: parts[3] };
  if (parts[0] === 'groups' && parts[1])
    return { view: 'group', groupId: parts[1] };
  return { view: 'home' };
}
 
export default function App() {
  const [loc, setLoc] = useState(parseHash);
 
  useEffect(() => {
    const h = () => setLoc(parseHash());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
 
  const { tournament, loading, error, saved,
          handleCreate, handleAddMatch, handleEditMatch, handleDeleteMatch,
          handleAddPlayer, handleEditPlayer, handleDeletePlayer,
          handleAddPair, handleEditPair, handleDeletePair,
          handleResetScores, handleDeleteTournament,
          getShareLink, handleToggleStatus } = useTournament(loc.groupId, loc.tournamentId);
 
  if (loc.view === 'readonly') return <ReadonlyView id={loc.tournamentId} />;
  if (loc.view === 'login')     return <AuthView mode="login" />;
  if (loc.view === 'register')  return <AuthView mode="register" />;
  if (loc.view === 'profile')   return <ProfileView username={loc.username} />;
  if (loc.view === 'home')     return <HomeView />;
  if (loc.view === 'group')    return <GroupView groupId={loc.groupId} />;
 
  if (loc.view === 'setup') {
    async function handleSetupCreate(name, playerNames, pairsInput) {
      const tId = await handleCreate(name, playerNames, pairsInput);
      window.location.hash = `/groups/${loc.groupId}/tournament/${tId}`;
    }
    return <Setup onCreate={handleSetupCreate} />;
  }
 
  if (loc.view === 'main') {
    if (loading) return <Loader />;
    if (error || !tournament) return <div>Error cargando torneo.</div>;
    return (
      <Main
        tournament={tournament}
        onAddMatch={handleAddMatch}
        onEditMatch={handleEditMatch}
        onDeleteMatch={handleDeleteMatch}
        onAddPlayer={handleAddPlayer}
        onEditPlayer={handleEditPlayer}
        onDeletePlayer={handleDeletePlayer}
        onAddPair={handleAddPair}
        onEditPair={handleEditPair}
        onDeletePair={handleDeletePair}
        onResetScores={handleResetScores}
        onReset={async () => { await handleDeleteTournament(); window.location.hash = `/groups/${loc.groupId}`; }}
        shareLink={getShareLink()}
        saved={saved}
        onToggleStatus={handleToggleStatus}
      />
    );
  }
 
  return null;
}
