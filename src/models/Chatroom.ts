import * as mongoose from 'mongoose';
import * as moment from 'moment';

const MessageSchema = new mongoose.Schema({
  user: String,
  message: String,
  sendAt: String,
});

const ChatRoomSchema = new mongoose.Schema({
  name: String,
  messages: [MessageSchema],
  description: String,
});

export const ChatRoom = mongoose.model('ChatRooms', ChatRoomSchema);
