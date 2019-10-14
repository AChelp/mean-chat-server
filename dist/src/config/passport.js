"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var passport_jwt_1 = require("passport-jwt");
var User_1 = require("../models/User");
var database_1 = require("./database");
exports.passportConfig = function (passport) {
    var opts = {
        jwtFromRequest: undefined,
        secretOrKey: undefined
    };
    opts.jwtFromRequest = passport_jwt_1.ExtractJwt.fromAuthHeaderWithScheme('jwt');
    opts.secretOrKey = database_1.dbConfig.secret;
    passport.use(new passport_jwt_1.Strategy(opts, function (jwt_payload, done) {
        User_1.User.findOne({ id: jwt_payload.id }, function (err, user) {
            if (err) {
                return done(err, false);
            }
            if (user) {
                done(null, user);
            }
            else {
                done(null, false);
            }
        });
    }));
};
