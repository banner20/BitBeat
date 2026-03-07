"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";

// Yjs specific definitions for Liveblocks
import { LiveblocksYjsProvider } from "@liveblocks/yjs";

const createEmptyGrid = () => Array.from({ length: 4 }, () => Array(16).fill(false));

let ydoc: Y.Doc;
let ygridCells: Y.Map<boolean>;
let ybpm: Y.Map<any>;
let provider: LiveblocksYjsProvider | null = null;

// The provider is now passed in from the component level since it requires the Liveblocks Room context
export const initSync = (room?: any) => {
    if (!ydoc) {
        ydoc = new Y.Doc();
        ygridCells = ydoc.getMap<boolean>("gridCells");
        ybpm = ydoc.getMap("settings");

        if (!ybpm.has("bpm")) {
            ybpm.set("bpm", 120);
        }
    }

    if (!provider && room) {
        provider = new LiveblocksYjsProvider(room, ydoc);
    }

    return { ydoc, provider, ygridCells, ybpm };
};

export const useGrid = () => {
    const [grid, setGrid] = useState<boolean[][]>(createEmptyGrid());

    useEffect(() => {
        const { ygridCells: activeGridCells } = initSync();

        const updateGrid = () => {
            const newGrid = createEmptyGrid();
            activeGridCells.forEach((value, key) => {
                const parts = key.split("-");
                if (parts.length === 2) {
                    const r = Number(parts[0]);
                    const c = Number(parts[1]);
                    if (r >= 0 && r < 4 && c >= 0 && c < 16) {
                        newGrid[r][c] = value;
                    }
                }
            });
            // Force React to recognize the nested array update by spreading
            setGrid(newGrid.map(row => [...row]));
        };

        updateGrid();
        activeGridCells.observe(updateGrid);

        return () => {
            activeGridCells.unobserve(updateGrid);
        };
    }, []);

    const toggleCell = (trackIndex: number, stepIndex: number) => {
        const { ygridCells: activeGridCells } = initSync();
        const key = `${trackIndex}-${stepIndex}`;
        const currentValue = activeGridCells.get(key) || false;
        activeGridCells.set(key, !currentValue);
    };

    const setRandomGrid = (newGrid: boolean[][]) => {
        const { ydoc: activeDoc, ygridCells: activeGridCells } = initSync();
        activeDoc.transact(() => {
            for (let t = 0; t < 4; t++) {
                for (let s = 0; s < 16; s++) {
                    const key = `${t}-${s}`;
                    if (activeGridCells.get(key) !== newGrid[t][s]) {
                        activeGridCells.set(key, newGrid[t][s]);
                    }
                }
            }
        });
    }

    const clearGrid = () => setRandomGrid(createEmptyGrid());

    return { grid, toggleCell, setRandomGrid, clearGrid };
};

export const useBpm = () => {
    // Cannot access ybpm synchronously at module load anymore
    const [bpm, setBpmState] = useState<number>(120);

    useEffect(() => {
        const { ybpm: activeBpm } = initSync();
        setBpmState((activeBpm.get("bpm") as number) || 120);

        const observer = () => {
            setBpmState(activeBpm.get("bpm") as number);
        };
        activeBpm.observe(observer);
        return () => {
            activeBpm.unobserve(observer);
        };
    }, []);

    const setBpm = (newBpm: number) => {
        const { ybpm: activeBpm } = initSync();
        activeBpm.set("bpm", newBpm);
    };

    return { bpm, setBpm };
};


