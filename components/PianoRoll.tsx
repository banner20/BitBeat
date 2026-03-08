"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { PianoRollNote } from "@/lib/store";
import { MousePointer2, Pencil } from "lucide-react";

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
    onUpdateNote: (id: string, updates: Partial<PianoRollNote>) => void;
    onCopy: () => void;
    onPaste: () => void;
    hasClipboard: boolean;
    stepCount: number;
};

export default function PianoRoll({ trackIndex, trackName, notes, stepCount, onAddNote, onRemoveNote, onUpdateDuration, onUpdateNote, onCopy, onPaste, hasClipboard }: Props) {
    const isDrum = trackIndex < 3;
    const pitches = isDrum ? DRUM_PITCHES : BASS_PITCHES;
    const color = TRACK_COLORS[trackIndex] ?? "#6366f1";

    const scrollRef = useRef<HTMLDivElement>(null);
    const draggingNote = useRef<{ id: string; startX: number; origDuration: number } | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const [tool, setTool] = useState<"pointer" | "pen">("pen");
    const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());

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

    // Handle delete key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === "Delete" || e.key === "Backspace") && selectedNoteIds.size > 0) {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
                selectedNoteIds.forEach(id => onRemoveNote(id));
                setSelectedNoteIds(new Set());
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedNoteIds, onRemoveNote]);

    // Look up a note at a given pitch+step
    const noteAt = useCallback((pitch: string, step: number) => {
        return notes.find(n => n.pitch === pitch && step >= n.startStep && step < n.startStep + n.durationSteps);
    }, [notes]);

    const handleCellMouseDown = (pitch: string, step: number) => {
        if (tool === "pen") {
            const existing = noteAt(pitch, step);
            if (existing) {
                if (existing.startStep === step) {
                    onRemoveNote(existing.id);
                }
            } else {
                onAddNote({ pitch, startStep: step, durationSteps: 1 });
            }
        } else {
            setSelectedNoteIds(new Set());
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

                <div className="flex items-center gap-1 ml-4 bg-zinc-950 p-1 rounded-md border border-zinc-800">
                    <button
                        onClick={() => setTool("pointer")}
                        className={`p-1 rounded ${tool === "pointer" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                        title="Pointer Tool (V)"
                    >
                        <MousePointer2 size={14} />
                    </button>
                    <button
                        onClick={() => setTool("pen")}
                        className={`p-1 rounded ${tool === "pen" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                        title="Pen Tool (B)"
                    >
                        <Pencil size={14} />
                    </button>
                </div>

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

                <span className="text-[10px] text-zinc-600 ml-auto hidden sm:block">
                    {tool === "pen" ? "click = add/remove · drag right edge = extend" : "click = select · drag = move · backspace = delete"}
                </span>
            </div>

            {/* Grid */}
            <div ref={scrollRef} className="flex overflow-y-auto overflow-x-auto relative" style={{ maxHeight: isDrum ? "56px" : "260px" }}>
                {/* Piano keys column */}
                <div className="flex flex-col shrink-0 border-r border-zinc-800 sticky left-0 z-20 bg-zinc-950" style={{ width: isDrum ? 56 : 48 }}>
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
                                className={`flex shrink-0 border-b ${isC ? "border-zinc-600" : "border-zinc-800/40"} relative`}
                                style={{ height: isDrum ? 32 : 20, minHeight: isDrum ? 32 : 20 }}
                            >
                                {/* Step column backgrounds */}
                                {Array.from({ length: stepCount }, (_, s) => {
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
                                        const isSelected = selectedNoteIds.has(note.id);
                                        return (
                                            <div
                                                key={note.id}
                                                className={`absolute top-0.5 rounded flex items-center justify-end overflow-hidden ${isSelected ? "ring-2 ring-white" : ""}`}
                                                style={{
                                                    left: left + 1,
                                                    width,
                                                    height: isDrum ? 28 : 17,
                                                    backgroundColor: color,
                                                    opacity: 0.9,
                                                    boxShadow: `0 0 6px ${color}55`,
                                                    zIndex: isSelected ? 20 : 10,
                                                    cursor: tool === "pointer" ? "grab" : "default"
                                                }}
                                                onMouseDown={(e) => {
                                                    // If clicking on the note block itself, prevent toggling off
                                                    e.stopPropagation();
                                                    if (tool === "pen") {
                                                        onRemoveNote(note.id);
                                                    } else {
                                                        const newSet = new Set(e.shiftKey ? selectedNoteIds : []);
                                                        if (newSet.has(note.id)) newSet.delete(note.id);
                                                        else newSet.add(note.id);
                                                        setSelectedNoteIds(newSet);

                                                        const startX = e.clientX;
                                                        const startY = e.clientY;
                                                        const startStep = note.startStep;
                                                        const startPitchIdx = pitches.indexOf(note.pitch);

                                                        const onMove = (ev: MouseEvent) => {
                                                            const deltaSteps = Math.round((ev.clientX - startX) / 28);
                                                            const deltaPitches = Math.round((ev.clientY - startY) / (isDrum ? 32 : 20));

                                                            let newStep = startStep + deltaSteps;
                                                            newStep = Math.max(0, Math.min(newStep, stepCount - note.durationSteps));

                                                            let newPitchIdx = startPitchIdx + deltaPitches;
                                                            newPitchIdx = Math.max(0, Math.min(newPitchIdx, pitches.length - 1));

                                                            onUpdateNote(note.id, { startStep: newStep, pitch: pitches[newPitchIdx] });
                                                        };

                                                        const onUp = () => {
                                                            window.removeEventListener("mousemove", onMove);
                                                            window.removeEventListener("mouseup", onUp);
                                                        };
                                                        window.addEventListener("mousemove", onMove);
                                                        window.addEventListener("mouseup", onUp);
                                                    }
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
