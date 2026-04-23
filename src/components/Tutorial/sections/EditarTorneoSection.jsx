import TutorialSection from '../TutorialSection'
import TutorialMedia from '../TutorialMedia'

export default function EditarTorneoSection() {
  return (
    <TutorialSection
      title="Editar nombre y descripción de un torneo"
      description="Podés cambiar el nombre y la descripción de tu torneo en cualquier momento desde la página del torneo."
      steps={[
        {
          label: 'Ir a la página del torneo',
          text: 'Ingresá al torneo que querés editar desde la pantalla principal.',
        },
        {
          label: 'Hacer clic en el ícono de edición',
          text: 'Junto al nombre del torneo verás un ícono de lápiz. Hacé clic en él para activar el modo edición.',
        },
        {
          label: 'Modificar y guardar',
          text: 'Editá el nombre y/o la descripción en los campos que aparecen. Confirmá los cambios con el botón de guardar (ícono de tilde) o cancelá con el ícono de X.',
        },
        {
          label: 'Editar jornada',
          text: 'Desde la página donde organizas la jornada podes realizar el mismo procedimiento para editar el nombre de la jornada.',
        },
      ]}
    >
      <TutorialMedia caption="Edición de nombre y descripción del torneo" src={'https://res.cloudinary.com/dm80qflwa/image/upload/v1775422824/torneo-editar-nombre2_zo9kpm.png'} aspect='aspect-auto'/>
    </TutorialSection>
  )
}
