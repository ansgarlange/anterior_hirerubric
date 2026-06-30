import { useState } from "react";
import { X } from "lucide-react";
import { suggested } from "../lib/utils";

export default function CandidatesView({ candidates, functions, deleteCandidate }) {
  const [search, setSearch] = useState("");
  const [fnFilter, setFnFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const fnMap = Object.fromEntries(functions.map((f) => [f.id, f]));

  let list = candidates.filter((c) => {
    const matchName = c.name.toLowerCase().includes(search.toLowerCase());
    const matchFn = fnFilter === "all" || c.functionId === fnFilter;
    return matchName && matchFn;
  });

  if (sortBy === "date") {
    list = [...list].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } else if (sortBy === "level") {
    list = [...list].sort((a, b) => {
      const sa = fnMap[a.functionId] ? suggested(a, fnMap[a.functionId]) : null;
      const sb = fnMap[b.functionId] ? suggested(b, fnMap[b.functionId]) : null;
      return (sb?.median || 0) - (sa?.median || 0);
    });
  } else if (sortBy === "name") {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search candidates…"
          className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-300"
        />
        <select
          value={fnFilter}
          onChange={(e) => setFnFilter(e.target.value)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        >
          <option value="all">All functions</option>
          {functions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        >
          <option value="date">Newest first</option>
          <option value="level">By level</option>
          <option value="name">By name</option>
        </select>
      </div>

      {!candidates.length ? (
        <p className="mt-16 text-center text-sm text-zinc-400">No candidates scored yet. Go to Score to add one.</p>
      ) : !list.length ? (
        <p className="mt-16 text-center text-sm text-zinc-400">No candidates match your filters.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <th className="px-4 py-3 text-left">Candidate</th>
                <th className="px-4 py-3 text-left">Function</th>
                <th className="px-4 py-3 text-left">Suggested level</th>
                <th className="px-4 py-3 text-left">Dimensions scored</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const fn = fnMap[c.functionId];
                const s = fn ? suggested(c, fn) : null;
                const spiky = s && s.max - s.min >= 2;
                const belowBar = fn && s && s.median < fn.seniorBar;
                const code = (n) => fn ? (fn.levelCodes[n - 1] || "L" + n) : String(n);
                return (
                  <tr key={c.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-zinc-500">{fn?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s ? (
                          <span className="rounded bg-ant-ink px-2 py-0.5 text-xs font-semibold text-white">
                            {code(s.median)}
                          </span>
                        ) : (
                          <span className="text-zinc-500">unscored</span>
                        )}
                        {belowBar && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">below bar</span>
                        )}
                        {spiky && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">spiky</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {s ? `${s.scored} / ${fn?.dimensions.length || 0}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteCandidate(c.id)}
                        className="text-zinc-300 hover:text-red-500"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
