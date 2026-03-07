import { SequenceMeta } from "@/lib/store";

type Props = {
    sequence: SequenceMeta;
    isActive: boolean;
    onClick: () => void;
    onDelete: () => void;
};

export default function SequenceCard({ sequence, isActive, onClick, onDelete }: Props) {
    const tracks = 4;
    const steps = 16;

    return (
        <div
            onClick={onClick}
            className={`relative group p-3 rounded-xl cursor-pointer border transition-all duration-200 select-none ${isActive
                    ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_16px_rgba(99,102,241,0.3)]"
                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600 hover:bg-zinc-800/60"
                }`}
        >
            {/* Mini grid preview */}
            <div className="flex flex-col gap-[3px] mb-2">
                {Array.from({ length: tracks }, (_, t) => (
                    <div key={t} className="flex gap-[2px]">
                        {Array.from({ length: steps }, (_, s) => {
                            const isOn = !!sequence.cells[`${t}-${s}`];
                            return (
                                <div
                                    key={s}
                                    className={`h-[6px] flex-1 rounded-[1px] transition-all ${isOn
                                            ? isActive
                                                ? "bg-indigo-400"
                                                : "bg-zinc-400"
                                            : "bg-zinc-700"
                                        }`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Name */}
            <p className={`text-[11px] font-semibold truncate ${isActive ? "text-indigo-300" : "text-zinc-400"}`}>
                {sequence.name}
            </p>

            {/* Delete button */}
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                title="Delete sequence"
            >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
}
