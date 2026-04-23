import TutorialSection from '../TutorialSection'
import TutorialMedia from '../TutorialMedia'

export default function FinalizarSection() {
  return (
    <TutorialSection
      title="Finalizar una jornada"
      description="Finalizar una jornada cierra oficialmente esa fecha de juego y congela sus resultados en la tabla de posiciones. Una jornada finalizada no puede editarse."
      steps={[
        {
          label: 'Cargar todos los resultados',
          text: 'Antes de finalizar, asegurate de que todos los partidos de la jornada tengan resultados cargados. Podés editar los marcadores haciendo clic en cada partido.',
        },
        {
          label: 'Buscar el botón "Finalizar jornada"',
          text: 'Dentro de la vista de la jornada, encontrás el botón para finalizarla. Solo el organizador del torneo puede hacerlo.',
        },
        {
          label: 'Confirmar',
          text: 'Se te pedirá confirmar la acción. Una vez finalizada, los puntos quedan registrados definitivamente en la tabla acumulada del torneo.',
        },
      ]}
    >
      <TutorialMedia caption="Botón para finalizar una jornada y confirmación" src={'https://res.cloudinary.com/dm80qflwa/image/upload/v1775422825/finalizar-jornada_o7hvno.png'} aspect='aspect-auto'/>
    </TutorialSection>
  )
}
