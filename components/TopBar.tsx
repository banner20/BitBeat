import { Play, Square, Settings } from "lucide-react";

export default function TopBar({ isPlaying, togglePlay, bpm, setBpm, users, localColor, localName }: any) {
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
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
                {users.map((state: any, index: number) => {
                    if (!state.user || state.user.name === localName) return null;

                    return (
                        <div
                            key={index}
                            className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-zinc-900 shadow-sm transition-transform hover:scale-110 text-[10px] font-bold text-white cursor-help select-none"
                            style={{ backgroundColor: state.user.color }}
                            title={state.user.name}
                        >
                            {state.user.name.split(' ')[1]}
                        </div>
                    );
                })}
                <div
                    className="relative flex items-center justify-center h-8 w-8 rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-transform hover:scale-110 ml-2 text-[10px] font-bold text-white cursor-help select-none"
                    style={{ backgroundColor: localColor }}
                    title={`${localName || 'You'}`}
                >
                    {localName ? localName.split(' ')[1] : ''}
                </div>
            </div>
        </header>
    );
}
