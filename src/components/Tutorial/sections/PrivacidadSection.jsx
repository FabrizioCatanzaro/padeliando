import TutorialSection from '../TutorialSection'
import TutorialMedia from '../TutorialMedia'

export default function PrivacidadSection() {
  return (
    <TutorialSection
      title="Cambiar la privacidad de un torneo"
      description="Podés controlar quién puede ver tu torneo cambiando su privacidad entre público y privado en cualquier momento."
      steps={[
        {
          label: 'Ir a la página del torneo',
          text: 'Ingresá al torneo desde tu lista de torneos en la pantalla principal.',
        },
        {
          label: 'Buscar el ícono de privacidad',
          text: 'En la cabecera del torneo verás un ícono de globo (público) o candado (privado). Hacé clic en él para alternar entre los dos estados.',
        },
        {
          label: 'El cambio es inmediato',
          text: 'No hace falta guardar. El ícono cambia al instante y la nueva configuración queda aplicada.',
        },
      ]}
    >
      <TutorialMedia caption="Ícono de privacidad en la cabecera del torneo" src={'https://res.cloudinary.com/dm80qflwa/image/upload/v1775422826/privacidad-torneo_zuzrt2.png'} aspect='aspect-auto'/>
    </TutorialSection>
  )
}
