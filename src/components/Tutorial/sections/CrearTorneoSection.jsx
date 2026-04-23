import TutorialSection from '../TutorialSection'
import TutorialMedia from '../TutorialMedia'

export default function CrearTorneoSection() {
  return (
    <TutorialSection
      title="Crear un torneo"
      description='Un torneo en Padeleando agrupa todas las jornadas de un mismo grupo de jugadores. Podés personalizarlo con nombre, descripción, emojis y privacidad. Para crearlo necesitás estar registrado e iniciar sesión.'
      steps={[
        {
          label: 'Ir al inicio',
          text: 'Desde la pantalla principal, presioná el botón "NUEVO TORNEO" (el primero en la grilla de tus torneos).',
        },
        {
          label: 'Completar el nombre',
          text: 'El nombre es obligatorio y debe tener entre 2 y 30 caracteres. La descripción es opcional.',
        },
        {
          label: 'Elegir privacidad',
          text: 'Público: cualquiera puede buscar y ver el torneo desde la página principal o desde tu perfil. Privado: solo vos podés verlo. Podés cambiarlo en cualquier momento.',
        },
        {
          label: 'Agregar íconos',
          text: 'Podés seleccionar hasta 2 emojis de una lista predefinida para identificar visualmente el torneo en la grilla.',
        },
        {
          label: 'Crear jornadas',
          text: 'Dentro de un TORNEO podés crear tantas JORNADAS como quieras. Cada jornada es una fecha del torneo, por ejemplo: El torneo se puede llamar CABALLEROS 8VA y las jornadas pueden ser: "Fecha 1", "18/12/2022", etc. Para entender más acerca de las jornadas y cómo crearlas, revisá la sección "Crear una jornada" de este tutorial.',
        },
      ]}
    >
      <TutorialMedia caption="Formulario de creación de torneo" src={'https://res.cloudinary.com/dm80qflwa/image/upload/v1775422829/crear-torneo_lseyop.png'} aspect='aspect-auto'/>
    </TutorialSection>
  )
}
