import TutorialSection from '../TutorialSection'
import TutorialMedia from '../TutorialMedia'

export default function CrearJornadaSection() {
  return (
    <TutorialSection
      title="Crear una jornada"
      description='Una jornada en Padeleando es una fecha específica dentro de un torneo donde se juegan partidos. Podés personalizarla con nombre y descripción.'
      steps={[
        {
          label: 'Ir al torneo',
          text: 'Desde la pantalla de tu torneo, presioná el botón "NUEVA JORNADA" (el primero en la grilla de tus jornadas).',
        },
        {
          label: 'Elegir el Modo de juego',
          text: 'Seleccioná el modo de juego que vas a utilizar, no lo podés cambiar una vez creada. Para entender las diferencias entre los modos, revisá la sección "Modo Liga vs Modo Americano" de este tutorial.',
        },
        {
          label: 'Completar el nombre',
          text: 'El nombre es obligatorio y debe tener entre 2 y 30 caracteres.',
        },
        {
          label: 'Agregar jugadores/parejas',
          text: 'Dependiendo si tu elección fue "Modo Liga" o "Modo Americano", deberás agregar jugadores o parejas para la jornada. En el "Modo Liga", al no tener restricciones por número de jugadores (mínimo 4), podés formar parejas libremente para cada jornada o asignar parejas fijas en el siguiente paso. En el "Modo Americano", directamente tenés que agregar parejas fijas para la jornada con un mínimo de 8 parejas (16 jugadores).',
        },
        {
          label: 'Crear jornada',
          text: 'Dentro de una jornada podés crear tantos partidos como quieras a excepción del "Modo Americano" que permite como máximo 2 partidos por pareja en la Fase Previa. Una vez creada la jornada, podés editar su nombre y compartir el link de "solo visualización" para que los jugadores puedan ver en tiempo real la tabla de posiciones, los resultados y sus estadísticas.',
        },
      ]}
    >
      <TutorialMedia caption="Formulario de creación de jornada" src={'https://res.cloudinary.com/dm80qflwa/image/upload/v1775422829/crear-jornada-modo_kpwsa0.png'}/>
    </TutorialSection>
  )
}
