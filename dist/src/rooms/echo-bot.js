"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var User_1 = require("../models/User");
var echoBot = {
    name: 'Echo bot',
    email: 'Echo@Echo.ech',
    password: 'echoECHO1',
    description: 'Want to talk with Echo bot? Want to talk with Echo bot? Want to talk with Echo bot?',
    avatar: 'echobot.jpg'
};
exports.setEchoBot = function () {
    User_1.User.find({ name: echoBot.name }, function (err, users) {
        if (users.length) {
            console.log('echoBot already exist');
            return;
        }
        else {
            var EchoBot = new User_1.User(echoBot);
            EchoBot.save(function (err) {
                if (err) {
                    console.log(JSON.stringify(err));
                }
                console.log('echoBot was created');
            });
        }
    });
};
