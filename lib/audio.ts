import * as Tone from "tone";
import { PianoRollNote, TrackMode } from "./store";

let isInitialized = false;

export let kickPlayer: Tone.Player;
export let snarePlayer: Tone.Player;
export let hihatPlayer: Tone.Player;
export let bassSynth: Tone.Synth;

let masterBus: Tone.Gain;
let sequence: Tone.Sequence | null = null;

export const initAudio = async () => {
    if (isInitialized) return;
    await Tone.start();

    masterBus = new Tone.Gain(0.8).toDestination();

    kickPlayer = new Tone.Player("/sounds/kick.mp3").connect(masterBus);
    snarePlayer = new Tone.Player("/sounds/snare.mp3").connect(masterBus);
    hihatPlayer = new Tone.Player("/sounds/hihat.mp3").connect(masterBus);

    bassSynth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.2, release: 0.5 },
    }).connect(masterBus);

    await Tone.loaded();
    Tone.Transport.bpm.value = 120;
    isInitialized = true;
};

export const setBpm = (bpm: number) => { Tone.Transport.bpm.value = bpm; };
export const startTransport = () => { if (Tone.Transport.state !== "started") Tone.Transport.start(); };
export const stopTransport = () => { Tone.Transport.stop(); Tone.Transport.position = 0; };

// ─── Sequencer ─────────────────────────────────────────────────────────────────
// Now accepts refs to trackModes and pianoRolls so piano roll tracks are played correctly
export const setupSequencer = (
    gridStore: { current: boolean[][] },
    onStep: (step: number) => void,
    trackModesStore: { current: TrackMode[] },
    pianoRollsStore: { current: PianoRollNote[][] }
) => {
    if (sequence) sequence.dispose();

    const steps = Array.from({ length: 16 }, (_, i) => i);
    const stepDuration = Tone.Time("16n").toSeconds();

    sequence = new Tone.Sequence((time, stepIndex) => {
        const grid = gridStore.current;
        const modes = trackModesStore.current;
        const rolls = pianoRollsStore.current;

        // ── Track 0: Kick ──────────────────────────────────────────────────
        if (modes[0] === "grid") {
            if (grid[0][stepIndex] && kickPlayer?.loaded) kickPlayer.start(time);
        } else {
            const hits = (rolls[0] ?? []).filter(n => n.startStep === stepIndex);
            if (hits.length > 0 && kickPlayer?.loaded) kickPlayer.start(time);
        }

        // ── Track 1: Snare ─────────────────────────────────────────────────
        if (modes[1] === "grid") {
            if (grid[1][stepIndex] && snarePlayer?.loaded) snarePlayer.start(time);
        } else {
            const hits = (rolls[1] ?? []).filter(n => n.startStep === stepIndex);
            if (hits.length > 0 && snarePlayer?.loaded) snarePlayer.start(time);
        }

        // ── Track 2: HiHat ─────────────────────────────────────────────────
        if (modes[2] === "grid") {
            if (grid[2][stepIndex] && hihatPlayer?.loaded) hihatPlayer.start(time);
        } else {
            const hits = (rolls[2] ?? []).filter(n => n.startStep === stepIndex);
            if (hits.length > 0 && hihatPlayer?.loaded) hihatPlayer.start(time);
        }

        // ── Track 3: Bass (melodic) ─────────────────────────────────────────
        if (modes[3] === "grid") {
            if (grid[3][stepIndex]) bassSynth?.triggerAttackRelease("C2", "16n", time);
        } else {
            const notes = (rolls[3] ?? []).filter(n => n.startStep === stepIndex);
            notes.forEach(n => {
                const dur = stepDuration * n.durationSteps;
                bassSynth?.triggerAttackRelease(n.pitch, dur, time);
            });
        }

        Tone.Draw.schedule(() => { onStep(stepIndex); }, time);
    }, steps, "16n");

    sequence.start(0);
};
