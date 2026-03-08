"use client";

import { useEffect, useState, useCallback } from "react";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";

// ─── Types ────────────────────────────────────────────────────────────────────
export type SequenceMeta = {
    id: string;
    name: string;
    cells: Record<string, boolean>;
    createdAt: number;
};

export type PianoRollNote = {
    id: string;
    pitch: string;        // e.g. "C2", "D#3", or "Hit" for drums
    startStep: number;    // 0–15
    durationSteps: number; // 1+
};

export type TrackMode = "grid" | "piano-roll";

// ─── Yjs singletons ───────────────────────────────────────────────────────────
let ydoc: Y.Doc;
let provider: LiveblocksYjsProvider | null = null;
let ysequences: Y.Map<Y.Map<any>>;
let yactive: Y.Map<string>;
let ysettings: Y.Map<any>;

const createEmptyGrid = (steps: number = 16) => Array.from({ length: 4 }, () => Array(steps).fill(false));

function newId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function gridToFlat(grid: boolean[][]): Record<string, boolean> {
    const flat: Record<string, boolean> = {};
    grid.forEach((row, r) => row.forEach((v, c) => { if (v) flat[`${r}-${c}`] = true; }));
    return flat;
}

function createYSequence(name: string, grid?: boolean[][]): Y.Map<any> {
    const yseq = new Y.Map<any>();
    const ycells = new Y.Map<boolean>();
    if (grid) {
        const flat = gridToFlat(grid);
        Object.entries(flat).forEach(([k, v]) => ycells.set(k, v));
    }
    yseq.set("name", name);
    yseq.set("cells", ycells);
    yseq.set("createdAt", Date.now());
    yseq.set("stepCount", 16);

    // Piano roll data structures
    yseq.set("trackModes", new Y.Map<string>());   // trackIdx → "grid"|"piano-roll"
    yseq.set("pianoRolls", new Y.Map<Y.Map<any>>()); // trackIdx → Y.Map<noteId, noteObj>

    return yseq;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
export const initSync = (room?: any) => {
    if (!ydoc) {
        ydoc = new Y.Doc();
        ysequences = ydoc.getMap<Y.Map<any>>("sequences");
        yactive = ydoc.getMap<string>("activeSequence");
        ysettings = ydoc.getMap<any>("settings");

        if (!ysettings.has("bpm")) ysettings.set("bpm", 120);
        if (!ysettings.has("scaleKey")) ysettings.set("scaleKey", "C");
        if (!ysettings.has("scaleType")) ysettings.set("scaleType", "Major");

        if (ysequences.size === 0) {
            const id = `seq-${newId()}`;
            ysequences.set(id, createYSequence("Beat 1"));
        }
    }

    if (!provider && room) {
        provider = new LiveblocksYjsProvider(room, ydoc);
    }

    return { ydoc, provider, ysequences, yactive, ysettings };
};

// ─── useSequences ─────────────────────────────────────────────────────────────
export const useSequences = () => {
    const [sequences, setSequences] = useState<SequenceMeta[]>([]);
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        const { ysequences: ys } = initSync();

        const rebuild = () => {
            const list: SequenceMeta[] = [];
            ys.forEach((yseq, id) => {
                const ycells = yseq.get("cells") as Y.Map<boolean>;
                const cells: Record<string, boolean> = {};
                ycells?.forEach((v, k) => { if (v) cells[k] = v; });
                list.push({ id, name: yseq.get("name") ?? "Untitled", cells, createdAt: yseq.get("createdAt") ?? 0 });
            });
            list.sort((a, b) => a.createdAt - b.createdAt);
            setSequences(prev => {
                if (prev.length === 0 && list.length > 0) {
                    setActiveId(curr => curr || list[0].id);
                }
                return list;
            });
        };

        rebuild();
        const deepObserve = () => rebuild();
        ys.observeDeep(deepObserve);
        return () => ys.unobserveDeep(deepObserve);
    }, []);

    const selectSequence = useCallback((id: string) => setActiveId(id), []);

    const addSequence = useCallback(() => {
        const { ydoc: doc, ysequences: ys } = initSync();
        const id = `seq-${newId()}`;
        doc.transact(() => { ys.set(id, createYSequence(`Beat ${ys.size + 1}`)); });
        setActiveId(id);
    }, []);

    const deleteSequence = useCallback((id: string) => {
        const { ydoc: doc, ysequences: ys } = initSync();
        doc.transact(() => { ys.delete(id); });
        setActiveId(curr => {
            if (curr !== id) return curr;
            const remaining = Array.from(ys.keys()).filter(k => k !== id);
            return remaining[0] ?? "";
        });
    }, []);

    return { sequences, activeId, selectSequence, addSequence, deleteSequence };
};

