import { useState, useEffect, useRef } from "react";
import { Plus, X, Copy, Check } from "lucide-react";
import { suggested, color } from "../lib/utils";

const idx5 = [0, 1, 2, 3, 4];

const STATUS_GROUPS = [
  { key: "incomplete", label: "Needs scoring",   dot: "#9a9c99" },
  { key: "spiky",      label: "Flagged · spiky", dot: "#cf8a2e" },
  { key: "clean",      label: "Calibrated",       dot: "#004a38" },
];

function getCandModel(c, fn) {
  const s = suggested(c, fn);
  const unscored = fn.dimensions.length - (s?.scored ?? 0);
  const spread   = s ? s.max - s.min : 0;
  let status;
  if (unscored > 0)  status = "incomplete";
  else if (spread >= 2) status = "spiky";
  else               status = "clean";
  return { ...c, s, unscored, spread, status };
}

function initials(name) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function ScoreView({
  functions, activeFn, activeId, setActiveId,
  candidates, addCandidate, deleteCandidate, setScore, setNote,
}) {
  const [showModal,    setShowModal]    = useState(false);
  const [candName,     setCandName]     = useState("");
  const [candFnId,     setCandFnId]     = useState(activeId);
  const [exportFor,    setExportFor]    = useState(null);
  const [copied,       setCopied]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeCandId, setActiveCandId] = useState(null);
  const pendingSelectRef = useRef(null);
  const [showChart,    setShowChart]    = useState(false);
  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState("all");

  const codeFor = (n) => activeFn.levelCodes[n - 1] || "L" + n;

  const fnCandidates = candidates.filter((c) => c.functionId === activeFn.id);
  const fnModels     = fnCandidates.map((c) => getCandModel(c, activeFn));

  // Reset active candidate when function switches (honour pending selection from addCandidate)
  useEffect(() => {
    if (pendingSelectRef.current) {
      setActiveCandId(pendingSelectRef.current);
      pendingSelectRef.current = null;
    } else {
      const first = candidates.filter((c) => c.functionId === activeFn.id)[0];
      setActiveCandId(first?.id ?? null);
    }
    setExportFor(null);
  }, [activeFn.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recover when active candidate is deleted
  useEffect(() => {
    if (activeCandId && !fnCandidates.find((c) => c.id === activeCandId)) {
      setActiveCandId(fnCandidates[0]?.id ?? null);
    }
  }, [fnCandidates.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset delete confirm when active candidate changes
  useEffect(() => { setConfirmDelete(false); }, [activeCandId]);

  const activeM    = fnModels.find((m) => m.id === activeCandId) ?? null;
  const activeCIdx = fnCandidates.findIndex((c) => c.id === activeCandId);

  // Sidebar stats
  const totalCount  = fnModels.length;
  const fullyScored = fnModels.filter((m) => m.unscored === 0).length;
  const toscoreCount = fnModels.filter((m) => m.status === "incomplete").length;
  const flaggedCount = fnModels.filter((m) => m.status === "spiky").length;

  // Filter + search
  const q = search.trim().toLowerCase();
  const filtered = fnModels.filter((m) => {
    if (filter === "toscore" && m.status !== "incomplete") return false;
    if (filter === "flagged" && m.status !== "spiky")      return false;
    if (q && !m.name.toLowerCase().includes(q))            return false;
    return true;
  });

  const groups = STATUS_GROUPS.map((g) => ({
    ...g,
    items: filtered
      .filter((m) => m.status === g.key)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0);

  function openModal() {
    setCandName("");
    setCandFnId(activeId);
    setShowModal(true);
  }

  function handleAdd() {
    const name = candName.trim();
    if (!name) return;
    const newId = addCandidate(name, candFnId);
    setShowModal(false);
    if (candFnId !== activeId) {
      pendingSelectRef.current = newId;
      setActiveId(candFnId);
    } else {
      setActiveCandId(newId);
    }
  }

  function exportText() {
    const c  = activeM;
    const fn = functions.find((f) => f.id === c.functionId) || activeFn;
    const code = (n) => fn.levelCodes[n - 1] || "L" + n;
    const s = c.s;
    const head = s
      ? `Suggested level: ${code(s.median)} (median of ${s.scored} dimension${s.scored !== 1 ? "s" : ""}; spread ${code(s.min)} to ${code(s.max)})`
      : "Suggested level: not yet scored";
    const lines = fn.dimensions.map((d) => {
      const n    = c.scores[d.id];
      const note = (c.notes[d.id] || "").trim();
      return `${d.name}: ${n ? code(n) : "unscored"}${note ? `\n  Evidence: ${note}` : ""}`;
    });
    return `${c.name} | ${fn.name} leveling\n${head}\n\n${lines.join("\n")}`;
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* textarea is selectable */ }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">

      {/* Function chip bar */}
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-zinc-200 bg-ant-surface px-5 py-[11px]">
        <span className="mr-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-[.06em] text-zinc-400">
          Function
        </span>
        {functions.map((f) => (
          <button
            key={f.id}
            onClick={() => { setActiveId(f.id); setExportFor(null); }}
            className={`shrink-0 rounded-full border px-3 py-[5px] text-xs font-medium transition-all duration-150 ${
              f.id === activeId
                ? "border-ant-ink bg-ant-ink text-white"
                : "border-zinc-200 bg-white text-zinc-500 hover:border-[#ccccc8]"
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Candidate sidebar ── */}
        <div className="flex w-[244px] shrink-0 flex-col overflow-hidden border-r border-zinc-200" style={{ background: "#fcfbf7" }}>

          {/* Sidebar header */}
          <div className="flex shrink-0 flex-col gap-[11px] border-b border-[#eceae4] px-3.5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[.06em] text-zinc-400">
                Candidates · {totalCount}
              </span>
              <span className="text-[10.5px] font-medium text-zinc-500">
                {fullyScored} / {totalCount} scored
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1 overflow-hidden rounded-full" style={{ background: "#ececea" }}>
              <div
                className="h-full rounded-full bg-ant-forest transition-all duration-300"
                style={{ width: totalCount ? `${Math.round((fullyScored / totalCount) * 100)}%` : "0%" }}
              />
            </div>

            {/* Search */}
            <div className="relative flex items-center">
              <svg className="pointer-events-none absolute left-[9px] text-zinc-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidates…"
                className="w-full rounded-lg border border-zinc-200 bg-white py-[7px] pl-[30px] pr-2.5 text-[12.5px] text-ant-ink outline-none placeholder:text-zinc-400 focus:border-ant-teal"
              />
            </div>

            {/* Filter pills */}
            <div className="flex gap-[5px]">
              {[
                { key: "all",     label: "All",      count: totalCount   },
                { key: "toscore", label: "To score",  count: toscoreCount },
                { key: "flagged", label: "Flagged",   count: flaggedCount },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setFilter(p.key)}
                  className={`flex-1 rounded-[7px] border py-1 text-[11px] font-semibold transition-all duration-150 ${
                    filter === p.key
                      ? "border-ant-ink bg-ant-ink text-white"
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-[#ccccc8]"
                  }`}
                >
                  {p.label} <span className="opacity-60">{p.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Candidate list */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 py-1.5">
            {groups.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-400">
                {fnModels.length === 0 ? "No candidates yet." : "No candidates match."}
              </p>
            ) : (
              groups.map((g) => (
                <div key={g.key} className="flex flex-col gap-[3px]">
                  {/* Group header */}
                  <div
                    className="sticky top-0 z-[1] flex items-center gap-[7px] px-1.5 pb-1 pt-[5px]"
                    style={{ background: "#fcfbf7" }}
                  >
                    <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: g.dot }} />
                    <span className="text-[9.5px] font-semibold uppercase tracking-[.05em] text-zinc-400">{g.label}</span>
                    <span className="text-[9.5px] font-semibold" style={{ color: "#c4c5c1" }}>{g.items.length}</span>
                  </div>

                  {g.items.map((m) => {
                    const isActive = m.id === activeCandId;
                    const candIdx  = fnCandidates.findIndex((c) => c.id === m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => { setActiveCandId(m.id); setExportFor(null); }}
                        className={`flex flex-col gap-1 rounded-[9px] px-2.5 py-2 text-left transition-all duration-[130ms] ${
                          !isActive && "hover:bg-[#f4f3ee]"
                        }`}
                        style={isActive
                          ? { background: "#b2ffe3", boxShadow: "inset 0 0 0 1px #8fe6c9, inset 3px 0 0 #004a38" }
                          : {}}
                      >
                        <div className="flex w-full items-center gap-2">
                          <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: color(candIdx) }} />
                          <span
                            className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] font-semibold"
                            style={{ color: "#0c1512" }}
                          >
                            {m.name}
                          </span>
                          <span
                            className="shrink-0 rounded-[6px] px-[7px] py-[2px] text-[11px] font-semibold"
                            style={
                              m.status === "spiky"
                                ? { background: "#fbeedd", color: "#8a571a" }
                                : m.status === "incomplete"
                                ? { background: "#f1f0ec", color: "#6b6f6b" }
                                : { background: "#e3f5ee", color: "#004a38" }
                            }
                          >
                            {m.s ? codeFor(m.s.median) : "—"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Add candidate */}
          <div className="shrink-0 border-t border-[#eceae4] px-3 pb-3 pt-[10px]">
            <button
              onClick={openModal}
              className="flex w-full items-center justify-center gap-[7px] rounded-[9px] border border-dashed border-[#ccccc8] bg-white py-[9px] text-xs font-medium text-zinc-500 transition-all duration-150 hover:border-zinc-400 hover:text-ant-ink"
            >
              <span className="mt-[-1px] text-[15px] leading-none">+</span> Add candidate
            </button>
          </div>
        </div>

        {/* ── Main scoring area ── */}
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
          {!activeM ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-zinc-400">
                {fnModels.length === 0
                  ? `Add a candidate to start scoring against the ${activeFn.name} ladder.`
                  : "Select a candidate from the sidebar."}
              </p>
              {fnModels.length === 0 && (
                <button
                  onClick={openModal}
                  className="flex items-center gap-1.5 rounded-md bg-ant-ink px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-ant-forest"
                >
                  <Plus size={14} /> Add first candidate
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Candidate header */}
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3.5 border-b border-zinc-200 bg-ant-surface px-6 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  {/* Avatar with color status dot */}
                  <div
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-[13px] font-semibold"
                    style={{ background: "#f0efe9", color: "#3a3f3b" }}
                  >
                    {initials(activeM.name)}
                    <span
                      className="absolute bottom-[-1px] right-[-1px] h-[11px] w-[11px] rounded-full border-2 border-ant-surface"
                      style={{ background: color(activeCIdx) }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[19px] font-semibold leading-[1.1] tracking-[-0.01em]">
                      {activeM.name}
                    </div>
                    <div className="mt-[2px] text-[11.5px] text-zinc-400">{activeFn.name}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-[9px]">
                  {/* Flags */}
                  {activeM.spread >= 2 && (
                    <span
                      className="rounded-full border px-[9px] py-[3px] text-[11px] font-medium"
                      style={{ background: "#fbeedd", borderColor: "#f1d9b8", color: "#8a571a" }}
                    >
                      Spiky · {activeM.spread}-level spread
                    </span>
                  )}
                  {activeM.unscored > 0 && (
                    <span
                      className="rounded-full border px-[9px] py-[3px] text-[11px] font-medium"
                      style={{ background: "#f1f0ec", borderColor: "#e3e2dc", color: "#6b6f6b" }}
                    >
                      {activeM.unscored} {activeM.unscored === 1 ? "dimension" : "dimensions"} unscored
                    </span>
                  )}
                  {/* Scored count */}
                  <span
                    className="rounded-full border border-zinc-200 px-[9px] py-[3px] text-[11px] font-medium"
                    style={{ background: "#f1f0ec", color: "#6b6f6b" }}
                  >
                    {activeM.s?.scored ?? 0} of {activeFn.dimensions.length} scored
                  </span>
                  {/* Suggested level card */}
                  <div className="flex items-center gap-[9px] rounded-[9px] bg-ant-ink px-[13px] py-[5px]">
                    <span className="text-[9px] uppercase leading-[1.1] tracking-[.07em] text-zinc-500">
                      Suggested<br />level
                    </span>
                    <span className="text-[17px] font-semibold tracking-[-0.01em]" style={{ color: "#b2ffe3" }}>
                      {activeM.s ? codeFor(activeM.s.median) : "—"}
                    </span>
                  </div>
                  {/* Chart toggle */}
                  <button
                    onClick={() => setShowChart((v) => !v)}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-[8px] border px-[9px] py-[7px] text-xs font-medium transition-all duration-[130ms] ${
                      showChart
                        ? "border-ant-ink bg-ant-ink text-white"
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-[#ccccc8]"
                    }`}
                    title="Toggle candidate profile"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                      <line x1="12" y1="2" x2="12" y2="22" />
                      <line x1="2" y1="8.5" x2="22" y2="15.5" />
                      <line x1="22" y1="8.5" x2="2" y2="15.5" />
                    </svg>
                  </button>
                  {/* Export */}
                  <button
                    onClick={() => { setExportFor(exportFor === activeM.id ? null : activeM.id); setCopied(false); }}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-[8px] border px-[9px] py-[7px] text-xs font-medium transition-all duration-[130ms] ${
                      exportFor === activeM.id
                        ? "border-ant-ink bg-ant-ink text-white"
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-[#ccccc8] hover:text-ant-ink"
                    }`}
                    title="Export scorecard"
                  >
                    <Copy size={12} />
                  </button>
                  {/* Delete */}
                  {confirmDelete ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-zinc-400">Delete candidate?</span>
                      <button
                        onClick={() => { deleteCandidate(activeM.id); setConfirmDelete(false); }}
                        className="rounded px-2 py-0.5 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors duration-150"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="rounded px-2 py-0.5 text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors duration-150"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="rounded px-2 py-0.5 text-xs font-medium text-zinc-400 hover:text-red-500 transition-colors duration-150"
                      title="Delete candidate"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Export panel */}
              {exportFor === activeM.id && (
                <div className="mx-6 mt-4 shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">Ashby scorecard</span>
                    <button
                      onClick={copyExport}
                      className="flex items-center gap-1 rounded-md bg-ant-ink px-2.5 py-1 text-xs font-medium text-white transition-colors duration-150 hover:bg-ant-forest"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={exportText()}
                    onFocus={(e) => e.target.select()}
                    rows={Math.min(18, 4 + activeFn.dimensions.length * 2)}
                    className="w-full resize-y rounded border border-zinc-200 bg-white p-2 text-xs text-zinc-700 outline-none"
                    style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
                  />
                </div>
              )}

              {/* Dimension cards + optional chart panel */}
              <div className="flex flex-1 overflow-hidden">

                {/* Dimension cards */}
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-[18px] pb-7">
                  {!activeFn.dimensions.length ? (
                    <p className="mt-16 text-center text-sm text-zinc-400">
                      This function has no dimensions yet. Add some in Settings.
                    </p>
                  ) : (
                    activeFn.dimensions.map((d) => {
                      const cur = activeM.scores[d.id] ?? null;
                      const med = activeM.s?.median ?? null;
                      return (
                        <div
                          key={d.id}
                          className="flex flex-col gap-[13px] rounded-[13px] border border-zinc-200 bg-white px-4 py-[15px]"
                        >
                          {/* Dimension header */}
                          <div className="flex items-center justify-between gap-2.5">
                            <span className="text-[13.5px] font-semibold tracking-[-0.01em]">{d.name}</span>
                            <span
                              className="shrink-0 rounded-full px-[9px] py-[2px] text-[11px] font-semibold"
                              style={cur
                                ? { background: "#b2ffe3", color: "#04231b" }
                                : { background: "#f1f0ec", color: "#9a9c99" }}
                            >
                              {cur ? `${codeFor(cur)} selected` : "Unscored"}
                            </span>
                          </div>

                          {/* 5-column descriptor grid */}
                          <div className="grid grid-cols-5 gap-2">
                            {idx5.map((i) => {
                              const lvl         = i + 1;
                              const isSelected  = cur === lvl;
                              const isSuggest   = med === lvl && cur !== lvl;
                              return (
                                <button
                                  key={i}
                                  onClick={() => setScore(activeM.id, d.id, lvl)}
                                  className="flex cursor-pointer flex-col gap-2 rounded-[10px] p-[11px] text-left font-[inherit] transition-all duration-[140ms]"
                                  style={isSelected
                                    ? { background: "#b2ffe3", border: "1px solid #33e2c3", boxShadow: "0 0 0 1px #33e2c3, 0 9px 20px -11px rgba(0,74,56,.5)" }
                                    : { background: "#ffffff", border: "1px solid #eceae4" }}
                                >
                                  {/* Number circle + level label */}
                                  <div className="flex items-center gap-[7px]">
                                    <div
                                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                                      style={isSelected
                                        ? { background: "#33e2c3", color: "#050d0a", boxShadow: "0 0 0 3px rgba(51,226,195,.28)" }
                                        : isSuggest
                                        ? { background: "#fff", color: "#3a3f3b", border: "1.5px dashed #b3b5b1" }
                                        : { background: "#f4f3ee", color: "#9a9c99", border: "1px solid #e5e4e0" }}
                                    >
                                      {lvl}
                                    </div>
                                    <span
                                      className="text-[11.5px] font-semibold tracking-[.02em]"
                                      style={{ color: isSelected ? "#04231b" : "#0c1512" }}
                                    >
                                      {activeFn.levelCodes[i] || `L${lvl}`}
                                    </span>
                                  </div>
                                  {/* Median marker */}
                                  {isSuggest && (
                                    <span
                                      className="self-start rounded border border-dashed border-[#ccccc8] px-[5px] py-[1px] text-[8.5px] font-bold uppercase tracking-[.07em] text-zinc-400"
                                    >
                                      median
                                    </span>
                                  )}
                                  {/* Descriptor */}
                                  <div
                                    className="text-[12px] leading-[1.45]"
                                    style={{ color: isSelected ? "#123a30" : "#505551" }}
                                  >
                                    {d.cells[i] || <span className="italic" style={{ color: "#c4c5c1" }}>No descriptor</span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Evidence input */}
                          <div className="flex items-center gap-[10px] border-t border-dashed border-zinc-200 pt-[11px]">
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[.05em] text-zinc-400">
                              Evidence
                            </span>
                            <input
                              value={activeM.notes[d.id] || ""}
                              onChange={(e) => setNote(activeM.id, d.id, e.target.value)}
                              placeholder="Cite a specific moment, quote, or artifact…"
                              className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-[11px] py-[7px] text-[12px] text-ant-ink outline-none placeholder:text-zinc-400 focus:border-ant-teal focus:bg-white"
                              style={{ background: "#fcfbf7" }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Candidate profile panel */}
                {showChart && (
                  <div
                    className="flex w-[300px] shrink-0 flex-col gap-[15px] overflow-y-auto border-l border-zinc-200 p-4"
                    style={{ background: "#fbfaf6" }}
                  >
                    <div className="flex shrink-0 items-center justify-between">
                      <span
                        className="text-[10.5px] font-semibold uppercase tracking-[.06em]"
                        style={{ color: "#6b6f6b" }}
                      >
                        Candidate profile
                      </span>
                      <button
                        onClick={() => setShowChart(false)}
                        className="cursor-pointer border-none bg-transparent p-1 text-base leading-none text-zinc-400 hover:text-ant-ink"
                      >
                        ×
                      </button>
                    </div>

                    {/* Suggested level card */}
                    <div className="flex shrink-0 items-center justify-between rounded-[11px] bg-ant-ink px-[15px] py-[14px]">
                      <div>
                        <div className="text-[9px] uppercase tracking-[.07em] text-zinc-500">Suggested level</div>
                        <div
                          className="mt-[2px] text-[26px] font-semibold leading-tight tracking-[-0.02em]"
                          style={{ color: "#b2ffe3" }}
                        >
                          {activeM.s ? codeFor(activeM.s.median) : "—"}
                        </div>
                      </div>
                      <div className="max-w-[120px] text-right text-[10.5px] leading-[1.4] text-zinc-400">
                        {activeM.unscored > 0
                          ? `${activeM.unscored} dimension${activeM.unscored > 1 ? "s" : ""} unscored — read with caution.`
                          : activeM.spread >= 2
                          ? `${activeM.spread}-level spread across dimensions.`
                          : "Consistent across dimensions."}
                      </div>
                    </div>

                    {/* Per-dimension dot bars */}
                    <div className="flex flex-col gap-[13px]">
                      {activeFn.dimensions.map((d) => {
                        const score = activeM.scores[d.id] ?? null;
                        return (
                          <div key={d.id} className="flex flex-col gap-[7px]">
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] font-semibold" style={{ color: "#0c1512" }}>
                                {d.name}
                              </span>
                              <span
                                className="text-[11px] font-semibold"
                                style={{ color: score ? "#04231b" : "#9a9c99" }}
                              >
                                {score ? codeFor(score) : "Unscored"}
                              </span>
                            </div>
                            <div className="flex items-center gap-[7px]">
                              {idx5.map((i) => {
                                const lvl   = i + 1;
                                const isSel = score === lvl;
                                const isOn  = score != null && lvl <= score;
                                return (
                                  <div
                                    key={i}
                                    className="h-[13px] w-[13px] shrink-0 rounded-full"
                                    style={isSel
                                      ? { background: "#33e2c3", boxShadow: "0 0 0 2px rgba(51,226,195,.32)" }
                                      : isOn
                                      ? { background: "#b2ffe3" }
                                      : { background: "#fff", border: "1px solid #d8d7d1" }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-auto border-t border-zinc-200 pt-3 text-[10.5px] leading-[1.5] text-zinc-400">
                      Median of scored dimensions, rounded. Spread and unscored gaps are surfaced, not hidden — calibrate before locking a level.
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add candidate modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">New candidate</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={16} />
              </button>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-zinc-500">Name</label>
              <input
                autoFocus
                value={candName}
                onChange={(e) => setCandName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                maxLength={60}
                placeholder="Candidate name"
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-ant-teal"
              />
            </div>
            <div className="mb-5">
              <label className="mb-1 block text-xs font-medium text-zinc-500">Function</label>
              <select
                value={candFnId}
                onChange={(e) => setCandFnId(e.target.value)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              >
                {functions.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition-colors duration-150 hover:border-zinc-300 hover:text-ant-ink"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!candName.trim()}
                className="rounded-md bg-ant-ink px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-ant-forest disabled:opacity-40"
              >
                Add candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
