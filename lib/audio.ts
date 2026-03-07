import * as Tone from "tone";

let isInitialized = false;

// Instruments
export let kickPlayer: Tone.Player;
export let snarePlayer: Tone.Player;
export let hihatPlayer: Tone.Player;
export let bassSynth: Tone.Synth;

// Output node
let masterBus: Tone.Gain;
let sequence: Tone.Sequence | null = null;

export const initAudio = async () => {
    if (isInitialized) return;

    await Tone.start();

    masterBus = new Tone.Gain(0.8).toDestination();

    // Load samples
    kickPlayer = new Tone.Player("/sounds/kick.mp3").connect(masterBus);
    snarePlayer = new Tone.Player("/sounds/snare.mp3").connect(masterBus);
    hihatPlayer = new Tone.Player("/sounds/hihat.mp3").connect(masterBus);

    // Base synth
    bassSynth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: {
            attack: 0.05,
            decay: 0.2,
            sustain: 0.2,
            release: 0.5,
        },
    }).connect(masterBus);

    // Wait for all buffers to load
    await Tone.loaded();

    Tone.Transport.bpm.value = 120;
    isInitialized = true;
};

export const setBpm = (bpm: number) => {
    Tone.Transport.bpm.value = bpm;
};

export const startTransport = () => {
    if (Tone.Transport.state !== "started") {
        Tone.Transport.start();
    }
};

export const stopTransport = () => {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
};

// Start the looping sequence mapped to the state hook
export const setupSequencer = (
    gridStore: { current: boolean[][] },
    onStep: (step: number) => void
) => {
    if (sequence) {
        sequence.dispose();
    }

    const steps = Array.from({ length: 16 }, (_, i) => i);

    sequence = new Tone.Sequence((time, stepIndex) => {
        // array of arrays [track][step]
        const grid = gridStore.current;

        // trigger audio precisely at Tone time
        if (grid[0][stepIndex] && kickPlayer?.loaded) kickPlayer.start(time);
        if (grid[1][stepIndex] && snarePlayer?.loaded) snarePlayer.start(time);
        if (grid[2][stepIndex] && hihatPlayer?.loaded) hihatPlayer.start(time);
        if (grid[3][stepIndex]) bassSynth?.triggerAttackRelease("C2", "16n", time);

        // Also update UI for the current step
        // Using Tone.Draw to safely sync Tone's audio thread with React render cycle
        Tone.Draw.schedule(() => {
            onStep(stepIndex);
        }, time);

    }, steps, "16n");

    sequence.start(0);
};
