import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import * as socket from 'socket.io';
// import { ChatRoomType, MessageType, UserType } from './types';

const port = 3000;

const app = express();
app.use(bodyParser.json());

//starting server
const server = app.listen(port, () => {
  console.log(`Server started on port ${port}...`);
});

//CORS headers
app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Origin, Accept,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.append('Access-Control-Allow-Credentials', 'true');
  next();
});

//connection to DB
mongoose.connect(
  'mongodb+srv://admin-Chelp:adminpass@chelpsdbs-1quvi.mongodb.net/admin?retryWrites=true&w=majority/mean-chat-DB',
  { useNewUrlParser: true }
);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('connected to DB');
});

//schemas
const messageSchema = new mongoose.Schema({
  id: String,
  fromId: String,
  body: String,
  roomId: String,
  isRead: Boolean,
  sendAt: String,
});

const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  password: String,
});

const chatroomSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  messages: [messageSchema],
});

//models
const Messages = mongoose.model('Messages', messageSchema);
const Users = mongoose.model('Users', userSchema);
const Chatrooms = mongoose.model('Chatrooms', chatroomSchema);

const io = socket.listen(server);

io.sockets.on('connection', socket => {
  //join
  socket.on('join', data => {
    socket.join(data.room);
    Chatrooms.find((err, rooms) => {
      if (err) {
        console.log(err);
        return false;
      }

      if (!rooms.find(room => room.name === data.room)) {
        Chatrooms.insert({
          name: data.room,
          messages: [],
          description: data.description
        });
      }
    });
  });

  //message
  socket.on('message', data => {
    io.in(data.room).emit('new message', {
      user: data.user,
      message: data.message
    });
    Chatrooms.update({ name: data.room }, {
        $push: {
          messages: {
            user: data.user,
            message: data.message
          }
        }
      },
      (err, res) => {
        if (err) {
          console.log(err);
          return false;
        }
      });
  });

  //Typing
  socket.on('typing', data => {
    socket.broadcast.in(data.room).emit('typing', {
      data: data,
      isTyping: true
    });
  });
});

app.get('/', (req, res, next) => {
  res.send('Welcome to chat...');
});

//registration
app.post('/api/users', (req, res, next) => {
  let user = {
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
  };

  Users.find((err, users) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }

    if (!users.find(savedUser => savedUser.name === user.name)) {
      Users.insert(user, (err, User) => {
        if (err) {
          res.send(err);
        }
        res.json(User);
      });
    } else {
      res.json({ usernameIsBusy: true });
    }
  });
});

//log in
app.post('/api/login', (req, res) => {
  let isPresent = false;
  let isCorrectPassword = false;
  let loggedInUser;

  Users.find((err, users) => {
    if (err) {
      return res.send(err);
    }

    let foundUser = users.find(user => user.name === req.body.name);

    if (foundUser) {
      isPresent = true
    }

    if (foundUser.password === req.body.password) {
      isCorrectPassword = true;
      loggedInUser = foundUser;
    }

    res.json({ isPresent, isCorrectPassword, user: loggedInUser });
  })
});

//getting all users
app.get('/chatroom/:room', (req, res, next) => {
  let room = req.params.room;
  Chatrooms.find({ name: room }, (err, chatroom) => {
    if (err) {
      console.log(err);
      return;
    }

    res.json(chatroom.messages[0])
  })
});


