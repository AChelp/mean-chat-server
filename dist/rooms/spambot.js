"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var User_1 = require("../models/User");
var spamBot = {
    name: 'Spam bot',
    email: 'Spam@Spam.spm',
    password: 'spamSPAM1'
};
exports.setSpamBot = function () {
    User_1.User.find({ name: spamBot.name }, function (err, users) {
        if (users.length) {
            console.log('ReverseBot already exist');
            return;
        }
        else {
            var SpamBot = new User_1.User(spamBot);
            SpamBot.save(function (err) {
                if (err) {
                    console.log(JSON.stringify(err));
                }
                console.log('SpamBot was created');
            });
        }
    });
};
