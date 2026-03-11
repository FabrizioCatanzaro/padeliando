import S from "../../styles/theme";

export default function Modal({ title, message, confirmText = "Confirmar", confirmDanger = false, onConfirm, onCancel }) {
  return (
    <div style={S.modalOverlay}>
      <div style={S.modalBox}>
        <div style={S.modalTitle}>{title}</div>
        <div style={S.modalMessage}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onCancel} style={S.resetBtn}>Cancelar</button>
          <button
            onClick={onConfirm}
            style={{ ...S.primaryBtn, background: confirmDanger ? "#f04a4a" : "#e8f04a", color: "#0a0e1a" }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}