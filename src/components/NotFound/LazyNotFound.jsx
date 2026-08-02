import { lazy, Suspense } from 'react'
import Loader from '../Loader/Loader'

// Las vistas que resuelven un id lo muestran cuando la API contesta 404, así
// que se importa perezoso: el juego no debe viajar en el chunk de cada una.
const NotFoundView = lazy(() => import('./NotFoundView'))

export default function LazyNotFound(props) {
  return (
    <Suspense fallback={<Loader minHeight="80vh" />}>
      <NotFoundView {...props} />
    </Suspense>
  )
}
