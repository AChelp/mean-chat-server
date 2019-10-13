"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var User_1 = require("../models/User");
var general = {
    name: 'General room',
    email: 'general@general.gnrl',
    password: 'generalGENERAL1'
};
exports.setGeneral = function () {
    console.log('seting general');
    User_1.User.find({ name: general.name }, function (err, users) {
        if (users.length) {
            console.log('general already exist');
            return;
        }
        else {
            var General = new User_1.User(general);
            General.save(function (err) {
                if (err) {
                    console.log(JSON.stringify(err));
                }
                console.log('General was created');
            });
        }
    });
};
