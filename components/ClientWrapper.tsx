"use client";

import dynamic from "next/dynamic";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { useEffect, useState } from "react";

const Playground = dynamic(() => import("@/components/Playground"), {
    ssr: false,
    loading: () => (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white font-mono">
            Loading BeatLab Multi-player Engine...
        </div>
    )
});

export default function ClientWrapper() {
    const [roomId, setRoomId] = useState("beatlab-mvp-liveblocks-v1");
    // Default to the dummy key so it builds, but intercept it to show a helpful message
    const apiKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "pk_prod_F4z6dItP1Lwz-1d2Z5zL2s-y5v-z7Zz-z8-z-z8z-z";
    const isMissingKey = apiKey === "pk_prod_F4z6dItP1Lwz-1d2Z5zL2s-y5v-z7Zz-z8-z-z8z-z";

    useEffect(() => {
        // Simple hash routing for shareable links
        if (typeof window !== "undefined") {
            const hash = window.location.hash.substring(1);
            if (hash) {
                setRoomId(hash);
            } else {
                window.location.hash = roomId;
            }
        }
    }, [roomId]);

    if (isMissingKey) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-950 text-white font-mono p-8 text-center max-w-2xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-red-500">Liveblocks Connection Refused</h1>
                <p className="text-lg text-zinc-300">
                    The dummy API key was rejected by the Liveblocks server. To make your multiplayer app work in production, you must provide your own free API key!
                </p>
                <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl text-left w-full space-y-4 shadow-xl">
                    <h2 className="text-xl font-semibold mb-2">How to fix this instantly:</h2>
                    <ol className="list-decimal list-inside space-y-3 text-zinc-400">
                        <li>Go to <a href="https://liveblocks.io" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">liveblocks.io</a> and sign up for a free account.</li>
                        <li>Create a new project and navigate to the <strong>API Keys</strong> tab.</li>
                        <li>Copy your <strong>Public Key</strong> (it starts with <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">pk_</code>).</li>
                        <li>Go to your <strong>Vercel Dashboard</strong> &rarr; Project Settings &rarr; Environment Variables.</li>
                        <li>Add a new variable named <code className="bg-zinc-800 px-1 py-0.5 rounded text-white font-bold select-all">NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY</code> and paste your key.</li>
                        <li><strong>Redeploy</strong> your Vercel project to apply the new key!</li>
                    </ol>
                </div>
            </div>
        );
    }

    return (
        <LiveblocksProvider publicApiKey={apiKey}>
            <RoomProvider id={roomId}>
                <ClientSideSuspense fallback={
                    <div className="flex flex-col space-y-4 min-h-screen items-center justify-center bg-zinc-950 text-white font-mono">
                        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                        <p className="animate-pulse">Connecting to Liveblocks Serverless Cloud...</p>
                    </div>
                }>
                    <Playground />
                </ClientSideSuspense>
            </RoomProvider>
        </LiveblocksProvider>
    );
}