// ─── useActiveSequence ────────────────────────────────────────────────────────
export const useActiveSequence = (activeId: string) => {
    const [grid, setGrid] = useState<boolean[][]>(createEmptyGrid(16));
    const [name, setName] = useState<string>("");
    const [stepCount, setStepCount] = useState<number>(16);

    useEffect(() => {
        if (!activeId) return;
        const { ysequences: ys } = initSync();
        const yseq = ys.get(activeId);
        if (!yseq) return;

        const ycells = yseq.get("cells") as Y.Map<boolean>;
        setName(yseq.get("name") ?? "Untitled");

        if (!yseq.has("stepCount")) yseq.set("stepCount", 16);
        const currentSteps = yseq.get("stepCount") as number ?? 16;
        setStepCount(currentSteps);

        const rebuildGrid = () => {
            const steps = yseq.get("stepCount") as number ?? 16;
            const newGrid = createEmptyGrid(steps);
            ycells?.forEach((v, key) => {
                const [r, c] = key.split("-").map(Number);
                if (r >= 0 && r < 4 && c >= 0 && c < steps) newGrid[r][c] = v;
            });
            setGrid(newGrid.map(row => [...row]));
        };

        rebuildGrid();
        const seqObserver = () => {
            setName(yseq.get("name") ?? "Untitled");
            setStepCount(yseq.get("stepCount") as number ?? 16);
            rebuildGrid();
        };
        yseq.observe(seqObserver);
        ycells?.observe(rebuildGrid);

        return () => { yseq.unobserve(seqObserver); ycells?.unobserve(rebuildGrid); };
    }, [activeId]);

    const toggleCell = useCallback((trackIndex: number, stepIndex: number) => {
        if (!activeId) return;
        const { ysequences: ys } = initSync();
        const yseq = ys.get(activeId);
        if (!yseq) return;
        const ycells = yseq.get("cells") as Y.Map<boolean>;
        const key = `${trackIndex}-${stepIndex}`;
        ycells.set(key, !(ycells.get(key) ?? false));
    }, [activeId]);

    const setGridBulk = useCallback((newGrid: boolean[][]) => {
        if (!activeId) return;
        const { ydoc: doc, ysequences: ys } = initSync();
        const yseq = ys.get(activeId);
        if (!yseq) return;
        const ycells = yseq.get("cells") as Y.Map<boolean>;
        const steps = yseq.get("stepCount") as number ?? 16;
        doc.transact(() => {
            for (let t = 0; t < 4; t++)
                for (let s = 0; s < steps; s++)
                    ycells.set(`${t}-${s}`, newGrid[t][s]);
        });
    }, [activeId]);

    const clearAll = useCallback(() => {
        if (!activeId) return;
        const { ydoc: doc, ysequences: ys } = initSync();
        const yseq = ys.get(activeId);
        if (!yseq) return;
        const ycells = yseq.get("cells") as Y.Map<boolean>;
        const yRolls = yseq.get("pianoRolls") as Y.Map<Y.Map<any>>;
        const steps = yseq.get("stepCount") as number ?? 16;
        doc.transact(() => {
            for (let t = 0; t < 4; t++) {
                for (let s = 0; s < steps; s++) {
                    ycells.set(`${t}-${s}`, false);
                }
                const yNotes = yRolls?.get(String(t)) as Y.Map<any>;
                if (yNotes) {
                    Array.from(yNotes.keys()).forEach(k => yNotes.delete(k));
                }
            }
        });
    }, [activeId]);

    const clearTrack = useCallback((trackIndex: number) => {
        if (!activeId) return;
        const { ydoc: doc, ysequences: ys } = initSync();
        const yseq = ys.get(activeId);
        if (!yseq) return;
        const ycells = yseq.get("cells") as Y.Map<boolean>;
        const yRolls = yseq.get("pianoRolls") as Y.Map<Y.Map<any>>;
        const steps = yseq.get("stepCount") as number ?? 16;
        doc.transact(() => {
            for (let s = 0; s < steps; s++) {
                ycells.set(`${trackIndex}-${s}`, false);
            }
            const yNotes = yRolls?.get(String(trackIndex)) as Y.Map<any>;
            if (yNotes) {
                Array.from(yNotes.keys()).forEach(k => yNotes.delete(k));
            }
        });
    }, [activeId]);

    const doublePatternLength = useCallback(() => {
        if (!activeId) return;
        const { ydoc: doc, ysequences: ys } = initSync();
        const yseq = ys.get(activeId);
        if (!yseq) return;
        const ycells = yseq.get("cells") as Y.Map<boolean>;
        const yRolls = yseq.get("pianoRolls") as Y.Map<Y.Map<any>>;
        const currentSteps = yseq.get("stepCount") as number ?? 16;
        const newSteps = currentSteps * 2;

        doc.transact(() => {
            yseq.set("stepCount", newSteps);
            // Copy grid cells
            for (let t = 0; t < 4; t++) {
                for (let s = 0; s < currentSteps; s++) {
                    const val = ycells.get(`${t}-${s}`);
                    if (val) ycells.set(`${t}-${s + currentSteps}`, true);
                }
            }
            // Copy piano roll notes
            for (let t = 0; t < 4; t++) {
                const yNotes = yRolls?.get(String(t)) as Y.Map<any>;
                if (yNotes) {
                    const notesToCopy: PianoRollNote[] = [];
                    yNotes.forEach((note: PianoRollNote) => {
                        if (note.startStep < currentSteps) notesToCopy.push(note);
                    });
                    notesToCopy.forEach(note => {
                        const id = `note-${newId()}`;
                        yNotes.set(id, { ...note, id, startStep: note.startStep + currentSteps });
                    });
                }
            }
        });
    }, [activeId]);

    const renameSequence = useCallback((newName: string) => {
        if (!activeId) return;
        initSync().ysequences.get(activeId)?.set("name", newName);
    }, [activeId]);

    return { grid, name, stepCount, toggleCell, setRandomGrid: setGridBulk, clearAll, clearTrack, doublePatternLength, renameSequence };
};

