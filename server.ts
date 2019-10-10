import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import * as socket from 'socket.io';

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
  'mongodb+srv://admin-Chelp:adminpass@chelpsdbs-1quvi.mongodb.net/mean-chat-DB?retryWrites=true&w=majority',
  { useNewUrlParser: true }
);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('connected to DB');
});

//schemas
const messageSchema = new mongoose.Schema({
  user: String,
  message: String,
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
});

const chatRoomSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  messages: [messageSchema],
  description: String,
});

//models
const User = mongoose.model('Users', userSchema);
const ChatRoom = mongoose.model('ChatRooms', chatRoomSchema);

const io = socket.listen(server);

io.sockets.on('connection', socket => {

  //join
  socket.on('join', data => {
    socket.join(data.room);
    ChatRoom.find((err, rooms) => {
      if (err) {
        console.log(err);
        return;
      }
      // console.log(rooms)
      if (rooms.find(room => room.name === data.room)) {
        io.sockets.emit('room ready', { isReady: true });
      } else {
        let newChatroom = new ChatRoom({
          name: data.room,
          messages: [],
          description: data.description
        });
        newChatroom.save(err => {
          if (err) {
            console.log(err);
            return;
          }
        });
        io.sockets.emit('room ready', { isReady: true });
        console.log('new room created')
      }
    });
  });

  // message
  socket.on('message', data => {
    let newMessage = {
      user: data.user,
      message: data.message
    };

    io.in(data.room).emit('new message', newMessage);
    ChatRoom.updateOne({ name: data.room }, { $push: { messages: newMessage } },
      (err) => {
        if (err) {
          console.log(err);
          return false;
        }
      });
  });

  // typing
  socket.on('typing', data => {
    socket.broadcast.in(data.room).emit('typing', {
      data: data,
      isTyping: true
    });
  });
});

app.get('/', (req, res) => {
  res.send('Welcome to chat...');
});

// registration
app.post('/api/users', (req, res) => {
  let user = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  };

  User.find((err, users) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }

    if (!users.find(savedUser => savedUser.username === user.username)) {
      let newUser = new User(user);

      newUser.save((err, User) => {
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

// login
app.post('/api/login', (req, res) => {
  let isPresent = false;
  let isCorrectPassword = false;
  let loggedInUser;

  User.find((err, users) => {
    if (err) {
      return res.send(err);
    }

    let foundUser = users.find(user => user.username === req.body.username);
    if (foundUser) {
      isPresent = true
    } else {
      res.json({ wrongUsername: true });
      return;
    }

    if (foundUser.password === req.body.password) {
      isCorrectPassword = true;
      loggedInUser = foundUser;
    }

    res.json({ isPresent, isCorrectPassword, user: loggedInUser });
  })
});

// get user
app.get('/api/users', (req, res) => {
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


