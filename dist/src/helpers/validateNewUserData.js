"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var namePattern = /^([^-\s][a-zA-Zа-яёА-ЯЁ ]{2,15})$/;
var emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var passwordPattern = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])([a-zA-Z0-9]{8,})$/;
exports.validateNewUserData = function (_a) {
    var name = _a.name, email = _a.email, password = _a.password;
    return namePattern.test(name)
        && emailPattern.test(email)
        && passwordPattern.test(password);
};
