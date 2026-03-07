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

    useEffect(() => {
        // Simple hash routing for shareable links
        if (window.location.hash) {
            setRoomId(window.location.hash.substring(1));
        } else {
            window.location.hash = roomId;
        }
    }, [roomId]);

    return (
        <LiveblocksProvider publicApiKey="pk_prod_F4z6dItP1Lwz-1d2Z5zL2s-y5v-z7Zz-z8-z-z8z-z">
            <RoomProvider id={roomId}>
                <ClientSideSuspense fallback={
                    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white font-mono">
                        Connecting to Sync Server...
                    </div>
                }>
                    <Playground />
                </ClientSideSuspense>
            </RoomProvider>
        </LiveblocksProvider>
    );
}
