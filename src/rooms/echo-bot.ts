import { User } from '../models/User';

const echoBot = {
  name: 'Echo bot',
  email: 'Echo@Echo.ech',
  password: 'echoECHO1',
  description: 'Want to talk with Echo bot? Want to talk with Echo bot? Want to talk with Echo bot?',
  avatar: 'echobot.jpg'
};

export const setEchoBot = () => {

  User.find({ name: echoBot.name }, (err, users) => {
      if (users.length) {
        console.log('echoBot already exist');
        return
      } else {
        const EchoBot = new User(echoBot);
        EchoBot.save((err) => {
          if (err) {
            console.log(JSON.stringify(err));
          }

          console.log('echoBot was created')
        });
      }
    }
  )
};
