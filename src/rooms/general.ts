import { User } from '../models/User';
import { ChatRoom } from '../models/Chatroom';

const general = {
  name: 'General room',
  email: 'general@general.gnrl',
  password: 'generalGENERAL1',
  description: 'Place for discussions',
  avatar: 'generalroom.jpg'
};

export const setGeneral = () => {
  console.log('seting general');

  User.find({ name: general.name }, (err, users) => {
      if (users.length) {
        console.log('general already exist');
        return
      } else {
        const General = new User(general);
        General.save((err) => {
          if (err) {
            console.log(JSON.stringify(err));
          }

          console.log('General was created')
        });
      }
    }
  );

  let newChatRoom = new ChatRoom({
    name: 'Generalroom',
    messages: [],
  });

  ChatRoom.find({ name: 'Generalroom' }, (err, rooms) => {
    if (!rooms.length) {
      newChatRoom.save(err => {
        if (err) {
          console.log(err);
          return;
        }
      });
    }
  })
};
