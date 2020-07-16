#!/usr/bin/env node

// Seeds
//
//   * [1] MUC with three users, one message unread per user (sender has none)
//   * [6] MUC with three users, 3 messages unread per user (sender has none)
//   * [2] MUC with three users, without unread messages (sender has none)
//   * [8] MUC with three users, 3 messages unread per user (sender has none)
//   * [10] MUC with three users, one message (custom stanza) per
//          user (sender has none)
//
//   * [3] direct chat between two users, no unread messages
//   * [4] direct chat between two users
//     -> one message unread own perspective
//   * [5] direct chat between two users
//     -> one message unread peer perspective
//   * [7] direct chat between two users
//     -> three messages unread own perspective
//   * [9] direct chat between two users
//     -> three messages unread own perspective
//   * [11] direct chat between two users
//     -> one message (custom stanza) unread own perspective
//   * [12] direct chat between two users
//     -> one message unread own perspective

const async = require('async');
const createUsers = require('./lib/users');
const createRoom = require('./lib/rooms');

// Setup a new client and run the test suite
require('./src/client')(require('./config'), (client) => {
  // Setup the test cases helpers
  const test = require('./src/testcases')(client, true);

  // Run all seeds
  async.waterfall([
    // Create all users first
    (callback) => createUsers(client.config.users, callback),

    // Create rooms (MUCs) and invite relevant users to them
    (users, callback) => {
      async.each(Object.keys(client.config.rooms), (name, callback) => {
        createRoom(name, client.config.rooms[name], client, callback);
      }, () => callback(null, users));
    },

    // Setup room (MUCs) messages
    (users, callback) => {
      test.switchUser('alice', (test, switchDone) => {
        async.series([
          // Test case [1]
          (callback) => test.message('room1', callback),

          // Test case [6]
          (callback) => test.message('room6', callback),
          (callback) => test.message('room6', callback),
          (callback) => test.message('room6', callback),

          // Test case [8]
          (callback) => test.message('room8', callback),
          (callback) => test.message('room8', callback),
          (callback) => test.message('room8', callback),

          // Test case [10]
          (callback) => test.customStanza('room10', callback)
        ], () => switchDone(() => callback(null, users)));
      });
    },

    // Setup direct chats
    (users, callback) => {
      async.series([
        // [4] one message unread own (alice) perspective ["alice", "bob"]
        (callback) => {
          test.switchUser('bob', (test, switchDone) => {
            test.message('alice', () => switchDone(callback));
          });
        },

        // [5] one message unread peer (bob) perspective ["amy", "bob"]
        (callback) => {
          test.switchUser('amy', (test, switchDone) => {
            test.message('bob', () => switchDone(callback));
          });
        },

        // [7] three messages unread own (amy) perspective ["amy", "emma"]
        (callback) => {
          test.switchUser('emma', (test, switchDone) => {
            async.timesSeries(3, (_, callback) => {
              test.message('amy', callback);
            }, () => switchDone(callback));
          });
        },

        // [9] three messages unread own (alice) perspective ["alice", "emma"]
        (callback) => {
          test.switchUser('emma', (test, switchDone) => {
            async.timesSeries(3, (_, callback) => {
              test.message('alice', callback);
            }, () => switchDone(callback));
          });
        },

        // [11] one messages unread own (bob) perspective ["bob", "emma"]
        (callback) => {
          test.switchUser('emma', (test, switchDone) => {
            test.customStanza('bob', () => switchDone(callback));
          });
        },

        // [12] one message unread peer (bob) perspective ["john", "emma"]
        (callback) => {
          test.switchUser('emma', (test, switchDone) => {
            test.customStanza('john', () => switchDone(callback));
          });
        }
      ], callback);
    },

    // Test the unread messages handling / table contents
    (users, callback) => {
      client.config.testLevel = 3;
      const counts = client.config.seeds;
      const countChecks = Object.keys(counts).reduce((memo, user) => {
        Object.keys(counts[user]).forEach((conversation) => {
          memo.push(test.unreadMessagesConversation(
            user, conversation, counts[user][conversation]
          ));
        });
        return memo;
      }, []);

      async.series([
        // Check the overall count of unread messages rows
        test.allUnreadMessages(26),
        // Check the unread messages of the users (all conversation wide)
        test.unreadMessages('alice', 4),
        test.unreadMessages('amy', 11),
        test.unreadMessages('bob', 10),
        test.unreadMessages('emma', 0),
        test.unreadMessages('john', 1),
        // Check the unread messages of each user on a specific conversation
      ].concat(countChecks), callback);
    }
  ], client.utils.exit);
});
