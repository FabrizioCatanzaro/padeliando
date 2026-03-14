import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import Header       from './components/shared/Header'
import Footer       from './components/shared/Footer'
import HomeView     from './components/Home/HomeView'
import GroupView    from './components/Group/GroupView'
import AuthView     from './components/Auth/AuthView'
import ProfileView  from './components/Auth/ProfileView'
import ResetPassword from './components/Auth/ResetPassword'
import Setup        from './components/Setup/Setup'
import MainView     from './components/Main/Main'
import ReadonlyView    from './components/ReadonlyView/ReadonlyView'
import InvitationsView from './components/Invitations/InvitationsView'

function Layout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}

function PrivateRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return null
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"                                          element={<HomeView />} />
        <Route path="/login"                                     element={<AuthView mode="login" />} />
        <Route path="/register"                                  element={<AuthView mode="register" />} />
        <Route path="/reset-password/:token"                     element={<ResetPassword />} />
        <Route path="/u/:username"                               element={<ProfileView />} />
        <Route path="/readonly/:id"                              element={<ReadonlyView />} />
        <Route path="/groups/:groupId"                           element={<GroupView />} />
        <Route path="/groups/:groupId/tournament/new"            element={<PrivateRoute><Setup /></PrivateRoute>} />
        <Route path="/groups/:groupId/tournament/:tournamentId"  element={<MainView />} />
        <Route path="/invitations"                               element={<PrivateRoute><InvitationsView /></PrivateRoute>} />
        <Route path="*"                                          element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}