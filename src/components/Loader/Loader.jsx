import logo from "../../assets/padeleando.ico";
import "./Loader.css";

export default function Loader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
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
