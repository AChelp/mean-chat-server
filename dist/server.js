"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var socket = require("socket.io");
// import { ChatRoomType, MessageType, UserType } from './types';
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
mongoose.connect('mongodb+srv://admin-Chelp:adminpass@chelpsdbs-1quvi.mongodb.net/admin?retryWrites=true&w=majority/mean-chat-DB', { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('connected to DB');
});
//schemas
var messageSchema = new mongoose.Schema({
    id: String,
    fromId: String,
    body: String,
    roomId: String,
    isRead: Boolean,
    sendAt: String,
});
var userSchema = new mongoose.Schema({
    id: String,
    name: String,
    email: String,
    password: String,
});
var chatroomSchema = new mongoose.Schema({
    id: String,
    name: String,
    description: String,
    messages: [messageSchema],
});
//models
var Messages = mongoose.model('Messages', messageSchema);
var Users = mongoose.model('Users', userSchema);
var Chatrooms = mongoose.model('Chatrooms', chatroomSchema);
var io = socket.listen(server);
io.sockets.on('connection', function (socket) {
    //join
    socket.on('join', function (data) {
        socket.join(data.room);
        Chatrooms.find(function (err, rooms) {
            if (err) {
                console.log(err);
                return false;
            }
            if (!rooms.find(function (room) { return room.name === data.room; })) {
                Chatrooms.insert({
                    name: data.room,
                    messages: [],
                    description: data.description
                });
            }
        });
    });
    //message
    socket.on('message', function (data) {
        io.in(data.room).emit('new message', {
            user: data.user,
            message: data.message
        });
        Chatrooms.update({ name: data.room }, {
            $push: {
                messages: {
                    user: data.user,
                    message: data.message
                }
            }
        }, function (err, res) {
            if (err) {
                console.log(err);
                return false;
            }
        });
    });
    //Typing
    socket.on('typing', function (data) {
        socket.broadcast.in(data.room).emit('typing', { data: data, isTyping: true });
    });
});
app.get('/', function (req, res, next) {
    res.send('Welcome to chat...');
});
//registration
app.post('/api/users', function (req, res, next) {
    var user = {
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
    };
    Users.find(function (err, users) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        if (!users.find(function (savedUser) { return savedUser.name === user.name; })) {
            Users.insert(user, function (err, User) {
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
//log in
app.post('/api/login', function (req, res) {
    var isPresent = false;
    var isCorrectPassword = false;
    var loggedInUser;
});
