import TutorialSection from '../TutorialSection'
import TutorialMedia from '../TutorialMedia'

export default function RegistroSection() {
  return (
    <TutorialSection
      title="¿Para qué registrarme?"
      description="Podés explorar categorías públicas sin una cuenta, pero para aprovechar todas las funciones de Padeleando necesitás registrarte. Es gratis y solo lleva unos segundos."
      steps={[
        {
          label: 'Organizar torneos',
          text: 'Creá y administrá tus propias categorías. Controlás los torneos, los participantes, los resultados y las estadísticas.',
        },
        {
          label: 'Aceptar invitaciones',
          text: 'Otros usuarios pueden invitarte a sus categorías. Con una cuenta podés ver y aceptar esas invitaciones desde la sección "Invitaciones" del menú.',
        },
        {
          label: 'Estadísticas propias',
          text: 'Tu perfil acumula tus resultados en todas las categorías en las que participás: partidos jugados, ganados, puntos, y más.',
        },
        {
          label: 'Perfil público',
          text: 'Tenés una página de perfil pública con tu nombre de usuario y tus categorías, que podés compartir con otros jugadores.',
        },
      ]}
    >
      <TutorialMedia caption="Pantalla de registro e inicio de sesión" src={'https://res.cloudinary.com/dm80qflwa/image/upload/v1775422830/login_aiydnq.png'}/>
    </TutorialSection>
  )
}
