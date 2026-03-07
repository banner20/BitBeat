import { Play, Square, Settings } from "lucide-react";

export default function TopBar({ isPlaying, togglePlay, bpm, setBpm, others, myPresence }: any) {
    const localUser = myPresence?.user;

    return (
        <header className="flex h-[72px] w-full items-center justify-between bg-zinc-900 border-b border-zinc-800 px-6 shrink-0 shadow-sm z-50">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-black italic tracking-tighter text-white mr-4">BeatLab</h1>
                <button
                    onClick={togglePlay}
                    className={`flex h-10 w-28 items-center justify-center gap-2 rounded-lg font-bold transition-all ${isPlaying ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "bg-emerald-500 hover:bg-emerald-600 text-white"
                        }`}
                >
                    {isPlaying ? <><Square size={16} fill="currentColor" /> Stop</> : <><Play size={16} fill="currentColor" /> Play</>}
                </button>
                <div className="hidden sm:flex items-center gap-2 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm shadow-inner">
                    <Settings size={14} className="text-zinc-400" />
                    <input
                        type="number"
                        value={bpm}
                        onChange={(e) => setBpm(Number(e.target.value))}
                        className="w-12 bg-transparent text-white font-mono text-center outline-none"
                        min={40}
                        max={240}
                    />
                    <span className="text-zinc-500 font-medium tracking-wide">BPM</span>
                </div>

                <button
                    onClick={() => {
                        if (typeof window !== "undefined") {
                            navigator.clipboard.writeText(window.location.href);
                            alert("Session link copied to clipboard! Send it to a friend to collaborate in real-time.");
                        }
                    }}
                    className="hidden sm:flex items-center gap-2 ml-4 px-3 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/50 text-indigo-300 text-sm font-semibold transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)] hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    Invite Friends
                </button>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
                {others.map(({ connectionId, presence }: any) => {
                    if (!presence?.user) return null;

                    return (
                        <div
                            key={connectionId}
                            className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-zinc-900 shadow-sm transition-transform hover:scale-110 text-[10px] font-bold text-white cursor-help select-none"
                            style={{ backgroundColor: presence.user.color }}
                            title={presence.user.name}
                        >
                            {presence.user.name.split(' ')[1]}
                        </div>
                    );
                })}
                {localUser && (
                    <div
                        className="relative flex items-center justify-center h-8 w-8 rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-transform hover:scale-110 ml-2 text-[10px] font-bold text-white cursor-help select-none"
                        style={{ backgroundColor: localUser.color }}
                        title={`${localUser.name} (You)`}
                    >
                        {localUser.name.split(' ')[1]}
                    </div>
                )}
            </div>
        </header>
    );
}
