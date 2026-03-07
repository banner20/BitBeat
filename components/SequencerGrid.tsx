export default function SequencerGrid({ grid, currentStep, toggleCell, setHoveredCell, others }: any) {
    const tracks = ["Kick", "Snare", "HiHat", "Bass"];

    return (
        <div className="flex flex-col gap-3 p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-x-auto w-full">
            {grid.map((track: boolean[], trackIndex: number) => (
                <div key={trackIndex} className="flex items-center gap-4 min-w-max">
                    <div className="w-16 sm:w-20 text-right text-xs sm:text-sm font-black text-zinc-500 uppercase tracking-widest shrink-0">
                        {tracks[trackIndex]}
                    </div>
                    <div className="flex gap-1.5 sm:gap-2 bg-zinc-950 p-2 sm:p-2.5 rounded-xl border border-zinc-800 shadow-inner">
                        {track.map((isActive: boolean, stepIndex: number) => {
                            const isPlaying = currentStep === stepIndex;

                            // Find if any other user is hovering this cell
                            const hoveringOthers = others.filter(({ presence }: any) =>
                                presence?.user?.cell?.track === trackIndex && presence?.user?.cell?.step === stepIndex
                            );

                            const hoverColor = hoveringOthers.length > 0 ? hoveringOthers[0].presence.user.color : null;

                            // Visual styling logic
                            const isBeatMarker = stepIndex % 4 === 0;
                            const baseBg = isActive ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : (isBeatMarker ? 'bg-zinc-700/80 hover:bg-zinc-600' : 'bg-zinc-800 hover:bg-zinc-700');
                            const playOverlay = isPlaying ? 'brightness-150 ring-2 ring-white/80 scale-105 z-10 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : '';

                            return (
                                <div
                                    key={stepIndex}
                                    className="relative group"
                                >
                                    <button
                                        onMouseEnter={() => setHoveredCell(trackIndex, stepIndex)}
                                        onMouseLeave={() => setHoveredCell(null, null)}
                                        onClick={() => toggleCell(trackIndex, stepIndex)}
                                        className={`h-12 w-10 sm:h-16 sm:w-14 rounded-lg transition-all duration-75 relative overflow-hidden ${baseBg} ${playOverlay}`}
                                        style={{
                                            boxShadow: hoverColor && !isActive ? `0 0 12px ${hoverColor}` : undefined,
                                            borderColor: hoverColor ? hoverColor : 'transparent',
                                            borderWidth: hoverColor ? '2px' : '0px'
                                        }}
                                    />
                                    {hoverColor && (
                                        <div
                                            className="absolute -top-3 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full pointer-events-none z-20 shadow-lg border-2 border-zinc-900 transition-all"
                                            style={{ backgroundColor: hoverColor }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
