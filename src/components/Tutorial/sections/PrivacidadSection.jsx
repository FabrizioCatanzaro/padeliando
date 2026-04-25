import TutorialSection from '../TutorialSection'
import TutorialMedia from '../TutorialMedia'

export default function PrivacidadSection() {
  return (
    <TutorialSection
      title="Cambiar la privacidad de una categoría"
      description="Podés controlar quién puede ver tu categoría cambiando su privacidad entre público y privado en cualquier momento."
      steps={[
        {
          label: 'Ir a la página de la categoría',
          text: 'Ingresá a la categoría desde tu lista de categorías en la pantalla principal.',
        },
        {
          label: 'Buscar el ícono de privacidad',
          text: 'En la cabecera de la categoría verás un ícono de globo (público) o candado (privado). Hacé clic en él para alternar entre los dos estados.',
        },
        {
          label: 'El cambio es inmediato',
          text: 'No hace falta guardar. El ícono cambia al instante y la nueva configuración queda aplicada.',
        },
      ]}
    >
      <TutorialMedia caption="Ícono de privacidad en la cabecera de la categoría" src={'https://res.cloudinary.com/dm80qflwa/image/upload/v1775422826/privacidad-torneo_zuzrt2.png'} aspect='aspect-auto'/>
    </TutorialSection>
  )
}
