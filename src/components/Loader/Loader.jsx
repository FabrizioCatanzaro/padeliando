import logo from "../../assets/padeleando-logo.webp";
import "./Loader.css";

// minHeight se puede subir en páginas cuyo contenido real siempre supera la
// pantalla: si el hueco de carga queda corto, el pie entra en el viewport y al
// llegar el contenido lo expulsa, y ese desplazamiento cuenta como CLS.
export default function Loader({ minHeight = "70vh" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight,
        flex: 1,
        background: 'transparent',
      }}

    >
      <div style={{ textAlign: "center" }}>
        <div className="loader-ring">
          <img src={logo} alt="Padeleando" className="loader-logo" />
        </div>
        <div className="loader-label">CARGANDO...</div>
      </div>
    </div>
  );
}
