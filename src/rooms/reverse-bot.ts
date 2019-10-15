import { User } from '../models/User';

const reverseBot = {
  name: 'Reverse bot',
  email: 'Reverse@Reverse.rvrs',
  password: 'reverseREVERSE1',
  description: '?tob esreveR htiw klat ot tnaW',
  avatar: 'reversebot.jpeg'
};

export const setReverseBot = () => {

  User.find({ name: reverseBot.name }, (err, users) => {
      if (users.length) {
        console.log('ReverseBot already exist');
        return
      } else {
        const ReverseBot = new User(reverseBot);
        ReverseBot.save((err) => {
          if (err) {
            console.log(JSON.stringify(err));
          }

          console.log('ReverseBot was created')
        });
      }
    }
  )
};
