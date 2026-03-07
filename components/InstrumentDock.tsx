import { Dices, Trash2 } from "lucide-react";

export default function InstrumentDock({ onRandomize, onClear }: any) {
    const instruments = [
        { name: "Kick", desc: "CR78 Analog", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
        { name: "Snare", desc: "CR78 Analog", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
        { name: "HiHat", desc: "CR78 Analog", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
        { name: "Bass", desc: "Square Synth", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    ];

    return (
        <footer className="w-full bg-zinc-900 border-t border-zinc-800 p-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-40">
            <div className="flex max-w-7xl mx-auto flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex gap-3 w-full overflow-x-auto pb-2 sm:pb-0 hide-scrollbar pl-2">
                    {instruments.map((inst, i) => (
                        <div key={i} className={`flex-shrink-0 flex flex-col justify-center rounded-xl border px-4 py-2 min-w-[130px] shadow-sm transition-colors hover:bg-zinc-800 ${inst.color}`}>
                            <span className="text-sm font-bold tracking-wide">{inst.name}</span>
                            <span className="text-[10px] uppercase opacity-70 tracking-wider font-mono">{inst.desc}</span>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 w-full sm:w-auto px-2 sm:px-0">
                    <button
                        onClick={onRandomize}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        <Dices size={18} />
                        Randomize
                    </button>
                    <button
                        onClick={onClear}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-zinc-800 border border-zinc-700 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 px-5 py-2.5 text-sm font-bold transition-all active:scale-95"
                    >
                        <Trash2 size={18} />
                        Clear
                    </button>
                </div>
            </div>
        </footer>
    );
}