// ─── useTrackModes ────────────────────────────────────────────────────────────
export const useTrackModes = (activeId: string) => {
    const [trackModes, setTrackModes] = useState<TrackMode[]>(["grid", "grid", "grid", "grid"]);

    useEffect(() => {
        if (!activeId) return;
        const { ysequences: ys } = initSync();
        const yseq = ys.get(activeId);
        if (!yseq) return;

        // Ensure trackModes map exists on older sequences
        if (!yseq.has("trackModes")) yseq.set("trackModes", new Y.Map<string>());
        const yModes = yseq.get("trackModes") as Y.Map<string>;

        const rebuild = () => {
            const modes: TrackMode[] = [0, 1, 2, 3].map(i => (yModes.get(String(i)) ?? "grid") as TrackMode);
            setTrackModes(modes);
        };
        rebuild();
        yModes.observe(rebuild);
        return () => yModes.unobserve(rebuild);
    }, [activeId]);

    const setTrackMode = useCallback((trackIndex: number, mode: TrackMode) => {
        if (!activeId) return;
        const { ysequences: ys } = initSync();
        const yseq = ys.get(activeId);
        if (!yseq) return;
        if (!yseq.has("trackModes")) yseq.set("trackModes", new Y.Map<string>());
        (yseq.get("trackModes") as Y.Map<string>).set(String(trackIndex), mode);
    }, [activeId]);

    return { trackModes, setTrackMode };
};

let pianoRollClipboard: Omit<PianoRollNote, "id">[] | null = null;

