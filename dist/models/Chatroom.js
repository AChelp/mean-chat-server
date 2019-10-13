"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = require("mongoose");
var MessageSchema = new mongoose.Schema({
    user: String,
    message: String,
    sendAt: String,
});
var ChatRoomSchema = new mongoose.Schema({
    name: String,
    messages: [MessageSchema],
    description: String,
});
exports.ChatRoom = mongoose.model('ChatRooms', ChatRoomSchema);
