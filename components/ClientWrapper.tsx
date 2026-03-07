"use client";

import dynamic from "next/dynamic";
import { RoomProvider } from "@/liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";
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

    useEffect(() => {
        if (typeof window !== "undefined") {
            const hash = window.location.hash.substring(1);
            if (hash) {
                setRoomId(hash);
            } else {
                window.location.hash = "beatlab-mvp-liveblocks-v1";
            }
        }
    }, []);

    return (
        <RoomProvider id={roomId} initialPresence={{ cursor: null, activeSequenceId: null, user: null }}>
            <ClientSideSuspense fallback={
                <div className="flex flex-col space-y-4 min-h-screen items-center justify-center bg-zinc-950 text-white font-mono">
                    <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                    <p className="animate-pulse">Connecting to Liveblocks Serverless Cloud...</p>
                </div>
            }>
                <Playground />
            </ClientSideSuspense>
        </RoomProvider>
    );
}
