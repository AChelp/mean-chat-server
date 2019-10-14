"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var User_1 = require("../models/User");
var reverseBot = {
    name: 'Reverse bot',
    email: 'Reverse@Reverse.rvrs',
    password: 'reverseREVERSE1'
};
exports.setReverseBot = function () {
    User_1.User.find({ name: reverseBot.name }, function (err, users) {
        if (users.length) {
            console.log('ReverseBot already exist');
            return;
        }
        else {
            var ReverseBot = new User_1.User(reverseBot);
            ReverseBot.save(function (err) {
                if (err) {
                    console.log(JSON.stringify(err));
                }
                console.log('ReverseBot was created');
            });
        }
    });
};
