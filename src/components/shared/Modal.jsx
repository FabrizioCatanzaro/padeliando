export default function Modal({ title, message, confirmText = "Confirmar", confirmDanger = false, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-1000 p-5">
      <div className="bg-surface border border-border-strong rounded-[10px] p-6 max-w-105 w-full">
        <div className="font-condensed font-bold text-2xl text-white mb-2.5">{title}</div>
        <div className="text-md text-secondary leading-relaxed font-sans">{message}</div>
        <div className="flex gap-2.5 justify-end mt-5">
          <button onClick={onCancel} className="bg-transparent text-muted border border-border-strong px-5 py-2.5 text-sm cursor-pointer rounded font-sans">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`border-0 px-5 py-2.5 font-condensed font-bold text-sm tracking-wide cursor-pointer rounded whitespace-nowrap text-base ${confirmDanger ? 'bg-danger' : 'bg-brand'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
