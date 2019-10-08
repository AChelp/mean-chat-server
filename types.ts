export type MessageType = {
    id: string;
    fromId: string;
    body: string;
    roomId: string;
    isRead: boolean;
    sendAt: string;
}

export type UserType = {
    id: string;
    name: string;
    email: string;
}

export type ChatRoomType = {
    id: string;
    name: string;
    description: string;
}
