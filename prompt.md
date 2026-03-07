# Project: BeatLab — Multiplayer Browser Music Sandbox

## Overview

BeatLab is a real-time collaborative music playground where multiple users create beats together in a shared sequencer.

The experience should feel like **Figma for beats**: users see each other's edits live and can collaboratively build a loop.

The initial MVP should focus on:

* instant interaction
* multiplayer collaboration
* simple music creation
* minimal friction

This is **not a full DAW**. It is a lightweight, playful, social music tool.

The MVP should run as a **web application first**, with future compatibility for embedding inside Discord Activities.

---

# Goals

Primary goals:

1. Multiple users can edit the same beat in real time
2. Users hear synchronized audio playback
3. Interface is simple enough to understand within seconds
4. System performs smoothly in browser

Non-goals (for MVP):

* advanced DAW features
* automation lanes
* complex mixing
* exporting stems
* plugin systems

---

# Core Concept

Users collaborate on a shared beat loop.

The beat consists of a **grid sequencer** where:

* tracks represent instruments
* columns represent steps
* active cells trigger sounds

Example grid:

Kick   ■ □ ■ □ ■ □ ■ □
Snare  □ □ ■ □ □ □ ■ □
Hat    ■ ■ ■ ■ ■ ■ ■ ■
Bass   ■ □ □ ■ □ □ ■ □

Playback loops continuously.

---

# MVP Features

## 1. Shared Sequencer Grid

Grid properties:

* 4 tracks
* 16 steps per track
* looped playback
* step toggling

Tracks:

1. Kick
2. Snare
3. HiHat
4. Bass

Users can toggle cells on/off.

All users see updates instantly.

---

## 2. Playback Engine

Use Tone.js for audio scheduling.

Requirements:

* consistent loop timing
* quantized playback
* BPM control

Default BPM: 120

Controls:

* Play
* Stop
* BPM input

Playback should remain synchronized across users.

---

## 3. Multiplayer Collaboration

Multiple users editing the same session.

Requirements:

* real-time updates
* cursor/indicator showing which user is editing
* conflict-free editing

Example:

Alex editing Kick
Maya editing Snare
You editing Bass

Use CRDT-based sync.

Recommended library:

* Y.js

Transport layer options:

* WebRTC
* WebSocket

---

## 4. Instrument Dock

At the bottom of the interface.

Displays available instruments as cards:

[ Drum Machine ]
[ Bass Synth ]
[ Sampler ]
[ Random Beat ]

Clicking a card adds the instrument to the timeline.

For MVP the instruments map to the existing tracks.

---

## 5. Drum Machine

Sample-based triggers.

Sounds required:

* kick.wav
* snare.wav
* hihat.wav

Samples should load locally.

---

## 6. Bass Synth

Simple synthesized bass.

Parameters:

* waveform (sine / square / saw)
* octave

Triggered by sequencer steps.

---

## 7. Random Beat Generator

Button generates a random pattern.

Rules:

* keep musical probability
* avoid completely chaotic beats

Example probabilities:
kick: 40%
snare: 20%
hihat: 70%

---

# UI Layout

Top Bar:

* Play
* Stop
* BPM

Main Area:
Sequencer Grid

Bottom Area:
Instrument Dock

Example structure:

HEADER
Transport Controls

TIMELINE
Step Sequencer Grid

FOOTER
Instrument Dock

UI should be minimal and readable.

---

# Multiplayer UX

Each user should have:

* a color
* avatar indicator

When editing:

* highlight cell with user color

Example:

Alex toggled step
Cell briefly flashes blue.

---

# Technology Stack

Framework:
Next.js (React + TypeScript)

UI:
TailwindCSS

Audio:
Tone.js

Realtime:
Y.js

Hosting:
Vercel

---

# Architecture

Client-only MVP preferred.

Components:

Audio Engine
Sequencer State
Realtime Sync Layer
UI Components

State flow:

User Interaction
→ Update CRDT state
→ Broadcast to peers
→ Update sequencer
→ Trigger audio engine

---

# Performance Requirements

* low audio latency
* smooth UI updates
* support at least 5 simultaneous users

---

# Future Features (Not for MVP)

* Discord Activity integration
* Beat battle mode
* additional instruments
* sample packs
* timeline view
* recording

---

# Design Principles

1. Instant interaction
2. Social collaboration
3. Minimal complexity
4. Musical but playful

The product should feel closer to a **music toy or creative playground** than a professional DAW.

---

# Deliverables

Working web app that allows:

* shared beat creation
* synchronized playback
* multiplayer editing
* simple instruments
