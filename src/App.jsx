import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import Header       from './components/shared/Header'
import Footer       from './components/shared/Footer'
import AdBanner     from './components/shared/AdBanner'
import HomeView     from './components/Home/HomeView'
import GroupView    from './components/Group/GroupView'
import AuthView     from './components/Auth/AuthView'
import ProfileView  from './components/Auth/ProfileView'
import ResetPassword from './components/Auth/ResetPassword'
import VerifyEmail   from './components/Auth/VerifyEmail'
import AdminDashboard from './components/Admin/AdminDashboard'
import AdminUsers       from './components/Admin/AdminUsers'
import AdminTournaments from './components/Admin/AdminTournaments'
import Setup        from './components/Setup/Setup'
import MainView     from './components/Main/Main'
import ReadonlyView    from './components/ReadonlyView/ReadonlyView'
import InvitationsView    from './components/Invitations/InvitationsView'
import TutorialView      from './components/Tutorial/TutorialView'
//import SubscriptionTest    from './components/Subscription/SubscriptionTest'
//import SubscriptionSuccess from './components/Subscription/SubscriptionSuccess'

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Banner superior — solo mobile/tablet */}
      {/* <div className="xl:hidden w-full flex justify-center py-1 border-b border-gray-100/10">
        <AdBanner slot="mobile-top" />
      </div> */}

      <div className="flex-1 flex justify-center">
        {/* Banner lateral izquierdo — solo desktop */}
        <aside className="hidden xl:flex flex-col items-center pt-4 w-40 shrink-0 px-2">
          <AdBanner slot="sidebar" />
        </aside>

        {/* Contenido principal */}
        <div className="flex-1 w-full max-w-7xl min-w-0 pb-16 xl:pb-0">
          <Outlet />
        </div>

        {/* Banner lateral derecho — solo desktop */}
        <aside className="hidden xl:flex flex-col items-center pt-4 w-40 shrink-0 px-2">
          <AdBanner slot="sidebar" />
        </aside>
      </div>

      <Footer />

      {/* Banner inferior fijo — solo mobile/tablet */}
      {/* <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100/10 flex items-center justify-center h-14">
        <AdBanner slot="mobile-bottom" />
      </div> */}
    </div>
  )
}

function PrivateRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return null
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"                                          element={<HomeView />} />
        <Route path="/login"                                     element={<AuthView mode="login" />} />
        <Route path="/register"                                  element={<AuthView mode="register" />} />
        <Route path="/reset-password/:token"                     element={<ResetPassword />} />
        <Route path="/verify-email/:token"                       element={<VerifyEmail />} />
        <Route path="/u/:username"                               element={<ProfileView />} />
        <Route path="/readonly/:id"                              element={<ReadonlyView />} />
        <Route path="/cat/:groupId"                           element={<GroupView />} />
        <Route path="/cat/:groupId/torneo/new"            element={<PrivateRoute><Setup /></PrivateRoute>} />
        <Route path="/cat/:groupId/torneo/:tournamentId"  element={<MainView />} />
        <Route path="/invitations"                               element={<PrivateRoute><InvitationsView /></PrivateRoute>} />
        <Route path="/tutorial"                                  element={<TutorialView />} />
        <Route path="/admin"                                     element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users"                               element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/tournaments"                         element={<AdminRoute><AdminTournaments /></AdminRoute>} />
        {/* <Route path="/subscription"                              element={<PrivateRoute><SubscriptionTest /></PrivateRoute>} /> */}
        {/* <Route path="/subscription/success"                      element={<PrivateRoute><SubscriptionSuccess /></PrivateRoute>} /> */}
        <Route path="*"                                          element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}