import { SequenceMeta } from "@/lib/store";
import SequenceCard from "./SequenceCard";

type Props = {
    sequences: SequenceMeta[];
    activeId: string;
    onSelect: (id: string) => void;
    onAdd: () => void;
    onDelete: (id: string) => void;
};

export default function Sidebar({ sequences, activeId, onSelect, onAdd, onDelete }: Props) {
    return (
        <aside className="flex flex-col w-[220px] shrink-0 h-full bg-zinc-950 border-r border-zinc-800 z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Sequences</span>
                <button
                    onClick={onAdd}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 px-2 py-1 rounded-md transition-all"
                    title="Add new sequence"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    New
                </button>
            </div>

            {/* Sequence List */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
                {sequences.length === 0 && (
                    <p className="text-[11px] text-zinc-600 text-center mt-6">No sequences yet.<br />Click "+ New" to create one.</p>
                )}
                {sequences.map((seq) => (
                    <SequenceCard
                        key={seq.id}
                        sequence={seq}
                        isActive={seq.id === activeId}
                        onClick={() => onSelect(seq.id)}
                        onDelete={() => onDelete(seq.id)}
                    />
                ))}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-3 border-t border-zinc-800">
                <p className="text-[10px] text-zinc-600 leading-relaxed">Click a sequence to edit it. Changes are live for all users.</p>
            </div>
        </aside>
    );
}
