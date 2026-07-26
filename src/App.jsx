import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import Header       from './components/shared/Header'
import Footer       from './components/shared/Footer'
import AdBanner     from './components/shared/AdBanner'
import Loader       from './components/Loader/Loader'

// La portada y el login se cargan con el bundle inicial: son el punto de
// entrada de casi todas las visitas.
import HomeView     from './components/Home/HomeView'
import AuthView     from './components/Auth/AuthView'

// El resto viaja en chunks propios. Antes las 39 rutas colapsaban en un único
// archivo de 1,29 MB, así que un visitante anónimo en /view/:id descargaba y
// compilaba el panel de admin y las pantallas de suscripción.
const GroupView    = lazy(() => import('./components/Group/GroupView'))
const ProfileView  = lazy(() => import('./components/Auth/ProfileView'))
const ResetPassword = lazy(() => import('./components/Auth/ResetPassword'))
const VerifyEmail   = lazy(() => import('./components/Auth/VerifyEmail'))
const AdminDashboard      = lazy(() => import('./components/Admin/AdminDashboard'))
const AdminUsers          = lazy(() => import('./components/Admin/AdminUsers'))
const AdminTournaments    = lazy(() => import('./components/Admin/AdminTournaments'))
const AdminNotifications  = lazy(() => import('./components/Admin/AdminNotifications'))
const AdminClubs          = lazy(() => import('./components/Admin/AdminClubs'))
const AdminClubRequests   = lazy(() => import('./components/Admin/AdminClubRequests'))
const ClubProfileView     = lazy(() => import('./components/Club/ClubProfileView'))
const Setup        = lazy(() => import('./components/Setup/Setup'))
const MainView     = lazy(() => import('./components/Main/Main'))
const ReadonlyView = lazy(() => import('./components/ReadonlyView/ReadonlyView'))
const InviteAccept        = lazy(() => import('./components/Invitations/InviteAccept'))
const NotificationsView   = lazy(() => import('./components/Notifications/NotificationsView'))
const TutorialView        = lazy(() => import('./components/Tutorial/TutorialView'))
const SubscriptionSuccess = lazy(() => import('./components/Subscription/SubscriptionSuccess'))
const SubscriptionFailure = lazy(() => import('./components/Subscription/SubscriptionFailure'))
const SubscriptionPending = lazy(() => import('./components/Subscription/SubscriptionPending'))
const SubscriptionManage  = lazy(() => import('./components/Subscription/SubscriptionManage'))
const FAQView      = lazy(() => import('./components/Legal/FAQView'))
const AboutView    = lazy(() => import('./components/Legal/AboutView'))
const ContactView  = lazy(() => import('./components/Legal/ContactView'))
const TermsView    = lazy(() => import('./components/Legal/TermsView'))
const PrivacyView  = lazy(() => import('./components/Legal/PrivacyView'))

// Redirige los enlaces antiguos /readonly/:id a la nueva ruta /view/:id
function RedirectToView() {
  const { id } = useParams()
  return <Navigate to={`/view/${id}`} replace />
}

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

        {/* Contenido principal. <main> es el landmark que los lectores de
            pantalla usan para saltar la navegación repetida. */}
        <main className="flex-1 w-full max-w-7xl min-w-0 pb-16 xl:pb-0">
          {/* El Loader reserva 70vh, así que la cabecera no salta cuando entra
              el chunk de la ruta. */}
          <Suspense fallback={<Loader />}>
            <Outlet />
          </Suspense>
        </main>

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
        <Route path="/club/:id"                                  element={<ClubProfileView />} />
        <Route path="/view/:id"                                  element={<ReadonlyView />} />
        <Route path="/readonly/:id"                              element={<RedirectToView />} />
        <Route path="/cat/:groupId"                           element={<GroupView />} />
        <Route path="/cat/:groupId/torneo/new"            element={<PrivateRoute><Setup /></PrivateRoute>} />
        <Route path="/cat/:groupId/torneo/:tournamentId"  element={<MainView />} />
        <Route path="/invitacion/:token"                         element={<InviteAccept />} />
        <Route path="/invitations"                               element={<Navigate to="/notifications" replace />} />
        <Route path="/notifications"                             element={<PrivateRoute><NotificationsView /></PrivateRoute>} />
        <Route path="/tutorial"                                  element={<TutorialView />} />
        <Route path="/faq"                                       element={<FAQView />} />
        <Route path="/sobre-nosotros"                            element={<AboutView />} />
        <Route path="/contacto"                                  element={<ContactView />} />
        <Route path="/terminos"                                  element={<TermsView />} />
        <Route path="/privacidad"                                element={<PrivacyView />} />
        <Route path="/admin"                                     element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users"                               element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/tournaments"                         element={<AdminRoute><AdminTournaments /></AdminRoute>} />
        <Route path="/admin/notifications"                       element={<AdminRoute><AdminNotifications /></AdminRoute>} />
        <Route path="/admin/clubs"                               element={<AdminRoute><AdminClubs /></AdminRoute>} />
        <Route path="/admin/clubs/requests"                      element={<AdminRoute><AdminClubRequests /></AdminRoute>} />
        <Route path="/subscription/success"                      element={<PrivateRoute><SubscriptionSuccess /></PrivateRoute>} />
        <Route path="/subscription/failure"                      element={<PrivateRoute><SubscriptionFailure /></PrivateRoute>} />
        <Route path="/subscription/pending"                      element={<PrivateRoute><SubscriptionPending /></PrivateRoute>} />
        <Route path="/subscription/manage"                       element={<PrivateRoute><SubscriptionManage /></PrivateRoute>} />
        <Route path="*"                                          element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}