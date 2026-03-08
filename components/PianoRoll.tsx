"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { PianoRollNote } from "@/lib/store";

// ─── Pitch definitions ────────────────────────────────────────────────────────
const BASS_PITCHES = [
    "B5", "A#5", "A5", "G#5", "G5", "F#5", "F5", "E5", "D#5", "D5", "C#5", "C5",
    "B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4", "D#4", "D4", "C#4", "C4",
    "B3", "A#3", "A3", "G#3", "G3", "F#3", "F3", "E3", "D#3", "D3", "C#3", "C3",
    "B2", "A#2", "A2", "G#2", "G2", "F#2", "F2", "E2", "D#2", "D2", "C#2", "C2",
    "B1", "A#1", "A1", "G#1", "G1", "F#1", "F1", "E1", "D#1", "D1", "C#1", "C1",
];

const BLACK_NOTES = new Set(["A#", "C#", "D#", "F#", "G#"]);
function isBlack(pitch: string) { return BLACK_NOTES.has(pitch.slice(0, -1)); }
function noteName(pitch: string) { return pitch.slice(0, -1); }
function octave(pitch: string) { return pitch.slice(-1); }

const DRUM_PITCHES = ["Hit"];
const STEPS = 16;

// ─── Track config ─────────────────────────────────────────────────────────────
const TRACK_COLORS: Record<number, string> = {
    0: "#ef4444", // Kick - red
    1: "#f59e0b", // Snare - amber
    2: "#06b6d4", // HiHat - cyan
    3: "#8b5cf6", // Bass - purple
};

type Props = {
    trackIndex: number;
    trackName: string;
    notes: PianoRollNote[];
    onAddNote: (note: Omit<PianoRollNote, "id">) => void;
    onRemoveNote: (id: string) => void;
    onUpdateDuration: (id: string, durationSteps: number) => void;
    onCopy: () => void;
    onPaste: () => void;
    hasClipboard: boolean;
};

