export default function Layout({ view, setView, children }) {
  const nav = [
    { key: "score", label: "Score" },
    { key: "candidates", label: "Candidates" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="flex h-screen flex-col bg-ant-surface font-sans text-ant-ink">
      <header className="flex shrink-0 items-center justify-between bg-ant-ink px-5 py-3">
        {/* Logo mark + breadcrumb */}
        <div className="flex items-center gap-2.5">
          <img
            src="/anterior-symbol.png"
            alt="Anterior"
            className="h-[22px] w-[22px] shrink-0"
            style={{ mixBlendMode: "screen" }}
          />
          <span className="text-[13.5px] font-semibold tracking-[-0.01em] text-white">Anterior</span>
          <span className="text-sm text-white opacity-30">/</span>
          <span className="text-[12.5px] text-white opacity-70">Leveling</span>
        </div>
        {/* Nav tabs + user avatar */}
        <div className="flex items-center gap-3">
        <nav className="flex gap-1">
          {nav.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                view === key ? "bg-white text-ant-ink" : "text-zinc-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
          {/* Current user avatar */}
          <div
            className="flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full text-[9px] font-semibold"
            style={{ background: "#004a38", color: "#b2ffe3", border: "1.5px solid #050d0a" }}
          >
            AL
          </div>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
