import TutorialSection from '../TutorialSection'
import TutorialMedia from '../TutorialMedia'

export default function EditarCategoriaSection() {
  return (
    <TutorialSection
      title="Editar nombre y descripción de una categoría"
      description="Podés cambiar el nombre y la descripción de tu categoría en cualquier momento desde la página de la categoría."
      steps={[
        {
          label: 'Ir a la página de la categoría',
          text: 'Ingresá a la categoría que querés editar desde la pantalla principal.',
        },
        {
          label: 'Hacer clic en el ícono de edición',
          text: 'Junto al nombre de la categoría verás un ícono de lápiz. Hacé clic en él para activar el modo edición.',
        },
        {
          label: 'Modificar y guardar',
          text: 'Editá el nombre y/o la descripción en los campos que aparecen. Confirmá los cambios con el botón de guardar (ícono de tilde) o cancelá con el ícono de X.',
        },
        {
          label: 'Editar torneo',
          text: 'Desde la página donde organizas el torneo podes realizar el mismo procedimiento para editar el nombre de el torneo.',
        },
      ]}
    >
      <TutorialMedia caption="Menú de la categoría, con la opción de editar" src="https://res.cloudinary.com/dm80qflwa/image/upload/f_auto,q_auto,w_900,c_limit/v1786159237/tutorial/menu-categoria.png" aspect="aspect-auto" />
    </TutorialSection>
  )
}
