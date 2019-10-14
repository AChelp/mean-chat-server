import { Strategy, ExtractJwt } from 'passport-jwt'
import { User } from '../models/User';
import { dbConfig } from './database'

export const passportConfig = passport => {
  const opts: { jwtFromRequest: any, secretOrKey: any, } = {
    jwtFromRequest: undefined,
    secretOrKey: undefined
  };
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
  opts.secretOrKey = dbConfig.secret;
  passport.use(new Strategy(opts, function (jwt_payload, done) {
    User.findOne({ id: jwt_payload.id }, function (err, user) {
      if (err) {
        return done(err, false);
      }
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    });
  }));
};
