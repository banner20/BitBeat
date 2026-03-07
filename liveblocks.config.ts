import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
    publicApiKey: "pk_prod_F4z6dItP1Lwz-1d2Z5zL2s-y5v-z7Zz-z8-z-z8z-z", // A dummy public key, usually you'd get this from liveblocks dashboard
});

export const {
    RoomProvider,
    useRoom,
    useMyPresence,
    useUpdateMyPresence,
    useOthers,
} = createRoomContext(client);
