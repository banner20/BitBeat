"use client";

import { useState } from "react";
import PianoRoll from "./PianoRoll";
import { PianoRollNote, TrackMode } from "@/lib/store";

const TRACK_NAMES = ["Kick", "Snare", "HiHat", "Bass"];
const TRACK_COLORS = ["#ef4444", "#f59e0b", "#06b6d4", "#8b5cf6"];

type Props = {
    grid: boolean[][];
    currentStep: number;
    toggleCell: (track: number, step: number) => void;
    setHoveredCell: (track: number | null, step: number | null) => void;
    others: readonly any[];
    trackModes: TrackMode[];
    pianoRolls: PianoRollNote[][];
    onSetTrackMode: (track: number, mode: TrackMode) => void;
    onAddNote: (track: number, note: Omit<PianoRollNote, "id">) => void;
    onRemoveNote: (track: number, id: string) => void;
    onUpdateDuration: (track: number, id: string, dur: number) => void;
    onCopyPattern: (track: number) => void;
    onPastePattern: (track: number) => void;
    hasClipboard: boolean;
    onClearTrack: (track: number) => void;
};

export default function SequencerGrid({
    grid, currentStep, toggleCell, setHoveredCell, others,
    trackModes, pianoRolls, onSetTrackMode, onAddNote, onRemoveNote, onUpdateDuration,
    onCopyPattern, onPastePattern, hasClipboard, onClearTrack
}: Props) {
    const [openTrack, setOpenTrack] = useState<number | null>(null);

    const togglePianoRollPanel = (trackIndex: number) => {
        setOpenTrack(prev => prev === trackIndex ? null : trackIndex);
    };

    return (
        <div className="flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden w-full">
            {/* Beat grid rows */}
            <div className="flex flex-col p-4 pb-2 gap-1">
                {grid.map((track, trackIndex) => {
                    const color = TRACK_COLORS[trackIndex];
                    const mode = trackModes[trackIndex] ?? "grid";
                    const isPianoRoll = mode === "piano-roll";
                    const isOpen = openTrack === trackIndex;

                    return (
                        <div key={trackIndex} className="flex items-center gap-2 py-0.5">
                            {/* Left label area */}
                            <div className="flex items-center gap-1.5 w-32 shrink-0 justify-end">
                                {/* Clear Track Button */}
                                <button
                                    onClick={() => onClearTrack(trackIndex)}
                                    title="Clear Track"
                                    className="flex items-center justify-center w-5 h-5 text-zinc-600 hover:text-red-400 transition-colors"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18"></path>
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                    </svg>
                                </button>
                                {/* Piano icon toggle */}
                                <button
                                    onClick={() => {
                                        const next: TrackMode = isPianoRoll ? "grid" : "piano-roll";
                                        onSetTrackMode(trackIndex, next);
                                        if (next === "piano-roll") setOpenTrack(trackIndex);
                                        else if (openTrack === trackIndex) setOpenTrack(null);
                                    }}
                                    title={isPianoRoll ? "Switch to Grid" : "Switch to Piano Roll"}
                                    className="flex items-center justify-center w-6 h-6 rounded transition-all"
                                    style={isPianoRoll
                                        ? { backgroundColor: color + "33", color }
                                        : { color: "#52525b" }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <rect x="0.5" y="0.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1" />
                                        <line x1="3.5" y1="0.5" x2="3.5" y2="8" stroke="currentColor" strokeWidth="1" />
                                        <line x1="6.5" y1="0.5" x2="6.5" y2="8" stroke="currentColor" strokeWidth="1" />
                                        <line x1="9.5" y1="0.5" x2="9.5" y2="8" stroke="currentColor" strokeWidth="1" />
                                        <rect x="2" y="0.5" width="2" height="5" rx="0.5" fill="currentColor" opacity="0.7" />
                                        <rect x="5" y="0.5" width="2" height="5" rx="0.5" fill="currentColor" opacity="0.7" />
                                        <rect x="8" y="0.5" width="2" height="5" rx="0.5" fill="currentColor" opacity="0.7" />
                                    </svg>
                                </button>

                                {/* Expand/collapse arrow for piano roll panel */}
                                {isPianoRoll && (
                                    <button
                                        onClick={() => togglePianoRollPanel(trackIndex)}
                                        className="flex items-center justify-center w-4 h-4 text-zinc-500 hover:text-zinc-300"
                                    >
                                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                            <path
                                                d={isOpen ? "M1 6L4 2L7 6" : "M1 2L4 6L7 2"}
                                                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                                            />
                                        </svg>
                                    </button>
                                )}

                                <span
                                    className="text-[10px] font-black uppercase tracking-widest"
                                    style={{ color: isPianoRoll ? color : "#52525b" }}
                                >
                                    {TRACK_NAMES[trackIndex]}
                                </span>
                            </div>

                            {/* Step cells — dimmed in piano-roll mode */}
                            {!isPianoRoll && (
                                <div className="flex gap-1.5 bg-zinc-950 p-2 rounded-xl border border-zinc-800 shadow-inner">
                                    {track.map((isActive, stepIndex) => {
                                        const isPlaying = currentStep === stepIndex;
                                        const beatMarker = stepIndex % 4 === 0;
                                        const hoveringUser = others.find(({ presence }: any) =>
                                            presence?.user?.cell?.track === trackIndex && presence?.user?.cell?.step === stepIndex
                                        );
                                        const hoverColor = hoveringUser ? (hoveringUser as any).presence.user.color : null;

                                        const bgColor = isActive
                                            ? color
                                            : isPlaying
                                                ? "#3f3f46"
                                                : undefined;

                                        const shadow = isActive
                                            ? `0 0 8px ${color}60`
                                            : hoverColor && !isActive
                                                ? `0 0 0 2px ${hoverColor}`
                                                : undefined;

                                        return (
                                            <button
                                                key={stepIndex}
                                                onMouseEnter={() => setHoveredCell(trackIndex, stepIndex)}
                                                onMouseLeave={() => setHoveredCell(null, null)}
                                                onClick={() => toggleCell(trackIndex, stepIndex)}
                                                className={`h-7 w-5 sm:w-6 rounded-md transition-all duration-75 border ${isActive
                                                    ? "border-transparent"
                                                    : beatMarker
                                                        ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                                                        : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
                                                    } ${isPlaying && isActive ? "scale-110 brightness-125" : ""}`}
                                                style={{ backgroundColor: bgColor, boxShadow: shadow }}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {/* Piano roll ghost — shows note positions as dots in step cells */}
                            {isPianoRoll && (
                                <div
                                    className="flex gap-1.5 bg-zinc-950 p-2 rounded-xl border shadow-inner"
                                    style={{ borderColor: color + "40" }}
                                >
                                    {Array.from({ length: 16 }, (_, stepIndex) => {
                                        const hasNote = (pianoRolls[trackIndex] ?? []).some(n =>
                                            stepIndex >= n.startStep && stepIndex < n.startStep + n.durationSteps
                                        );
                                        const isPlaying = currentStep === stepIndex;
                                        return (
                                            <div
                                                key={stepIndex}
                                                className="h-7 w-5 sm:w-6 rounded-md border transition-all duration-75"
                                                style={{
                                                    borderColor: isPlaying ? "#71717a" : "#27272a",
                                                    backgroundColor: hasNote
                                                        ? color + "80"
                                                        : isPlaying ? "#3f3f46" : "#09090b",
                                                    boxShadow: hasNote ? `0 0 6px ${color}40` : undefined,
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Piano roll panel (slides open below rows) */}
            {openTrack !== null && (trackModes[openTrack] ?? "grid") === "piano-roll" && (
                <PianoRoll
                    trackIndex={openTrack}
                    trackName={TRACK_NAMES[openTrack]}
                    notes={pianoRolls[openTrack] ?? []}
                    onAddNote={(note) => onAddNote(openTrack, note)}
                    onRemoveNote={(id) => onRemoveNote(openTrack, id)}
                    onUpdateDuration={(id, dur) => onUpdateDuration(openTrack, id, dur)}
                    onCopy={() => onCopyPattern(openTrack)}
                    onPaste={() => onPastePattern(openTrack)}
                    hasClipboard={hasClipboard}
                />
            )}
        </div>
    );
}
