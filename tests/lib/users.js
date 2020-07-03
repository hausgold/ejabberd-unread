const request = require('request');
const async = require('async');
const config = require('../config');
const utils = require('./utils')(config);

/**
 * Create a new ejabberd user account.
 *
 * @param {String} name The name of the user
 * @param {Function} callback The function to call on finish
 */
var createUser = function(name, callback)
{
  request.post(
    `http://${config.hostname}/admin/server/${config.hostname}/users/`,
    {
      auth: {
        user: config.jid,
        pass: config.password
      },
      form: {
        newusername: name,
        newuserpassword: config.password,
        addnewuser: 'add'
      }
    },
    function(err, res, body) {
      if (!err && res.statusCode === 200) {
        let jid = `${name}@${config.hostname}`;
        let firstName = name.charAt(0).toUpperCase() + name.slice(1);
        utils.log(`Create user ${name.blue}`, false, 1);
        return callback && callback(null, {
          user: name,
          firstName: firstName,
          lastName: 'Mustermann',
          password: config.password,
          jid: jid,
          id: config.users[name]
        });
      }

      utils.log(`User creation failed. (${name})`, false, 1);
      utils.log(`Error: ${err.message}`, false, 1);
      callback && callback(new Error());
  });
};

/**
 * Create a new vCard for a user.
 *
 * @param {String} user The user instance
 * @param {Function} callback The function to call on finish
 */
var createVcard = function(user, callback)
{
  utils.log(`Create vCard for ${user.user.blue}`, false, 1);

  utils.switchUser(user.user, (client) => {
    client.publishVCard({
      name: { family: user.lastName, given: user.firstName },
      role: 'broker',
      website: `gid://app/User/${user.id}`,
      fullName: `${user.firstName} ${user.lastName}`
    });
    client.disconnect();
    callback && callback(null, user);
  });
};

/**
 * Create all given users and pass them back as an array of
 * user objects.
 *
 * @param {Array} users An array of user names
 * @param {Function} callback The function to call on finish
 */
module.exports = function(users, callback)
{
  const pass = (users, callback) => {
    if (!callback) { return users(null); }
    callback(null, users);
  };

  async.waterfall([
    (callback) => async.map(Object.keys(users), createUser, callback),
    (users, callback) => async.map(users, createVcard, callback),
    (users, callback) => createVcard({
      user: 'admin',
      firstName: 'Admin',
      lastName: 'Mustermann',
      password: config.password,
      jid: `admin@${config.hostname}`,
      id: 'bfd46215-32ba-4365-8cdb-c843f7a9b20d'
    }, (err) => callback(err, users)),
  ], (err, users) => {
    if (err) { return callback(err); }
    callback(null, users);
  });
};
