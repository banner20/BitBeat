"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { initAudio, startTransport, stopTransport, setBpm, setupSequencer } from "@/lib/audio";
import { useActiveSequence, useSequences, useBpm, initSync } from "@/lib/store";
import * as Tone from "tone";
import TopBar from "./TopBar";
import SequencerGrid from "./SequencerGrid";
import InstrumentDock from "./InstrumentDock";
import Sidebar from "./Sidebar";
import { useRoom, useMyPresence, useUpdateMyPresence, useOthers } from "@/liveblocks.config";

export default function Playground() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [syncInitialized, setSyncInitialized] = useState(false);

    const { bpm, setBpm: updateGlobalBpm } = useBpm();
    const { sequences, activeId, selectSequence, addSequence, deleteSequence } = useSequences();
    const { grid, name, toggleCell, setRandomGrid, clearGrid, renameSequence } = useActiveSequence(activeId);

    const [myPresence, updateMyPresence] = useMyPresence();
    const others = useOthers();
    const room = useRoom();

    // Initialize presence
    useEffect(() => {
        const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
        const myColor = colors[Math.floor(Math.random() * colors.length)];
        const myName = `User ${Math.floor(Math.random() * 1000)}`;
        updateMyPresence({ user: { name: myName, color: myColor, cell: null } });
    }, []);

    // Grid ref for Tone.js sequencer
    const gridRef = useRef(grid);
    useEffect(() => { gridRef.current = grid; }, [grid]);

    // Initialize Yjs with Liveblocks room
    useEffect(() => {
        initSync(room);
        setSyncInitialized(true);
    }, [room]);

    // Setup the Tone.js sequencer engine
    useEffect(() => {
        if (!syncInitialized) return;
        setupSequencer(gridRef, (step) => setCurrentStep(step));
    }, [syncInitialized]);

    useEffect(() => { setBpm(bpm); }, [bpm]);

    const togglePlay = async () => {
        await initAudio();
        if (!isPlaying) {
            if (Tone.context.state !== "running") await Tone.context.resume();
            startTransport();
            setIsPlaying(true);
        } else {
            stopTransport();
            setIsPlaying(false);
            setCurrentStep(0);
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        updateMyPresence({ cursor: { x: e.clientX, y: e.clientY } });
    };

    const setHoveredCell = useCallback((track: number | null, step: number | null) => {
        updateMyPresence({
            user: {
                ...myPresence.user!,
                cell: track !== null && step !== null ? { track, step } : null
            }
        });
    }, [myPresence.user]);

    return (
        <div
            className="flex h-screen w-full bg-zinc-950 text-white font-sans overflow-hidden relative"
            onPointerMove={handlePointerMove}
        >
            {/* Remote user cursors */}
            {others.map(({ connectionId, presence }) => {
                if (!presence?.cursor || !presence?.user) return null;
                const { x, y } = presence.cursor;
                return (
                    <div
                        key={connectionId}
                        className="pointer-events-none fixed z-[100] flex flex-col items-start top-0 left-0"
                        style={{ transform: `translate(${x}px, ${y}px)`, transition: "transform 0.05s linear" }}
                    >
                        <svg width="18" height="24" viewBox="0 0 16 23" fill="none" className="drop-shadow-md" style={{ transformOrigin: "top left", transform: "rotate(-20deg)" }}>
                            <path d="M1.38531 1.70183L13.8853 14.2018C14.4988 14.8153 14.0645 15.8631 13.1969 15.8631H8.5V20.5C8.5 21.3284 7.82843 22 7 22H5.5C4.67157 22 4 21.3284 4 20.5V15.8631H0.966952C0.091395 15.8631 -0.347575 14.8023 0.274391 14.1804L1.38531 1.70183Z" fill={presence.user.color} stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                        <div className="px-2 py-1 rounded-md text-[10px] font-bold shadow-md ml-3 mt-1 whitespace-nowrap" style={{ backgroundColor: presence.user.color, color: "#fff" }}>
                            {presence.user.name}
                        </div>
                    </div>
                );
            })}

            {/* Sidebar */}
            <Sidebar
                sequences={sequences}
                activeId={activeId}
                onSelect={selectSequence}
                onAdd={addSequence}
                onDelete={deleteSequence}
            />

            {/* Main content area */}
            <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
                <TopBar
                    isPlaying={isPlaying}
                    togglePlay={togglePlay}
                    bpm={bpm}
                    setBpm={updateGlobalBpm}
                    others={others}
                    myPresence={myPresence}
                    sequenceName={name}
                    onRename={renameSequence}
                />
                <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-auto">
                    <SequencerGrid
                        grid={grid}
                        currentStep={currentStep}
                        toggleCell={toggleCell}
                        setHoveredCell={setHoveredCell}
                        others={others}
                    />
                </div>
                <InstrumentDock
                    onRandomize={() => {
                        const newGrid = Array.from({ length: 4 }, (_, t) => {
                            const probs = [0.4, 0.2, 0.7, 0.3];
                            return Array.from({ length: 16 }, () => Math.random() < probs[t]);
                        });
                        setRandomGrid(newGrid);
                    }}
                    onClear={clearGrid}
                />
            </div>
        </div>
    );
}
