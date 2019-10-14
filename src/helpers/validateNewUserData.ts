const namePattern = /^([^-\s][a-zA-Zа-яёА-ЯЁ ]{2,15})$/;
const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const passwordPattern = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])([a-zA-Z0-9]{8,})$/;

export const validateNewUserData = (
  { name, email, password }
) => namePattern.test(name)
  && emailPattern.test(email)
  && passwordPattern.test(password);
