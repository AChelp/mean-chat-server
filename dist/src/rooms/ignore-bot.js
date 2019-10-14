"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var User_1 = require("../models/User");
var ignoreBot = {
    name: 'Ignore bot',
    email: 'Ignore@Ignore.ignr',
    password: 'ignoreIGNORE1'
};
exports.setIgnoreBot = function () {
    User_1.User.find({ name: ignoreBot.name }, function (err, users) {
        if (users.length) {
            console.log('ignoreBot already exist');
            return;
        }
        else {
            var IgnoreBot = new User_1.User(ignoreBot);
            IgnoreBot.save(function (err) {
                if (err) {
                    console.log(JSON.stringify(err));
                }
                console.log('ignoreBot was created');
            });
        }
    });
};