// ─── usePianoRolls ────────────────────────────────────────────────────────────
export const usePianoRolls = (activeId: string) => {
    // notes[trackIndex] = PianoRollNote[]
    const [pianoRolls, setPianoRolls] = useState<PianoRollNote[][]>([[], [], [], []]);

    useEffect(() => {
        if (!activeId) return;
        const { ysequences: ys } = initSync();
        const yseq = ys.get(activeId);
        if (!yseq) return;

        if (!yseq.has("pianoRolls")) yseq.set("pianoRolls", new Y.Map<Y.Map<any>>());
        const yRolls = yseq.get("pianoRolls") as Y.Map<Y.Map<any>>;

        // Ensure sub-maps exist for each track
        for (let t = 0; t < 4; t++) {
            if (!yRolls.has(String(t))) yRolls.set(String(t), new Y.Map<any>());
        }

        const rebuild = () => {
            const rolls: PianoRollNote[][] = [[], [], [], []];
            for (let t = 0; t < 4; t++) {
                const yNotes = yRolls.get(String(t)) as Y.Map<any>;
                if (yNotes) {
                    yNotes.forEach((note: PianoRollNote) => rolls[t].push(note));
                    rolls[t].sort((a, b) => a.startStep - b.startStep);
                }
            }
            setPianoRolls(rolls);
        };
        rebuild();
        yRolls.observeDeep(rebuild);
        return () => yRolls.unobserveDeep(rebuild);
    }, [activeId]);

    const addNote = useCallback((trackIndex: number, note: Omit<PianoRollNote, "id">) => {
        if (!activeId) return "";
        const { ysequences: ys } = initSync();
        const yseq = ys.get(activeId);
        if (!yseq) return "";
        const yRolls = yseq.get("pianoRolls") as Y.Map<Y.Map<any>>;
        const yNotes = yRolls?.get(String(trackIndex)) as Y.Map<any>;
        if (!yNotes) return "";
        const id = `note-${newId()}`;
        yNotes.set(id, { ...note, id });
        return id;
    }, [activeId]);

    const removeNote = useCallback((trackIndex: number, noteId: string) => {
        if (!activeId) return;
        const { ysequences: ys } = initSync();
        const yseq = ys.get(activeId);
        if (!yseq) return;
        const yRolls = yseq.get("pianoRolls") as Y.Map<Y.Map<any>>;
        const yNotes = yRolls?.get(String(trackIndex)) as Y.Map<any>;
        yNotes?.delete(noteId);
    }, [activeId]);

    const updateNoteDuration = useCallback((trackIndex: number, noteId: string, durationSteps: number) => {
        if (!activeId) return;
        const { ysequences: ys } = initSync();
        const yseq = ys.get(activeId);
        if (!yseq) return;
        const yRolls = yseq.get("pianoRolls") as Y.Map<Y.Map<any>>;
        const yNotes = yRolls?.get(String(trackIndex)) as Y.Map<any>;
        const existing = yNotes?.get(noteId);
        if (existing) yNotes.set(noteId, { ...existing, durationSteps });
    }, [activeId]);

    const updateNote = useCallback((trackIndex: number, noteId: string, updates: Partial<PianoRollNote>) => {
        if (!activeId) return;
        const { ysequences: ys } = initSync();
        const yseq = ys.get(activeId);
        if (!yseq) return;
        const yRolls = yseq.get("pianoRolls") as Y.Map<Y.Map<any>>;
        const yNotes = yRolls?.get(String(trackIndex)) as Y.Map<any>;
        const existing = yNotes?.get(noteId);
        if (existing) yNotes.set(noteId, { ...existing, ...updates });
    }, [activeId]);

    const copyPattern = useCallback((trackIndex: number) => {
        pianoRollClipboard = pianoRolls[trackIndex].map(n => ({
            pitch: n.pitch, startStep: n.startStep, durationSteps: n.durationSteps
        }));
    }, [pianoRolls]);

    const pastePattern = useCallback((trackIndex: number) => {
        if (!activeId || !pianoRollClipboard) return;
        const { ydoc, ysequences } = initSync();
        const yseq = ysequences.get(activeId);
        if (!yseq) return;
        const yRolls = yseq.get("pianoRolls") as Y.Map<Y.Map<any>>;
        const yNotes = yRolls?.get(String(trackIndex)) as Y.Map<any>;
        if (!yNotes) return;

        ydoc.transact(() => {
            Array.from(yNotes.keys()).forEach(k => yNotes.delete(k));
            pianoRollClipboard!.forEach(note => {
                const id = `note-${newId()}`;
                yNotes.set(id, { ...note, id });
            });
        });
    }, [activeId]);

    return {
        pianoRolls,
        addNote,
        removeNote,
        updateNoteDuration,
        updateNote,
        copyPattern,
        pastePattern,
        hasClipboard: pianoRollClipboard !== null && pianoRollClipboard.length > 0
    };
};

export const useBpm = () => {
    const [bpm, setBpmState] = useState<number>(120);

    useEffect(() => {
        const { ysettings } = initSync();
        const update = () => setBpmState(ysettings.get("bpm") as number ?? 120);
        update();
        ysettings.observe(update);
        return () => ysettings.unobserve(update);
    }, []);

    const setBpm = useCallback((newBpm: number) => {
        initSync().ysettings.set("bpm", newBpm);
    }, []);

    return { bpm, setBpm };
};

// ─── useGlobalScale ───────────────────────────────────────────────────────────
export const useGlobalScale = () => {
    const [scaleKey, setScaleKeyState] = useState<string>("C");
    const [scaleType, setScaleTypeState] = useState<string>("Major");

    useEffect(() => {
        const { ysettings } = initSync();
        const update = () => {
            setScaleKeyState(ysettings.get("scaleKey") as string ?? "C");
            setScaleTypeState(ysettings.get("scaleType") as string ?? "Major");
        };
        update();
        ysettings.observe(update);
        return () => ysettings.unobserve(update);
    }, []);

    const setScaleKey = useCallback((newKey: string) => {
        initSync().ysettings.set("scaleKey", newKey);
    }, []);

    const setScaleType = useCallback((newType: string) => {
        initSync().ysettings.set("scaleType", newType);
    }, []);

    return { scaleKey, scaleType, setScaleKey, setScaleType };
};
