import { User } from '../models/User';

const general = {
  name: 'General room',
  email: 'general@general.gnrl',
  password: 'generalGENERAL1'
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
  )
};
