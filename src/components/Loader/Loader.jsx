import logo from "../../assets/padeleando.ico";
import "./Loader.css";

export default function Loader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0a0e1a",
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