export default function PianoRoll({ trackIndex, trackName, notes, onAddNote, onRemoveNote, onUpdateDuration, onCopy, onPaste, hasClipboard }: Props) {
    const isDrum = trackIndex < 3;
    const pitches = isDrum ? DRUM_PITCHES : BASS_PITCHES;
    const color = TRACK_COLORS[trackIndex] ?? "#6366f1";

    const scrollRef = useRef<HTMLDivElement>(null);
    const draggingNote = useRef<{ id: string; startX: number; origDuration: number } | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    // Auto-scroll to C3 on mount
    useEffect(() => {
        if (!isDrum && scrollRef.current) {
            const c3Index = pitches.indexOf("C3");
            if (c3Index !== -1) {
                const rowHeight = 20;
                scrollRef.current.scrollTop = (c3Index * rowHeight) - (220 / 2) + (rowHeight / 2);
            }
        }
    }, [isDrum, pitches]);

    // Look up a note at a given pitch+step
    const noteAt = useCallback((pitch: string, step: number) => {
        return notes.find(n => n.pitch === pitch && step >= n.startStep && step < n.startStep + n.durationSteps);
    }, [notes]);

    const handleCellMouseDown = (pitch: string, step: number) => {
        const existing = noteAt(pitch, step);
        if (existing) {
            if (existing.startStep === step) {
                onRemoveNote(existing.id);
            }
        } else {
            onAddNote({ pitch, startStep: step, durationSteps: 1 });
        }
    };

    const handleDragStart = (e: React.MouseEvent, note: PianoRollNote) => {
        e.stopPropagation();
        draggingNote.current = { id: note.id, startX: e.clientX, origDuration: note.durationSteps };
        setDraggingId(note.id);

        const onMove = (ev: MouseEvent) => {
            if (!draggingNote.current) return;
            const cellWidth = 28;
            const delta = Math.round((ev.clientX - draggingNote.current.startX) / cellWidth);
            const newDur = Math.max(1, draggingNote.current.origDuration + delta);
            onUpdateDuration(draggingNote.current.id, newDur);
        };
        const onUp = () => {
            draggingNote.current = null;
            setDraggingId(null);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    return (
        <div className="flex flex-col border-t border-zinc-700 bg-zinc-950 select-none overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{trackName} — Piano Roll</span>

                <div className="flex items-center gap-1 ml-4 border-l border-zinc-700 pl-4">
                    <button
                        onClick={onCopy}
                        className="text-[10px] uppercase font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded transition-colors"
                    >
                        Copy
                    </button>
                    <button
                        onClick={onPaste}
                        disabled={!hasClipboard}
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded transition-colors ${hasClipboard ? "text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700" : "text-zinc-600 bg-zinc-900 cursor-not-allowed"
                            }`}
                    >
                        Paste
                    </button>
                </div>

                <span className="text-[10px] text-zinc-600 ml-auto hidden sm:block">click = add/remove · drag right edge = extend</span>
            </div>

            {/* Grid */}
            <div ref={scrollRef} className="flex overflow-y-auto overflow-x-auto relative" style={{ maxHeight: isDrum ? "56px" : "220px" }}>
                {/* Piano keys column */}
                <div className="flex flex-col shrink-0 border-r border-zinc-800 sticky left-0 z-20" style={{ width: isDrum ? 56 : 48 }}>
                    {pitches.map(pitch => {
                        const black = isDrum ? false : isBlack(pitch);
                        const name = isDrum ? pitch : noteName(pitch);
                        const oct = isDrum ? "" : octave(pitch);
                        return (
                            <div
                                key={pitch}
                                className={`flex items-center justify-end pr-1 text-[9px] font-bold shrink-0 border-b border-zinc-800/40 ${black ? "bg-zinc-800 text-zinc-500" : "bg-zinc-900 text-zinc-500"
                                    } ${name === "C" ? "border-b border-zinc-600 text-zinc-300" : ""}`}
                                style={{ height: isDrum ? 32 : 20 }}
                            >
                                {name === "C" || isDrum ? <span>{name}{oct}</span> : null}
                            </div>
                        );
                    })}
                </div>

                {/* Note grid */}
                <div className="flex flex-col flex-1 min-w-max">
                    {pitches.map(pitch => {
                        const black = isDrum ? false : isBlack(pitch);
                        const isC = !isDrum && noteName(pitch) === "C";
                        return (
                            <div
                                key={pitch}
                                className={`flex border-b ${isC ? "border-zinc-600" : "border-zinc-800/40"} relative`}
                                style={{ height: isDrum ? 32 : 20 }}
                            >
                                {/* Step column backgrounds */}
                                {Array.from({ length: STEPS }, (_, s) => {
                                    const beatMarker = s % 4 === 0;
                                    return (
                                        <div
                                            key={s}
                                            onMouseDown={() => handleCellMouseDown(pitch, s)}
                                            className={`shrink-0 border-r cursor-pointer transition-colors ${beatMarker ? "border-zinc-600" : "border-zinc-800/30"
                                                } ${black ? "bg-zinc-900/80 hover:bg-zinc-700/60" : "bg-zinc-950 hover:bg-zinc-800/60"
                                                }`}
                                            style={{ width: 28 }}
                                        />
                                    );
                                })}

                                {/* Render notes as colored blocks on top */}
                                {notes
                                    .filter(n => n.pitch === pitch)
                                    .map(note => {
                                        const left = note.startStep * 28;
                                        const width = note.durationSteps * 28 - 2;
                                        return (
                                            <div
                                                key={note.id}
                                                className="absolute top-0.5 rounded flex items-center justify-end overflow-hidden"
                                                style={{
                                                    left: left + 1,
                                                    width,
                                                    height: isDrum ? 28 : 17,
                                                    backgroundColor: color,
                                                    opacity: 0.9,
                                                    boxShadow: `0 0 6px ${color}55`,
                                                    zIndex: 10,
                                                }}
                                                onMouseDown={(e) => {
                                                    // If clicking on the note block itself, prevent toggling off
                                                    e.stopPropagation();
                                                    // Clicking the note body removes it
                                                    onRemoveNote(note.id);
                                                }}
                                            >
                                                {/* Drag handle on right edge */}
                                                <div
                                                    className="h-full flex items-center justify-center cursor-ew-resize shrink-0 hover:bg-white/20 rounded-r"
                                                    style={{ width: 8 }}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        handleDragStart(e, note);
                                                    }}
                                                >
                                                    <div className="w-[2px] h-3 bg-white/50 rounded" />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
