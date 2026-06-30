import { useState, useEffect, useRef, useCallback } from "react";
import Layout from "./components/Layout";
import ScoreView from "./components/ScoreView";
import CandidatesView from "./components/CandidatesView";
import SettingsView from "./components/SettingsView";
import { uid } from "./lib/utils";
import { loadState, saveConfig, insertCandidate, upsertCandidate, removeCandidate } from "./lib/db";
import { supabase } from "./lib/supabase";

const ENG = {
  id: "eng",
  name: "Engineering (IC)",
  levelCodes: ["ICT1", "ICT2", "ICT3", "ICT4", "ICT5"],
  levelAnchors: ["Intern / new grad", "~3 to 5 yrs", "~5 to 8 yrs", "Deep specialist", "Sets vision"],
  seniorBar: 3,
  dimensions: [
    {
      id: "tech", name: "Technical depth & domain expertise",
      cells: [
        "Learning fundamentals. Needs guidance on technical choices.",
        "Building real expertise in a technology. Handles complex tasks.",
        "Expert in their technology domain. Makes significant technical decisions.",
        "Deep specialist (ML, security, networking, etc.). Company go-to expert, recognized externally via patents, papers, or OSS.",
        "Shapes Anterior's long-term technology vision. Leads development of new technologies.",
      ],
    },
    {
      id: "scope", name: "Scope & ownership",
      cells: [
        "Small, well-defined pieces of work under close supervision.",
        "More complex work with wider scope. Takes ownership of their area.",
        "Leads large projects. Runs reliably with minimal input.",
        "The go-to across the whole company for their specialization.",
        "Drives org-wide technical direction. Key decision-maker in engineering.",
      ],
    },
    {
      id: "arch", name: "Architecture & technical decisions",
      cells: [
        "Implements within a defined design. Little design responsibility.",
        "Designs within a single component or feature.",
        "Owns architecture and design of major systems. An abstraction layer for the eng org.",
        "Sets the technical bar in their specialist area. A reference point for staff engineers elsewhere.",
        "Leads new-technology development and long-term technical strategy.",
      ],
    },
    {
      id: "leadership", name: "Leadership & mentoring",
      cells: [
        "Focused on own growth. Shows agency and humility.",
        "Starts to mentor junior engineers. Early leadership signals.",
        "Mentors both junior and mid-level engineers.",
        "A point of contact for staff-level engineers, including at other companies.",
        "Key decision-maker who influences product direction and company strategy.",
      ],
    },
    {
      id: "customer", name: "Customer & domain knowledge",
      cells: [
        "Limited exposure to the customer. Still learning the domain.",
        "Shows knowledge of the customer.",
        "Deep knowledge of the customer.",
        "Applies customer insight to a specialist area.",
        "Understands the full technology and customer landscape. Feeds company strategy.",
      ],
    },
  ],
};

const blankFunction = (name) => ({
  id: uid(),
  name,
  levelCodes: ["L1", "L2", "L3", "L4", "L5"],
  levelAnchors: ["", "", "", "", ""],
  seniorBar: 3,
  dimensions: [{ id: uid(), name: "New dimension", cells: ["", "", "", "", ""] }],
});

