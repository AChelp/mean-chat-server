"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var socket = require("socket.io");
var port = 3000;
var app = express();
app.use(bodyParser.json());
//starting server
var server = app.listen(port, function () {
    console.log("Server started on port " + port + "...");
});
//CORS headers
app.use(function (req, res, next) {
    res.append('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.append('Access-Control-Allow-Headers', 'Origin, Accept,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.append('Access-Control-Allow-Credentials', 'true');
    next();
});
//connection to DB
mongoose.connect('mongodb+srv://admin-Chelp:adminpass@chelpsdbs-1quvi.mongodb.net/mean-chat-DB?retryWrites=true&w=majority', { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('connected to DB');
});
//schemas
var messageSchema = new mongoose.Schema({
    user: String,
    message: String,
});
var userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
});
var chatRoomSchema = new mongoose.Schema({
    name: String,
    messages: [messageSchema],
    description: String,
});
//models
var User = mongoose.model('Users', userSchema);
var ChatRoom = mongoose.model('ChatRooms', chatRoomSchema);
var io = socket.listen(server);
io.sockets.on('connection', function (socket) {
    //join
    socket.on('join', function (data) {
        socket.join(data.room);
        ChatRoom.find(function (err, rooms) {
            if (err) {
                console.log(err);
                return;
            }
            // console.log(rooms)
            if (rooms.find(function (room) { return room.name === data.room; })) {
                io.sockets.emit('room ready', { isReady: true });
            }
            else {
                var newChatroom = new ChatRoom({
                    name: data.room,
                    messages: [],
                    description: data.description
                });
                newChatroom.save(function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                });
                io.sockets.emit('room ready', { isReady: true });
                console.log('new room created');
            }
        });
    });
    // message
    socket.on('message', function (data) {
        var newMessage = {
            user: data.user,
            message: data.message
        };
        io.in(data.room).emit('new message', newMessage);
        ChatRoom.updateOne({ name: data.room }, { $push: { messages: newMessage } }, function (err) {
            if (err) {
                console.log(err);
                return false;
            }
        });
    });
    // typing
    socket.on('typing', function (data) {
        socket.broadcast.in(data.room).emit('typing', {
            data: data,
            isTyping: true
        });
    });
});
app.get('/', function (req, res) {
    res.send('Welcome to chat...');
});
// registration
app.post('/api/users', function (req, res) {
    var user = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
    };
    User.find(function (err, users) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        if (!users.find(function (savedUser) { return savedUser.username === user.username; })) {
            var newUser = new User(user);
            newUser.save(function (err, User) {
                if (err) {
                    res.send(err);
                }
                res.json(User);
            });
        }
        else {
            res.json({ usernameIsBusy: true });
        }
    });
});
// login
app.post('/api/login', function (req, res) {
    var isPresent = false;
    var isCorrectPassword = false;
    var loggedInUser;
    User.find(function (err, users) {
        if (err) {
            return res.send(err);
        }
        var foundUser = users.find(function (user) { return user.username === req.body.username; });
        if (foundUser) {
            isPresent = true;
        }
        else {
            res.json({ wrongUsername: true });
            return;
        }
        if (foundUser.password === req.body.password) {
            isCorrectPassword = true;
            loggedInUser = foundUser;
        }
        res.json({ isPresent: isPresent, isCorrectPassword: isCorrectPassword, user: loggedInUser });
    });
});
// get user
app.get('/api/users', function (req, res) {
    User.find(function (err, users) {
        if (err) {
            console.log(err);
        }
        res.json(users);
    });
});
// get rooms
app.get('/chatrooms', function (req, res) {
    ChatRoom.find(function (err, rooms) {
        res.json(rooms);
    });
});
// get room messages
app.get('/chatroom/:room', function (req, res) {
    var room = req.params.room;
    ChatRoom.findOne({ name: room }, function (err, chatRoom) {
        if (err) {
            console.log(err);
            return;
        }
        // console.log(chatRoom);
        res.json(chatRoom.messages);
    });
});
