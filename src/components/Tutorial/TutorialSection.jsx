export default function TutorialSection({ title, description, steps, children }) {
  return (
    <div>
      <h2 className="font-condensed font-bold text-[24px] text-white mb-3 leading-tight">
        {title}
      </h2>

      {description && (
        <p className="text-content text-[15px] font-sans leading-relaxed mb-6">
          {description}
        </p>
      )}

      {steps?.length > 0 && (
        <ol className="flex flex-col gap-4 mb-8">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="shrink-0 w-7 h-7 rounded-full bg-brand text-base font-condensed font-bold text-[13px] flex items-center justify-center leading-none">
                {i + 1}
              </span>
              <div>
                {step.label && (
                  <div className="font-condensed font-bold text-[15px] text-white mb-0.5">
                    {step.label}
                  </div>
                )}
                <div className="text-secondary text-[14px] font-sans leading-relaxed">
                  {step.text}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {children}
    </div>
  )
}
