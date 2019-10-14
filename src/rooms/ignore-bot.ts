import { User } from '../models/User';

const ignoreBot = {
  name: 'Ignore bot',
  email: 'Ignore@Ignore.ignr',
  password: 'ignoreIGNORE1'
};

export const setIgnoreBot = () => {

  User.find({ name: ignoreBot.name }, (err, users) => {
      if (users.length) {
        console.log('ignoreBot already exist');
        return
      } else {
        const IgnoreBot = new User(ignoreBot);
        IgnoreBot.save((err) => {
          if (err) {
            console.log(JSON.stringify(err));
          }

          console.log('ignoreBot was created')
        });
      }
    }
  )
};
