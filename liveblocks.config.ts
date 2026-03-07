import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
    publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "pk_prod_F4z6dItP1Lwz-1d2Z5zL2s-y5v-z7Zz-z8-z-z8z-z",
});

type Presence = {
    cursor: { x: number; y: number } | null;
    activeSequenceId: string | null;
    user: {
        name: string;
        color: string;
        cell: { track: number; step: number } | null;
    } | null;
};

type Storage = {
    // We use Yjs for storage, so this can be empty
};

export const {
    RoomProvider,
    useRoom,
    useMyPresence,
    useUpdateMyPresence,
    useOthers,
    useSelf,
} = createRoomContext<Presence, Storage>(client);
