import { Play, Square, Settings } from "lucide-react";
import { useState } from "react";

export default function TopBar({ isPlaying, togglePlay, bpm, setBpm, others, myPresence, sequenceName, onRename, onDoublePattern }: any) {
    const localUser = myPresence?.user;
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(sequenceName ?? "");

    // Keep input in sync when active sequence changes
    if (!editingName && nameInput !== sequenceName) {
        setNameInput(sequenceName ?? "");
    }

    const commitRename = () => {
        if (nameInput.trim()) onRename(nameInput.trim());
        setEditingName(false);
    };

    return (
        <header className="flex h-[64px] w-full items-center gap-3 bg-zinc-900 border-b border-zinc-800 px-4 shrink-0 shadow-sm z-50">
            {/* Logo */}
            <h1 className="text-xl font-black italic tracking-tighter text-white shrink-0">BeatLab</h1>

            {/* Sequence name editor */}
            <div className="flex items-center gap-1 mr-2">
                {editingName ? (
                    <input
                        autoFocus
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditingName(false); }}
                        className="bg-zinc-800 border border-indigo-500 rounded px-2 py-1 text-sm text-white font-semibold outline-none w-32"
                    />
                ) : (
                    <button
                        onClick={() => setEditingName(true)}
                        className="text-sm font-semibold text-zinc-300 hover:text-white truncate max-w-[120px] hover:bg-zinc-800 px-2 py-1 rounded transition-colors"
                        title="Click to rename"
                    >
                        {sequenceName || "Untitled"}
                    </button>
                )}
                <svg
                    onClick={() => setEditingName(true)}
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="text-zinc-600 hover:text-zinc-300 cursor-pointer shrink-0"
                >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-zinc-700 shrink-0" />

            {/* Transport controls */}
            <button
                onClick={togglePlay}
                className={`flex h-9 w-24 items-center justify-center gap-2 rounded-lg font-bold text-sm transition-all shrink-0 ${isPlaying
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                    }`}
            >
                {isPlaying ? <><Square size={14} fill="currentColor" /> Stop</> : <><Play size={14} fill="currentColor" /> Play</>}
            </button>

            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm shadow-inner">
                <Settings size={13} className="text-zinc-400" />
                <input
                    type="number"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-11 bg-transparent text-white font-mono text-center outline-none text-sm"
                    min={40}
                    max={240}
                />
                <span className="text-zinc-500 text-xs font-medium tracking-wide">BPM</span>
            </div>

            <button
                onClick={onDoublePattern}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-bold transition-all shrink-0 uppercase tracking-widest"
                title="Double pattern length (x2)"
            >
                Double length (x2)
            </button>

            {/* Invite */}
            <button
                onClick={() => {
                    if (typeof window !== "undefined") {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Session link copied! Share it to collaborate in real-time.");
                    }
                }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/50 text-indigo-300 text-xs font-semibold transition-all shrink-0"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Invite
            </button>

            {/* Avatars */}
            <div className="flex items-center gap-1.5 ml-auto shrink-0">
                {others.map(({ connectionId, presence }: any) => {
                    if (!presence?.user) return null;
                    return (
                        <div
                            key={connectionId}
                            className="flex items-center justify-center h-7 w-7 rounded-full border-2 border-zinc-900 shadow-sm transition-transform hover:scale-110 text-[9px] font-bold text-white cursor-help select-none"
                            style={{ backgroundColor: presence.user.color }}
                            title={presence.user.name}
                        >
                            {presence.user.name.split(" ")[1]}
                        </div>
                    );
                })}
                {localUser && (
                    <div
                        className="flex items-center justify-center h-7 w-7 rounded-full border-2 border-white shadow-[0_0_8px_rgba(255,255,255,0.3)] ml-1 text-[9px] font-bold text-white cursor-help select-none"
                        style={{ backgroundColor: localUser.color }}
                        title={`${localUser.name} (You)`}
                    >
                        {localUser.name.split(" ")[1]}
                    </div>
                )}
            </div>
        </header>
    );
}
