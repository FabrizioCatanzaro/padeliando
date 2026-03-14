export default function Loader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0a0e1a",
        color: "#e8f04a",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎾</div>
        <div
          style={{
            fontFamily: "'Kode Mono', monospace",
            letterSpacing: 4,
            fontSize: 14,
            color: "#666",
          }}
        >
          CARGANDO...
        </div>
      </div>
    </div>
  );
}