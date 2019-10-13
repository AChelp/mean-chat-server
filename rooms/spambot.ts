import { User } from '../models/User';

const spamBot = {
  name: 'Spam bot',
  email: 'Spam@Spam.spm',
  password: 'spamSPAM1'
};

export const setSpamBot = () => {

  User.find({ name: spamBot.name }, (err, users) => {
      if (users.length) {
        console.log('ReverseBot already exist');
        return
      } else {
        const SpamBot = new User(spamBot);
        SpamBot.save((err) => {
          if (err) {
            console.log(JSON.stringify(err));
          }

          console.log('SpamBot was created')
        });
      }
    }
  )
};
