"use client";

import { useEffect, useState, useCallback } from "react";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";

// ─── Types ────────────────────────────────────────────────────────────────────
export type SequenceMeta = {
    id: string;
    name: string;
    cells: Record<string, boolean>; // flat snapshot e.g. "0-3": true
    createdAt: number;
};

// ─── Yjs singletons ───────────────────────────────────────────────────────────
let ydoc: Y.Doc;
let provider: LiveblocksYjsProvider | null = null;

// Top-level shared types:
//   ysequences:     Y.Map<Y.Map<any>>  — id → { name, cells (Y.Map<boolean>), createdAt }
//   yactive:        Y.Map<string>      — key "id" → active sequence id
//   ysettings:      Y.Map<any>         — key "bpm"
let ysequences: Y.Map<Y.Map<any>>;
let yactive: Y.Map<string>;
let ysettings: Y.Map<any>;

const createEmptyGrid = () => Array.from({ length: 4 }, () => Array(16).fill(false));

function newSequenceId() {
    return `seq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
    return yseq;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
export const initSync = (room?: any) => {
    if (!ydoc) {
        ydoc = new Y.Doc();
        ysequences = ydoc.getMap<Y.Map<any>>("sequences");
        yactive = ydoc.getMap<string>("activeSequence"); // kept for legacy compat
        ysettings = ydoc.getMap<any>("settings");

        if (!ysettings.has("bpm")) ysettings.set("bpm", 120);

        // Bootstrap with a default sequence if none exists
        if (ysequences.size === 0) {
            const id = newSequenceId();
            ysequences.set(id, createYSequence("Beat 1"));
        }
    }

    if (!provider && room) {
        provider = new LiveblocksYjsProvider(room, ydoc);
    }

    return { ydoc, provider, ysequences, yactive, ysettings };
};

// ─── useSequences ──────────────────────────────────────────────────────────────
// Returns the synced list of all sequences + a LOCAL (per-device) active id
export const useSequences = () => {
    const [sequences, setSequences] = useState<SequenceMeta[]>([]);
    // activeId is LOCAL only — each device picks their own sequence to view
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        const { ysequences: ys } = initSync();

        const rebuild = () => {
            const list: SequenceMeta[] = [];
            ys.forEach((yseq, id) => {
                const ycells = yseq.get("cells") as Y.Map<boolean>;
                const cells: Record<string, boolean> = {};
                ycells?.forEach((v, k) => { if (v) cells[k] = v; });
                list.push({
                    id,
                    name: yseq.get("name") ?? "Untitled",
                    cells,
                    createdAt: yseq.get("createdAt") ?? 0,
                });
            });
            list.sort((a, b) => a.createdAt - b.createdAt);
            setSequences(prev => {
                // Auto-select the first sequence when sequences first arrive
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

    // selectSequence only changes the local device's view — not synced
    const selectSequence = useCallback((id: string) => {
        setActiveId(id);
    }, []);

    const addSequence = useCallback(() => {
        const { ydoc: doc, ysequences: ys } = initSync();
        const id = newSequenceId();
        doc.transact(() => {
            ys.set(id, createYSequence(`Beat ${ys.size + 1}`));
        });
        // Switch this device's view to the newly created sequence
        setActiveId(id);
    }, []);

    const deleteSequence = useCallback((id: string) => {
        const { ydoc: doc, ysequences: ys } = initSync();
        doc.transact(() => { ys.delete(id); });
        // If this device was viewing the deleted sequence, switch to the first remaining
        setActiveId(curr => {
            if (curr !== id) return curr;
            // Pick first sequence that isn't the deleted one
            const remaining = Array.from(ys.keys()).filter(k => k !== id);
            return remaining[0] ?? "";
        });
    }, []);

    return { sequences, activeId, selectSequence, addSequence, deleteSequence };
};

// ─── useActiveSequence ─────────────────────────────────────────────────────────
// Returns the currently active sequence's live grid + controls
export const useActiveSequence = () => {
    const [grid, setGrid] = useState<boolean[][]>(createEmptyGrid());
    const [name, setName] = useState<string>("");
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        const { ysequences: ys, yactive: ya } = initSync();
        let currentCellsObserver: (() => void) | null = null;

        const loadSequence = (id: string) => {
            // Unsubscribe from previous
            if (currentCellsObserver) { currentCellsObserver(); currentCellsObserver = null; }

            const yseq = ys.get(id);
            if (!yseq) return;

            const ycells = yseq.get("cells") as Y.Map<boolean>;
            setName(yseq.get("name") ?? "Untitled");

            const rebuildGrid = () => {
                const newGrid = createEmptyGrid();
                ycells?.forEach((v, key) => {
                    const parts = key.split("-");
                    if (parts.length === 2) {
                        const r = Number(parts[0]); const c = Number(parts[1]);
                        if (r >= 0 && r < 4 && c >= 0 && c < 16) newGrid[r][c] = v;
                    }
                });
                setGrid(newGrid.map(row => [...row]));
            };

            rebuildGrid();
            const seqObserver = () => {
                setName(yseq.get("name") ?? "Untitled");
                rebuildGrid();
            };
            yseq.observe(seqObserver);
            ycells?.observe(rebuildGrid);
            currentCellsObserver = () => {
                yseq.unobserve(seqObserver);
                ycells?.unobserve(rebuildGrid);
            };
        };

        const onActiveChange = () => {
            const id = ya.get("id") ?? "";
            setActiveId(id);
            if (id) loadSequence(id);
        };

        onActiveChange();
        ya.observe(onActiveChange);

        return () => {
            ya.unobserve(onActiveChange);
            if (currentCellsObserver) currentCellsObserver();
        };
    }, []);

    const toggleCell = useCallback((trackIndex: number, stepIndex: number) => {
        const { ysequences: ys, yactive: ya } = initSync();
        const id = ya.get("id");
        if (!id) return;
        const yseq = ys.get(id);
        if (!yseq) return;
        const ycells = yseq.get("cells") as Y.Map<boolean>;
        const key = `${trackIndex}-${stepIndex}`;
        ycells.set(key, !(ycells.get(key) ?? false));
    }, []);

    const setGridBulk = useCallback((newGrid: boolean[][]) => {
        const { ydoc: doc, ysequences: ys, yactive: ya } = initSync();
        const id = ya.get("id");
        if (!id) return;
        const yseq = ys.get(id);
        if (!yseq) return;
        const ycells = yseq.get("cells") as Y.Map<boolean>;
        doc.transact(() => {
            for (let t = 0; t < 4; t++) {
                for (let s = 0; s < 16; s++) {
                    ycells.set(`${t}-${s}`, newGrid[t][s]);
                }
            }
        });
    }, []);

    const clearGrid = useCallback(() => setGridBulk(createEmptyGrid()), [setGridBulk]);

    const renameSequence = useCallback((newName: string) => {
        const { ysequences: ys, yactive: ya } = initSync();
        const id = ya.get("id");
        if (!id) return;
        ys.get(id)?.set("name", newName);
    }, []);

    return { grid, name, activeId, toggleCell, setRandomGrid: setGridBulk, clearGrid, renameSequence };
};

// ─── useBpm ───────────────────────────────────────────────────────────────────
export const useBpm = () => {
    const [bpm, setBpmState] = useState<number>(120);

    useEffect(() => {
        const { ysettings: s } = initSync();
        setBpmState((s.get("bpm") as number) || 120);
        const obs = () => setBpmState(s.get("bpm") as number);
        s.observe(obs);
        return () => s.unobserve(obs);
    }, []);

    const setBpm = (newBpm: number) => { initSync().ysettings.set("bpm", newBpm); };
    return { bpm, setBpm };
};
