const async = require('async');
const colors = require('colors');
const xmpp = require('stanza.io');
const config = require('../config');
const utils = require('./utils')(config);

/**
 * Create a brand new MUC.
 *
 * @param {String} name The name of the room
 * @param {Object} client The XMPP client
 * @param {Function} callback The function to call on finish
 */
var createRoom = function(name, client, callback)
{
  utils.log(`Create room ${name.magenta}`, false, 1);
  client.joinRoom(`${name}@${client.config.mucHostname}`, 'admin');
  callback && callback();
};

/**
 * Invite the given list of users to the given room.
 *
 * @param {String} room The name of the room
 * @param {Array<String>} users The users to invite
 * @param {Object} client The XMPP client
 * @param {Function} callback The function to call on finish
 */
var inviteUsers = function(room, users, client, callback)
{
  async.each(users, function(user, callback) {
    utils.log(`Make ${user.blue} member of ${room.magenta}`, false, 1);
    client.setRoomAffiliation(
      `${room}@${client.config.mucHostname}`,
      `${user}@${client.config.hostname}`,
      'member',
      null,
      function(err) { callback && callback(err); }
    );
  }, function(err) {
    // client.getRoomMembers(`${room}@${client.config.mucHostname}`, {
    //   items: [{ affiliation: 'member' }]
    // }, function() {
    //   callback && callback();
    //   utils.log(arguments[1].mucAdmin.items);
    // });

    callback && callback(err);
  });
};

/**
 * Create all configured MUCs and invite all configured users to it.
 *
 * @param {String} room The name of the room
 * @param {Array<String>} users The users to invite
 * @param {Object} client The XMPP client
 * @param {Function} callback The function to call on finish
 */
module.exports = function(room, users, client, callback)
{
  async.waterfall([
    (callback) => createRoom(room, client, callback),
    (callback) => inviteUsers(room, users, client, callback)
  ], function(err) {
    callback && callback(err);
  });
};
