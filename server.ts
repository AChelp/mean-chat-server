import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import * as socket from 'socket.io';
import * as passport from 'passport';
import * as jwt from 'jsonwebtoken'
import * as socketioJWT from 'socketio-jwt';
import * as moment from 'moment';
// import * as multer from 'multer';
import * as fs from 'fs';
import { ChatRoom } from './src/models/Chatroom';
import { User } from './src/models/User';
import { dbConfig } from './src/config/database';
import { validateNewUserData } from './src/helpers/validateNewUserData';
import { passportConfig } from './src/config/passport';
import { setGeneral } from './src/rooms/general';
import { setReverseBot } from './src/rooms/reverse-bot';
import { setEchoBot } from './src/rooms/echo-bot';
import { setIgnoreBot } from './src/rooms/ignore-bot';
import { setSpamBot } from './src/rooms/spambot';
import { spamBotData } from './src/spam-bot-data';

// passport settings
passportConfig(passport);

// server settings
const port = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(passport.initialize());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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

const server = app.listen(port, () => {
  console.log(`Server started on port ${port}...`);
});

// server variables

let spamMessagesTimeout;
let onlineUsers = ['General room', 'Reverse bot', 'Echo bot', 'Ignore bot', 'Spam bot'];

// sockets
const io = socket.listen(server);

io.sockets.on('connection', socketioJWT.authorize({
  secret: dbConfig.secret,
  timeout: 15000,
})).on('authenticated', socket => {

  socket.on('say hello', username => {
    socket.username = username;
    onlineUsers.push(username);
    socket.broadcast.emit('online users updated', onlineUsers);
  });

  socket.on('disconnect', () => {
    onlineUsers = onlineUsers.filter(username => username !== socket.username);
    socket.broadcast.emit('online users updated', onlineUsers);
  });

  // join
  let prevRoom;

  socket.on('join', data => {
    socket.leave(data.prevRoom);
    socket.join(data.room);

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
        });
      }
    });

    // spam bot

    if (data.room.includes('Spambot')) {
      let room = data.room;
      spamMessagesTimeout = setTimeout(function sendSpamMessage() {
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
      });

    io.in(data.room).emit('new message', newMessage);

    // reverse bot

    if (data.room.includes('Reverse')) {
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
      }, 3000);
    } else if (data.room.includes('Echo')) {

      // echo bot

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

  socket.on('typing', data => {
    socket.broadcast.in(data.roomName).emit('typing', {
      user: data.user,
    });
  });

  // read notification

  socket.on('seen', data => {
    socket.in(data.roomName).emit('seen', data);
  });
});

app.get('/', (req, res) => {
  res.send('Hey, there!');
});

// sign up

app.post('/signup', (req, res) => {

  const user = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    avatar: '',
  };

  if (!validateNewUserData(user)) {
    res.json({
      success: false,
      msg: 'Please, enter correct data.'
    });
  } else {
    console.log(user);

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

          // saving avatar
          if (req.body.image) {
            const data_url = req.body.image;
            const matches = data_url.match(/^data:.+\/(.+);base64,(.*)$/);
            const ext = matches[1];
            const base64 = matches[2];
            // @ts-ignore
            const buffer = new Buffer.from(base64, 'base64');

            const fileName = req.body.name.toLowerCase() + '.' + ext;
            user.avatar = fileName;

            fs.writeFile(__dirname + '/uploads/' + fileName, buffer, function (err) {
              // res.send('success');
              if (err) {
                console.log(err)
              } else {

                console.log('saved in ' + __dirname + '/uploads')
              }
            });
          }


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
  // });
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

// get users

app.get('/users', (req, res) => {
  User.find((err, users) => {
    if (err) {
      console.log(err);
    }

    let usersList = {
      users,
      onlineUsers
    };

    res.json(usersList);
  })
});

// get rooms

app.get('/chatrooms', (req, res) => {
  ChatRoom.find((err, rooms) => {
    res.json(rooms)
  })
});

// get room messages

app.get('/chatroom/:room/:skipAmount', (req, res) => {
  const { room, skipAmount } = req.params;

  ChatRoom.findOne({ name: room }, (err, chatRoom) => {
    if (err) {
      console.log(err);
      return;
    }

    // const sliceFrom =

    const messagesToSend =
      chatRoom.messages
        .slice(
          chatRoom.messages.length - skipAmount - 10,
          chatRoom.messages.length - skipAmount
        );
    res.json(messagesToSend);
  });

  console.log('throw more ten from ' + room + ' ' + skipAmount)
});

// get avatar

app.get('/uploads/:img', (req, res) => {
  res.sendFile(__dirname + '/uploads/' + req.params.img)
});