export default function App() {
  const [functions, setFunctions] = useState([ENG]);
  const [candidates, setCandidates] = useState([]);
  const [activeId, setActiveId] = useState(ENG.id);
  const [view, setView] = useState("score");
  const [loaded, setLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Debounced writes for rapid score/note changes
  const pendingRef = useRef({});
  const timerRef  = useRef(null);

  const flushWrites = useCallback(() => {
    const batch = Object.values(pendingRef.current);
    pendingRef.current = {};
    batch.forEach(upsertCandidate);
  }, []);

  const queueWrite = useCallback((candidate) => {
    pendingRef.current[candidate.id] = candidate;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flushWrites, 1000);
  }, [flushWrites]);

  // Load from Supabase on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user?.email ?? null);
    });
    loadState().then(({ functions: fns, candidates: cands }) => {
      if (fns && fns.length) {
        setFunctions(fns);
        setActiveId(fns[0].id);
      }
      setCandidates(cands);
      setLoaded(true);
    });
  }, []);

  // Save rubric config when functions change
  useEffect(() => {
    if (!loaded) return;
    saveConfig(functions);
  }, [functions, loaded]);

  const activeFn = functions.find((f) => f.id === activeId) || functions[0];

  const updateFn = (id, updater) => setFunctions((fs) => fs.map((f) => (f.id === id ? updater(f) : f)));

  const addFunction = (name) => {
    const f = blankFunction(name);
    setFunctions((fs) => [...fs, f]);
    setActiveId(f.id);
  };

  const deleteFunction = (id) => {
    if (functions.length <= 1) return;
    const next = functions.filter((f) => f.id !== id);
    setFunctions(next);
    setCandidates((cs) => cs.filter((c) => c.functionId !== id));
    if (activeId === id) setActiveId(next[0].id);
  };

  const renameFn       = (id, name)          => updateFn(id, (f) => ({ ...f, name }));
  const setSeniorBar   = (id, n)              => updateFn(id, (f) => ({ ...f, seniorBar: n }));
  const setLevelCode   = (id, i, v)           => updateFn(id, (f) => ({ ...f, levelCodes:   f.levelCodes.map((c, j)   => j === i ? v : c) }));
  const setLevelAnchor = (id, i, v)           => updateFn(id, (f) => ({ ...f, levelAnchors: f.levelAnchors.map((c, j) => j === i ? v : c) }));
  const addDimension   = (id)                 => updateFn(id, (f) => ({ ...f, dimensions: [...f.dimensions, { id: uid(), name: "New dimension", cells: ["", "", "", "", ""] }] }));
  const deleteDimension  = (id, dimId)        => updateFn(id, (f) => ({ ...f, dimensions: f.dimensions.filter((d) => d.id !== dimId) }));
  const renameDimension  = (id, dimId, name)  => updateFn(id, (f) => ({ ...f, dimensions: f.dimensions.map((d) => d.id === dimId ? { ...d, name } : d) }));
  const setCell = (id, dimId, i, v)           => updateFn(id, (f) => ({ ...f, dimensions: f.dimensions.map((d) => d.id === dimId ? { ...d, cells: d.cells.map((c, j) => j === i ? v : c) } : d) }));

  const addCandidate = (name, functionId) => {
    const fn = functions.find((f) => f.id === functionId) || activeFn;
    const newId = uid();
    const scores = {};
    const notes  = {};
    fn.dimensions.forEach((d) => { scores[d.id] = null; notes[d.id] = ""; });
    const candidate = {
      id: newId, name, functionId: fn.id, visible: true, scores, notes,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
    };
    insertCandidate(candidate);
    setCandidates((cs) => [...cs, candidate]);
    return newId;
  };

  const deleteCandidate = (id) => {
    removeCandidate(id);
    setCandidates((cs) => cs.filter((c) => c.id !== id));
  };

  const toggleVisible = (id) => {
    setCandidates((cs) => cs.map((c) => {
      if (c.id !== id) return c;
      const updated = { ...c, visible: !c.visible };
      queueWrite(updated);
      return updated;
    }));
  };

  const setScore = (id, dim, n) => {
    setCandidates((cs) => cs.map((c) => {
      if (c.id !== id) return c;
      const updated = { ...c, scores: { ...c.scores, [dim]: c.scores[dim] === n ? null : n } };
      queueWrite(updated);
      return updated;
    }));
  };

  const setNote = (id, dim, v) => {
    setCandidates((cs) => cs.map((c) => {
      if (c.id !== id) return c;
      const updated = { ...c, notes: { ...c.notes, [dim]: v } };
      queueWrite(updated);
      return updated;
    }));
  };

  const fnHandlers = {
    addFunction, deleteFunction, renameFn, setSeniorBar,
    setLevelCode, setLevelAnchor, addDimension, deleteDimension, renameDimension, setCell,
  };
  const candHandlers = { addCandidate, deleteCandidate, toggleVisible, setScore, setNote };

  return (
    <Layout view={view} setView={setView}>
      {view === "score" && (
        <ScoreView
          functions={functions}
          activeFn={activeFn}
          activeId={activeId}
          setActiveId={setActiveId}
          candidates={candidates}
          {...candHandlers}
        />
      )}
      {view === "candidates" && (
        <CandidatesView
          candidates={candidates}
          functions={functions}
          deleteCandidate={deleteCandidate}
        />
      )}
      {view === "settings" && (
        <SettingsView
          functions={functions}
          activeFn={activeFn}
          activeId={activeId}
          setActiveId={setActiveId}
          {...fnHandlers}
        />
      )}
    </Layout>
  );
}
