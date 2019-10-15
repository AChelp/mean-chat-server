"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var socket = require("socket.io");
var passport = require("passport");
var jwt = require("jsonwebtoken");
var socketioJWT = require("socketio-jwt");
var moment = require("moment");
// import * as multer from 'multer';
var fs = require("fs");
var Chatroom_1 = require("./src/models/Chatroom");
var User_1 = require("./src/models/User");
var database_1 = require("./src/config/database");
var validateNewUserData_1 = require("./src/helpers/validateNewUserData");
var passport_1 = require("./src/config/passport");
var general_1 = require("./src/rooms/general");
var reverse_bot_1 = require("./src/rooms/reverse-bot");
var echo_bot_1 = require("./src/rooms/echo-bot");
var ignore_bot_1 = require("./src/rooms/ignore-bot");
var spambot_1 = require("./src/rooms/spambot");
var spam_bot_data_1 = require("./src/spam-bot-data");
// passport settings
passport_1.passportConfig(passport);
// server settings
var port = process.env.PORT || 3000;
var app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(passport.initialize());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
// setting CORS headers
app.use(function (req, res, next) {
    res.append('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.append('Access-Control-Allow-Headers', 'Origin, Accept,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.append('Access-Control-Allow-Credentials', 'true');
    next();
});
// connecting to DB
mongoose.connect(database_1.dbConfig.database, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('connected to DB');
    general_1.setGeneral();
    reverse_bot_1.setReverseBot();
    echo_bot_1.setEchoBot();
    spambot_1.setSpamBot();
    ignore_bot_1.setIgnoreBot();
});
// file upload settings
// const savePath = 'uploads/';
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, savePath);
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.fieldname + '-' + moment())
//   }
// });
// let upload = multer({storage});
//
// app.use(multer({
//   dest: savePath,
//   rename: function (fieldname, filename) {
//     return filename + moment();
//   },
// }).any());
// starting server
var server = app.listen(port, function () {
    console.log("Server started on port " + port + "...");
});
// server variables
var spamMessagesTimeout;
var onlineUsers = ['General room', 'Reverse bot', 'Echo bot', 'Ignore bot', 'Spam bot'];
// sockets
var io = socket.listen(server);
io.sockets.on('connection', socketioJWT.authorize({
    secret: database_1.dbConfig.secret,
    timeout: 15000,
})).on('authenticated', function (socket) {
    socket.on('say hello', function (username) {
        socket.username = username;
        onlineUsers.push(username);
        socket.broadcast.emit('online users updated', onlineUsers);
    });
    socket.on('disconnect', function () {
        onlineUsers = onlineUsers.filter(function (username) { return username !== socket.username; });
        socket.broadcast.emit('online users updated', onlineUsers);
    });
    // join
    var prevRoom;
    socket.on('join', function (data) {
        socket.leave(data.prevRoom);
        socket.join(data.room);
        Chatroom_1.ChatRoom.find(function (err, rooms) {
            if (err) {
                console.log(err);
                return;
            }
            if (rooms.find(function (room) { return room.name === data.room; })) {
                io.sockets.emit('room ready', { isReady: true });
            }
            else {
                var newChatRoom = new Chatroom_1.ChatRoom({
                    name: data.room,
                    messages: [],
                });
                newChatRoom.save(function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    io.sockets.emit('room ready', { isReady: true });
                });
            }
        });
        // spam bot
        if (data.room.includes('Spambot')) {
            var room_1 = data.room;
            spamMessagesTimeout = setTimeout(function sendSpamMessage() {
                var delay = Math.round(3000 + Math.random() * (6000 - 1000));
                var newSpamFact = spam_bot_data_1.spamBotData[Math.round(Math.random() * spam_bot_data_1.spamBotData.length)];
                var newSpamMessage = {
                    user: 'Spam bot',
                    message: newSpamFact,
                    sendAt: moment().format('h:mm A'),
                };
                Chatroom_1.ChatRoom.updateOne({ name: room_1 }, { $push: { messages: newSpamMessage } }, function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                });
                io.in(room_1).emit('new message', newSpamMessage);
                spamMessagesTimeout = setTimeout(sendSpamMessage, delay);
            }, Math.round(3000 + Math.random() * (6000 - 1000)));
        }
        if (prevRoom && prevRoom.includes('Spambot')) {
            clearTimeout(spamMessagesTimeout);
        }
        prevRoom = data.room;
    });
    // message
    socket.on('message', function (data) {
        var newMessage = {
            user: data.user,
            message: data.message,
            sendAt: data.sendAt,
        };
        Chatroom_1.ChatRoom.updateOne({ name: data.room }, { $push: { messages: newMessage } }, function (err) {
            if (err) {
                console.log(err);
                return;
            }
        });
        io.in(data.room).emit('new message', newMessage);
        // reverse bot
        if (data.room.includes('Reverse')) {
            var room_2 = data.room;
            var newReverseMessage_1 = {
                user: 'Reverse bot',
                message: data.message.split('').reverse().join(''),
                sendAt: moment().format('h:mm A'),
            };
            setTimeout(function () {
                Chatroom_1.ChatRoom.updateOne({ name: room_2 }, { $push: { messages: newReverseMessage_1 } }, function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                });
                io.in(room_2).emit('new message', newReverseMessage_1);
            }, 3000);
        }
        else if (data.room.includes('Echo')) {
            // echo bot
            var room_3 = data.room;
            var newEchoMessage_1 = {
                user: 'Echo bot',
                message: data.message,
                sendAt: moment().format('h:mm A'),
            };
            setTimeout(function () {
                Chatroom_1.ChatRoom.updateOne({ name: room_3 }, { $push: { messages: newEchoMessage_1 } }, function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                });
                io.in(room_3).emit('new message', newEchoMessage_1);
            }, 500);
        }
    });
    // typing
    socket.on('typing', function (data) {
        socket.broadcast.in(data.roomName).emit('typing', {
            user: data.user,
        });
    });
    // read notification
    socket.on('seen', function (data) {
        socket.in(data.roomName).emit('seen', data);
    });
});
app.get('/', function (req, res) {
    res.send('Hey, there!');
});
// sign up
app.post('/signup', function (req, res) {
    var user = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        avatar: '',
    };
    if (!validateNewUserData_1.validateNewUserData(user)) {
        res.json({
            success: false,
            msg: 'Please, enter correct data.'
        });
    }
    else {
        console.log(user);
        // checking if user already exist
        User_1.User.find({ $or: [{ 'name': user.name }, { 'email': user.email }] }, function (err, users) {
            if (users.length) {
                return res.json({
                    success: false,
                    msg: 'User with this name or email already exist.'
                });
            }
            else {
                // saving avatar
                if (req.body.image) {
                    var data_url = req.body.image;
                    var matches = data_url.match(/^data:.+\/(.+);base64,(.*)$/);
                    var ext = matches[1];
                    var base64 = matches[2];
                    // @ts-ignore
                    var buffer = new Buffer.from(base64, 'base64');
                    var fileName = req.body.name.toLowerCase() + '.' + ext;
                    user.avatar = fileName;
                    fs.writeFile(__dirname + '/uploads/' + fileName, buffer, function (err) {
                        // res.send('success');
                        if (err) {
                            console.log(err);
                        }
                        else {
                            console.log('saved in ' + __dirname + '/uploads');
                        }
                    });
                }
                // saving user
                var newUser = new User_1.User(user);
                newUser.save(function (err) {
                    if (err) {
                        return res.json({
                            success: false,
                            msg: 'Sorry, try again.'
                        });
                    }
                    res.json({
                        success: true,
                        msg: 'Congratulations, You are in the club now.'
                    });
                });
            }
        });
    }
    // });
});
// login
app.post('/login', function (req, res) {
    User_1.User.findOne({
        email: req.body.email
    }, function (err, user) {
        if (err) {
            return res.send(err);
        }
        if (!user) {
            res.send({
                success: false,
                msg: 'User not found.'
            });
        }
        else {
            // check if password matches
            user.comparePassword(req.body.password, function (err, isMatch) {
                if (isMatch && !err) {
                    var token = jwt.sign(user.toJSON(), database_1.dbConfig.secret);
                    res.json({
                        success: true,
                        token: token,
                        username: user.name,
                        msg: "Hello, " + user.name + "!"
                    });
                }
                else {
                    res.json({
                        success: false,
                        msg: 'Authentication failed.'
                    });
                }
            });
        }
    });
});
// get users
app.get('/users', function (req, res) {
    User_1.User.find(function (err, users) {
        if (err) {
            console.log(err);
        }
        var usersList = {
            users: users,
            onlineUsers: onlineUsers
        };
        res.json(usersList);
    });
});
// get rooms
app.get('/chatrooms', function (req, res) {
    Chatroom_1.ChatRoom.find(function (err, rooms) {
        res.json(rooms);
    });
});
// get room messages
app.get('/chatroom/:room/:skipAmount', function (req, res) {
    var _a = req.params, room = _a.room, skipAmount = _a.skipAmount;
    Chatroom_1.ChatRoom.findOne({ name: room }, function (err, chatRoom) {
        if (err) {
            console.log(err);
            return;
        }
        // const sliceFrom =
        var messagesToSend = chatRoom.messages
            .slice(chatRoom.messages.length - skipAmount - 10, chatRoom.messages.length - skipAmount);
        res.json(messagesToSend);
    });
    console.log('throw more ten from ' + room + ' ' + skipAmount);
});
// get avatar
app.get('/uploads/:img', function (req, res) {
    res.sendFile(__dirname + '/uploads/' + req.params.img);
});
