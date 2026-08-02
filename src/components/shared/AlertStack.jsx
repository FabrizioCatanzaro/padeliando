import { useEffect } from 'react';
import { Play, Trophy, Flag, ListTree, X, Bell } from 'lucide-react';

const META = {
  your_match:   { icon: Play,     accent: 'brand',  personal: true },
  bracket_spot: { icon: ListTree, accent: 'brand',  personal: true },
  champion:     { icon: Trophy,   accent: 'brand',  personal: false },
  live_started: { icon: Play,     accent: 'cyan',   personal: false },
  result:       { icon: Flag,     accent: 'cyan',   personal: false },
  bracket:      { icon: ListTree, accent: 'cyan',   personal: false },
  notification: { icon: Bell,     accent: 'brand',  personal: true },
};

const ACCENTS = {
  brand: 'border-brand/50 text-brand',
  cyan:  'border-cyan/40 text-cyan',
};

const AUTO_DISMISS_MS = 9000;

export default function AlertStack({ alerts, onDismiss }) {
  if (!alerts.length) return null;
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] w-[min(92vw,30rem)] flex flex-col gap-2 pointer-events-none">
      {alerts.map((a) => (
        <AlertCard key={a.id} alert={a} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function AlertCard({ alert, onDismiss }) {
  const meta = META[alert.kind] ?? { icon: Bell, accent: 'cyan', personal: false };
  const Icon = meta.icon;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(alert.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [alert.id, onDismiss]);

  return (
    <div
      onClick={() => { alert.onClick?.(); onDismiss(alert.id); }}
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md bg-surface/70 shadow-2xl cursor-pointer animate-alert-in ${ACCENTS[meta.accent]} ${meta.personal ? 'ring-1 ring-brand/25' : ''}`}
    >
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="font-condensed font-bold text-[15px] tracking-wide leading-tight">{alert.title}</div>
        <div className="text-secondary text-[12px] font-sans mt-0.5 wrap-break-word">{alert.body}</div>
      </div>
      <X size={14} className="shrink-0 mt-1 text-muted" />
    </div>
  );
}
