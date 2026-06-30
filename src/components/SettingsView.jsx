import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";

const idx5 = [0, 1, 2, 3, 4];

export default function SettingsView({
  functions, activeFn, activeId, setActiveId,
  addFunction, deleteFunction, renameFn, setSeniorBar,
  setLevelCode, setLevelAnchor, addDimension, deleteDimension, renameDimension, setCell,
}) {
  const [fnInput, setFnInput] = useState("");

  const inputCls = "rounded border border-zinc-200 bg-white px-2 py-1 text-xs outline-none focus:border-zinc-400";

  function handleAddFunction() {
    const name = fnInput.trim();
    if (!name) return;
    addFunction(name);
    setFnInput("");
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 shrink-0 overflow-y-auto border-r border-zinc-200 bg-white p-4">
        <p className="mb-3 text-xs font-semibold text-zinc-500">Functions</p>
        <div className="mb-4 space-y-1">
          {functions.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveId(f.id)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors duration-150 ${
                f.id === activeId ? "bg-ant-ink text-white" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            value={fnInput}
            onChange={(e) => setFnInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddFunction()}
            placeholder="New function"
            className={inputCls + " min-w-0 flex-1"}
          />
          <button
            onClick={handleAddFunction}
            className="flex items-center rounded-md bg-ant-ink px-2 py-1 text-white transition-colors duration-150 hover:bg-ant-forest"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Rubric editor */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">
              Function name
            </label>
            <input
              value={activeFn.name}
              onChange={(e) => renameFn(activeFn.id, e.target.value)}
              className={inputCls + " w-64 text-sm"}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-500">
              Senior bar
            </label>
            <div className="flex gap-1">
              {idx5.map((i) => (
                <button
                  key={i}
                  onClick={() => setSeniorBar(activeFn.id, i + 1)}
                  className={`w-12 rounded border py-1 text-xs font-medium transition-colors duration-150 ${
                    activeFn.seniorBar === i + 1
                      ? "border-ant-forest bg-ant-mint/25 text-ant-forest"
                      : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  {activeFn.levelCodes[i] || "L" + (i + 1)}
                </button>
              ))}
            </div>
          </div>
          {functions.length > 1 && (
            <button
              onClick={() => deleteFunction(activeFn.id)}
              className="ml-auto flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-500 hover:border-red-300 hover:text-red-500"
            >
              <Trash2 size={13} /> Delete function
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 align-bottom">
                <th className="p-2 font-semibold text-zinc-700" style={{ minWidth: 150 }}>Dimension</th>
                {idx5.map((i) => (
                  <th
                    key={i}
                    className={`p-2 ${activeFn.seniorBar === i + 1 ? "bg-ant-mint/10" : ""}`}
                    style={{ minWidth: 150 }}
                  >
                    <input
                      value={activeFn.levelCodes[i]}
                      onChange={(e) => setLevelCode(activeFn.id, i, e.target.value)}
                      className={inputCls + " mb-1 w-full font-semibold"}
                    />
                    <input
                      value={activeFn.levelAnchors[i]}
                      onChange={(e) => setLevelAnchor(activeFn.id, i, e.target.value)}
                      placeholder="anchor"
                      className={inputCls + " w-full text-zinc-400"}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeFn.dimensions.map((d) => (
                <tr key={d.id} className="border-b border-zinc-100 align-top last:border-0">
                  <td className="p-2">
                    <div className="flex items-start gap-1">
                      <textarea
                        value={d.name}
                        onChange={(e) => renameDimension(activeFn.id, d.id, e.target.value)}
                        rows={2}
                        className={inputCls + " w-full resize-none font-medium text-zinc-800"}
                      />
                      <button
                        onClick={() => deleteDimension(activeFn.id, d.id)}
                        className="mt-1 text-zinc-300 hover:text-red-500"
                        title="Remove dimension"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </td>
                  {idx5.map((i) => (
                    <td key={i} className={`p-2 ${activeFn.seniorBar === i + 1 ? "bg-ant-mint/10" : ""}`}>
                      <textarea
                        value={d.cells[i]}
                        onChange={(e) => setCell(activeFn.id, d.id, i, e.target.value)}
                        rows={4}
                        placeholder="descriptor"
                        className={inputCls + " w-full resize-y text-zinc-600"}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={() => addDimension(activeFn.id)}
          className="mt-3 flex items-center gap-1 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-400"
        >
          <Plus size={13} /> Add dimension
        </button>
      </div>
    </div>
  );
}
