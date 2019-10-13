import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import * as socket from 'socket.io';
import * as passport from 'passport';
import * as jwt from 'jsonwebtoken'
import * as socketioJWT from 'socketio-jwt';
import * as moment from 'moment';
import { ChatRoom } from './models/Chatroom';
import { User } from './models/User';
import { dbConfig } from './config/database';
import { validateNewUserData } from './helpers/validateNewUserData';
import { passportConfig } from './config/passport';
import { setGeneral } from './rooms/general';
import { setReverseBot } from './rooms/reverse-bot';
import { setEchoBot } from './rooms/echo-bot';
import { setIgnoreBot } from './rooms/ignore-bot';
import { setSpamBot } from './rooms/spambot';
import { spamBotData } from './spam-bot-data';
import { longReporter } from 'gulp-typescript/release/reporter';

passportConfig(passport);

const port = 3000;

const app = express();
app.use(bodyParser.json());
app.use(passport.initialize());

// starting server
const server = app.listen(port, () => {
  console.log(`Server started on port ${port}...`);
});

// setting CORS headers
app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Origin, Accept,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.append('Access-Control-Allow-Credentials', 'true');
  next();
});

// connecting to DB
mongoose.connect(
  dbConfig.database,
  { useNewUrlParser: true, useUnifiedTopology: true }
);
// mongoose.connect(
//   'mongodb://localhost:27017/mean-chat-DB',
//   { useNewUrlParser: true, useUnifiedTopology: true }
// );
// mongoose.set('useCreateIndex', true);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('connected to DB');
  setGeneral();
  setReverseBot();
  setEchoBot();
  setSpamBot();
  setIgnoreBot();
});

let spamMessagesTimeout;

// sockets
const io = socket.listen(server);

io.sockets.on('connection', socketioJWT.authorize({
  secret: dbConfig.secret,
  timeout: 15000,
})).on('authenticated', socket => {
  console.log('user connected');

  // join
  let prevRoom;

  socket.on('join', data => {

    socket.leave(data.prevRoom);
    // console.log(data.prevRoom + ' was leaved');
    socket.join(data.room);
    console.log('user joins to ' + data.room);

    ChatRoom.find((err, rooms) => {
      if (err) {
        console.log(err);
        return;
      }
      if (rooms.find(room => room.name === data.room)) {
        io.sockets.emit('room ready', { isReady: true });
      } else {
        let newChatRoom = new ChatRoom({
          name: data.room,
          messages: [],
        });
        newChatRoom.save(err => {
          if (err) {
            console.log(err);
            return;
          }
          io.sockets.emit('room ready', { isReady: true });
          console.log('new room created')
        });
      }
    });

    // spam bot

    if (data.room.includes('Spambot')) {
      let room = data.room;
      spamMessagesTimeout = setTimeout(function sendSpamMessage () {
        let delay = Math.round(3000 + Math.random() * (6000 - 1000));

        let newSpamFact = spamBotData[Math.round(Math.random() * spamBotData.length)];

        let newSpamMessage = {
          user: 'Spam bot',
          message: newSpamFact,
          sendAt: moment().format('h:mm A'),
        };

        ChatRoom.updateOne({ name: room }, { $push: { messages: newSpamMessage } },
          (err) => {
            if (err) {
              console.log(err);
              return;
            }
          });

        io.in(room).emit('new message', newSpamMessage);
        spamMessagesTimeout = setTimeout(sendSpamMessage, delay);
      }, Math.round(3000 + Math.random() * (6000 - 1000)))
    }

    if (prevRoom && prevRoom.includes('Spambot')) {
        clearTimeout(spamMessagesTimeout);
    }

    prevRoom = data.room;
  });

  // message
  socket.on('message', data => {

    let newMessage = {
      user: data.user,
      message: data.message,
      sendAt: data.sendAt,
    };

    ChatRoom.updateOne({ name: data.room }, { $push: { messages: newMessage } },
      (err) => {
        if (err) {
          console.log(err);
          return;
        }

        console.log('message saved in ' + data.room)
      });

    io.in(data.room).emit('new message', newMessage);

    // reverse bot

    if (data.room.includes('Reverse')) {
      console.log('reverse');
      let room = data.room;
      let newReverseMessage = {
        user: 'Reverse bot',
        message: data.message.split('').reverse().join(''),
        sendAt: moment().format('h:mm A'),

      };

      setTimeout(() => {
        ChatRoom.updateOne({ name: room }, { $push: { messages: newReverseMessage } },
          (err) => {
            if (err) {
              console.log(err);
              return;
            }
          });
        io.in(room).emit('new message', newReverseMessage);
      }, 3500);

      // echo bot
    } else if (data.room.includes('Echo')) {
      console.log('echo');
      let room = data.room;

      let newEchoMessage = {
        user: 'Echo bot',
        message: data.message,
        sendAt: moment().format('h:mm A'),

      };

      setTimeout(() => {
        ChatRoom.updateOne({ name: room }, { $push: { messages: newEchoMessage } },
          (err) => {
            if (err) {
              console.log(err);
              return;
            }
          });

        io.in(room).emit('new message', newEchoMessage);
      }, 500)

    }
  });

  // typing
  // socket.on('typing', data => {
  //   socket.broadcast.in(data.room).emit('typing', {
  //     data: data,
  //     isTyping: true
  //   });
  // });
});

app.get('/', (req, res) => {
  res.send('Hey, there!');
});

// sign up
app.post('/signup', (req, res) => {
  const user = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  };

  if (!validateNewUserData(user)) {
    res.json({
      success: false,
      msg: 'Please, enter correct data.'
    });
  } else {

    // checking if user already exist

    User.find(
      { $or: [{ 'name': user.name }, { 'email': user.email }] },
      (err, users) => {
        if (users.length) {
          return res.json({
            success: false,
            msg: 'User with this name or email already exist.'
          })
        } else {

          // saving user

          const newUser = new User(user);

          newUser.save(err => {
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
      }
    )
  }
});

// login
app.post('/login', function (req, res) {
  User.findOne({
    email: req.body.email
  }, function (err, user) {
    if (err) {
      return res.send(err)
    }

    if (!user) {
      res.send({
        success: false,
        msg: 'User not found.'
      });
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          const token = jwt.sign(user.toJSON(), dbConfig.secret);
          res.json({
            success: true,
            token: token,
            username: user.name,
            msg: `Hello, ${user.name}!`
          });
        } else {
          res.json({
            success: false,
            msg: 'Authentication failed.'
          });
        }
      });
    }
  });
});

// get user
app.get('/users', (req, res) => {
  User.find((err, users) => {
    if (err) {
      console.log(err);
    }
    res.json(users);
  })
});

// get rooms
app.get('/chatrooms', (req, res) => {
  ChatRoom.find((err, rooms) => {
    res.json(rooms)
  })
});

// get room messages
app.get('/chatroom/:room', (req, res) => {
  let room = req.params.room;

  ChatRoom.findOne({ name: room }, (err, chatRoom) => {
    if (err) {
      console.log(err);
      return;
    }
    res.json(chatRoom.messages);
  })
});
