const async = require('async');
const faker = require('faker');
const { Client } = require('pg');
const setupClient = require('./client');
const pg = new Client(require('../config').db);

module.exports = testCases = (client, db = false) => {
  if (db) { pg.connect(); }

  // Default message matcher
  const msgMatcher = (msg) => new RegExp(`<stanza-id .*${msg}`, 'g');

  // Setup the stanza validator
  const stanza = require('./stanza-validator')(client.utils);

  // Setup the database validator
  const database = require('./database-validator')(pg, client.utils);

  // Detect if we are running on CI or not
  const ci = process.env.TEST_ENV == 'ci';

  // Configure a timeout for the message responses
  const messageTimeout = (ci) ? 1500 : 300;

  const self = {
    // Easy to use references
    client: client,
    config: client.config,
    utils: client.utils,

    // Print a new description block
    describe: (what, runs) => {
      return (callback) => {
        self.config.testLevel = 1;
        self.utils.log(what.toString().green, false, 1);
        async.waterfall(runs, () => {
          self.done()();
          callback();
        });
      };
    },

    // Print a new context block
    context: (what, runs) => {
      return (callback) => {
        self.config.testLevel = 3;
        self.utils.log(what.toString().green, false, 3);
        async.waterfall(runs, callback);
      };
    },

    // Print a new test case
    it: (desc, runs) => {
      return (callback) => {
        self.config.testLevel = 5;
        self.utils.log(desc.toString().green, false, 5);
        self.config.testLevel = 7;
        async.waterfall(runs, callback);
      };
    },

    // Mark a test case as done
    done: () => {
      return (callback) => {
        self.config.testLevel = null;
        callback && callback();
      };
    },

    // Shutdown further tests
    skipAll: () => {
      return (callback) => {
        self.utils.log('Skipping all further tests'.yellow.bold, false, 1);
        callback(true);
      }
    },

    // Convert the given local part (eg. +alice+, or +room6+) to their
    // respective bare JIDs
    jid: (local) => {
      return (/^room/.test(local))
        ? `${local}@${self.config.mucHostname}`
        : `${local}@${self.config.hostname}`;
    },

    // Return the colored version of the given JID
    coloredJid: (jid) => {
      let local = jid.split('@')[0];
      return (/^room/.test(jid)) ? local.magenta : local.blue;
    },

    // Toggle the client debugging
    debug: (state) => {
      if (state == undefined) {
        self.config.debug = !self.config.debug;
        return;
      }

      self.config.debug = state;
    },

    // Send a ping request to the server
    ping: (callback) => {
      self.client.ping(self.config.hostname, (err, res) => {
        callback && callback(null, res.to.bare);
      })
    },

    // Switch the current client user
    switchUser: (name, callback) => {
      self.utils.switchUser(name, (client) => {
        client.config.testLevel = self.config.testLevel;
        callback(testCases(client), (callback) => {
          // Sync current util statistics back to the root one
          self.utils.matchers += client.utils.matchers;
          self.config.testLevel = client.config.testLevel;
          self.config.errors = self.config.errors.concat(
            client.config.errors
          );
          // Close the new client session
          client.disconnect();
          // Signalize we are done here
          callback && callback();
        });
      })
    },

    // Send message to room or a direct chat message
    message: (to, callback) => {
      if (~to.indexOf(self.config.mucHostname) || /^room/.test(to)) {
        self.mucMessage(to, callback);
      } else {
        self.directMessage(to, callback);
      }
    },

    // Send a custom stanza message to room or a direct chat
    customStanza: (to, callback) => {
      self.config.customStanza = true;
      self.message(to, () => {
        callback();
        self.config.customStanza = false;
      });
    },

    // Send message to room
    mucMessage: (room, callback) => {
      // Make sure we join to the given room first, before sending the message
      roomJid = `${room}@${self.config.mucHostname}`;
      self.client.joinRoom(roomJid, self.config.jid.local);

      // Prepare the message sending, and setup response matching logic
      self.utils.log(
        `Send a new message from ${self.coloredJid(self.config.jid.local)} ` +
        `to ${self.coloredJid(room)}`
      );
      let callbacked = false;
      let message = faker.hacker.phrase();
      let safeMessage = self.utils.escapeXml(message);
      let opts = { body: message };

      if (self.config.customStanza) {
        delete opts.body;
        opts.store = true;
        opts.customStanza = {
          id: 4,
          message: "Max's new car is great!",
          owner: {
            id: 7,
            name: 'Max Mustermann'
          }
        };
        safeMessage = '<very-custom-stanza ';
      }

      self.config.lastMessage = safeMessage;
      self.utils.setMatcher(msgMatcher(safeMessage), (xml, direction) => {
        if (callbacked) { return; }
        callbacked = true;

        // Check the input message
        stanza.message(
          roomJid,
          self.config.jid.local,
          !('customStanza' in opts)
        )(xml, direction);
        // Signalize that the message sending is done
        callback && callback();
      });

      // Send the actual message
      self.client.sendMessage(Object.assign({
        to: roomJid,
        type: 'groupchat'
      }, opts));
    },

    // Send direct message to another user
    directMessage: (to, callback) => {
      // Prepare the message sending, and setup response matching logic
      toJid = `${to}@${self.config.hostname}`;
      self.utils.log(
        `Send a new message from ${self.coloredJid(self.config.jid.local)} ` +
        `to ${to.blue}`
      );
      let callbacked = false;
      let message = faker.hacker.phrase();
      let safeMessage = self.utils.escapeXml(message);
      let opts = { body: message };

      if (self.config.customStanza) {
        delete opts.body;
        opts.store = true;
        opts.customStanza = {
          id: 4,
          message: "Max's new car is great!",
          owner: {
            id: 7,
            name: 'Max Mustermann'
          }
        };
        safeMessage = '<very-custom-stanza ';
      }

      // Unfortunately XMPP does not respond anything for direct messages, so
      // we must check the database - but first wait a bit to allow ejabberd to
      // write the message to the database
      database.archiveOneMoreDirect(callback, (callback) => {
        // Send the actual message
        self.client.sendMessage(Object.assign({ to: toJid }, opts));
        setTimeout(callback, messageTimeout);
      });
    },

    // Fetch the first unread messages id from the database (for the current
    // user)
    firstUnreadMessageId: (user, of, callback) => {
      database.firstUnreadMessageId(
        self.jid(user), self.jid(of), callback
      );
    },

    // Fetch the last unread message id from the database (for the current
    // user)
    lastUnreadMessageId: (user, of, callback) => {
      database.lastUnreadMessageId(
        self.jid(user), self.jid(of), callback
      );
    },

    // Check the count of unread messages (database state) of all
    // users/conversations (table row count)
    allUnreadMessages: (count) => {
      return (callback) => {
        self.utils.log(
          `Check for ${count.toString().yellow} tracked ` +
          `unread messages overall`,
          false,
          self.config.testLevel
        );
        database.allUnreadMessages(count, callback);
      };
    },

    // Check the count of unread messages (database state) of a user (all
    // conversations of him)
    unreadMessages: (of, count) => {
      return (callback) => {
        self.utils.log(
          `Check for ${count.toString().yellow} tracked unread ` +
          `messages of ${self.coloredJid(of)}`,
          false,
          self.config.testLevel
        );
        jid = `${of}@${self.config.hostname}`;
        database.unreadMessages(jid, count, callback);
      };
    },

    // Check the count of unread messages (database state) for a
    // user/conversation combination
    unreadMessagesConversation: (of, on, count) => {
      return (callback) => {
        let conversation = self.jid(on);
        self.utils.log(
          `Check for ${count.toString().yellow} tracked unread ` +
          `messages of ${self.coloredJid(of)} from ${self.coloredJid(on)}`,
          false,
          self.config.testLevel
        );
        jid = `${of}@${self.config.hostname}`;
        database.unreadMessagesConversation(jid, conversation, count, callback);
      };
    },

    // Mark a message as read (single message)
    markAsRead: (user, conversation, messageId) => {
      return (callback) => {
        self.switchUser(user, (test, switchDone) => {
          async.waterfall([
            (callback) => {
              if (messageId == '$lastUnreadMessageId') {
                return self.lastUnreadMessageId(user, conversation, (id) => {
                  callback(null, id);
                });
              }
              callback(null, messageId);
            }
          ], (err, messageId) => {
            if (err || messageId == null) {
              self.utils.log(
                `${'[IGNORED]'.red} Mark (a/all?) message(s) as read for ` +
                `${self.coloredJid(user)} on ` +
                `${self.coloredJid(conversation)}`,
                false,
                self.config.testLevel
              );
              return switchDone(callback);
            }

            let conversationJid = self.jid(conversation);
            let message = messageId == 'all'
              ? 'all messages' : messageId.toString();

            self.utils.log(
              `Mark ${message.yellow} as read for ` +
              `${self.coloredJid(user)} on ` +
              `${self.coloredJid(conversation)}`,
              false,
              self.config.testLevel
            );

            test.client.sendIq({
              type: 'set',
              to: self.config.hostname,
              ack: {
                id: messageId,
                jid: conversationJid
              }
            }, (err, res) => {
              if (err) {
                self.utils.logError(
                  `Bad IQ result for ack:${messageId} ` +
                  `(${user}, ${conversationJid})`, '', err.error
                );
                return switchDone(callback);
              }
              setTimeout(() => { switchDone(callback); }, messageTimeout);
            });
          });
        });
      };
    },

    // Mark all messages of a conversation as read
    markAllAsRead: (user, conversation) => {
      return self.markAsRead(user, conversation, 'all');
    },

    // List all unread counts of all conversations (own perspective)
    queryUnread: (callback) => {
      self.utils.setMatcherFake();
      self.utils.log(
        `Query unread message counts of all conversations ` +
        `from ${self.coloredJid(self.config.jid.local)}`,
        false,
        self.config.testLevel
      );

      self.client.sendIq({
        type: 'get',
        to: self.config.hostname,
        query: { }
      }, (err, res) => {
        if (err) {
          self.utils.logError(
            `Bad IQ result for query:${'own'.yellow} ` +
            `(${self.config.jid})`, '', err.error
          );
          return callback();
        }

        let unreadMessages = res.unreadMessages || [];
        let unread = unreadMessages.reduce((memo, cur) => {
          memo[cur.jid] = parseInt(cur.amount);
          return memo;
        }, {});
        setTimeout(() => { callback(unread) }, messageTimeout);
      });
    },

    // Perform the +unreadQuery+ and checks the result against
    // the given expected hash
    expectUnreadCounts: (of, expected) => {
      expected = Object.keys(expected).reduce((memo, conversation) => {
        let count = expected[conversation];
        memo[self.jid(conversation)] = count == 0 ? undefined : count;
        return memo;
      }, {});

      return (callback) => {
        self.switchUser(of, (test, switchDone) => {
          test.queryUnread((actual) => {
            self.utils.log(
              `Check unread message counts of all conversations ` +
              `from ${self.coloredJid(self.config.jid.local)}`,
              false,
              self.config.testLevel
            );

            Object.keys(expected).forEach((conversation) => {
              self.utils.setMatcherFake();

              if (actual[conversation] !== expected[conversation]) {
                self.utils.logError(
                  `Unexpected unread message count on ${conversation} ` +
                  `of ${test.config.jid.local}`,
                  '',
                  `${actual[conversation]} (actual) != ` +
                  `${expected[conversation]} (expected)`
                );
              } else {
                let what = 'No'.yellow;
                if (expected[conversation] !== undefined) {
                  what = ` ${expected[conversation].toString().yellow}`;
                }

                self.utils.log(
                  `${what} unread messages on ${self.coloredJid(conversation)}`,
                  false,
                  self.config.testLevel + 2
                );
              }
            });
            switchDone(callback);
          });
        });
      };
    },

    // List first unread message per user of a conversation (peer perspective)
    queryUnreadPeers: (conversation, callback) => {
      self.utils.setMatcherFake();
      const conversationJid = self.jid(conversation);

      self.utils.log(
        `Query first unread messages ` +
        `of ${self.coloredJid(conversation)}`,
        false,
        self.config.testLevel
      );

      self.client.sendIq({
        type: 'get',
        to: self.config.hostname,
        query: {
          jid: conversationJid
        }
      }, (err, res) => {
        if (err) {
          self.utils.logError(
            `Bad IQ result for query:${'peer'.yellow} ` +
            `(${conversationJid})`, '', err.error
          );
          return callback();
        }

        let firstUnread = res.firstUnread || [];
        let unread = firstUnread.reduce((memo, cur) => {
          memo[cur.jid] = parseInt(cur.id);
          return memo;
        }, {});
        setTimeout(() => { callback(unread) }, messageTimeout);
      });
    },

    // Perform the +queryUnreadPeers+ and checks the result against
    // the given expected hash
    expectFirstUnreadOfPeers: (on, expected) => {
      return (callback) => {
        self.queryUnreadPeers(on, (actual) => {
          // Fetch all the latest unread messages per user, per conversation
          async.map(Object.keys(expected), (conversation, callback) => {
            let res = {};
            let key = self.jid(conversation);
            res[key] = expected[conversation];

            if (expected[conversation] === undefined) {
              return callback(null, res)
            }

            if (expected[conversation] == '$firstMessageId') {
              self.utils.log(
                `Fetch first unread message of ` +
                `${self.coloredJid(conversation)} on ${self.coloredJid(on)}`,
                false,
                self.config.testLevel
              );

              return self.firstUnreadMessageId(conversation, on, (id) => {
                res[key] = id;
                callback(null, res);
              });
            }

            callback(null, res)
          }, (err, mapped) => {
            if (err) {
              self.utils.logError(`Bad database mapping`, '', err.error);
              return callback();
            }

            expected = mapped.reduce((memo, cur) => {
              return Object.assign(memo, cur);
            }, {});

            self.utils.log(
              `Check first unread messages of ${self.coloredJid(on)}`,
              false,
              self.config.testLevel
            );

            Object.keys(expected).forEach((conversation) => {
              self.utils.setMatcherFake();

              if (actual[conversation] !== expected[conversation]) {
                self.utils.logError(
                  `Unexpected first unread message on ${conversation} ` +
                  `of ${on}`,
                  '',
                  `${actual[conversation]} (actual) != ` +
                  `${expected[conversation]} (expected)`
                );
              } else {
                let what = `${'No'.yellow} unread messages for ` +
                  `${self.coloredJid(conversation)} on ${self.coloredJid(on)}`;

                if (expected[conversation] !== undefined) {
                  what = `${expected[conversation].toString().yellow} is ` +
                    `the first unread message for ` +
                    `${self.coloredJid(conversation)} on ` +
                    `${self.coloredJid(on)}`;
                }

                self.utils.log(what, false, self.config.testLevel + 2);
              }
            });
            callback && callback();
          });
        });
      };
    },

    // Query the message archives (MAM) by the given user for the given
    // conversation - the resulting messages will be passed back via callback
    queryMamHistory: (conversation, callback) => {
      self.utils.log(
        `Query message archive ` +
        `of ${self.coloredJid(self.config.jid.local)} ` +
        `by ${self.coloredJid(conversation)}`,
        false,
        self.config.testLevel
      );

      let options = { rsm: { max: 25 } };

      if (~conversation.indexOf(self.config.mucHostname)
        || /^room/.test(conversation)) {
        options.jid = self.jid(conversation);
      } else {
        options.with = self.jid(conversation);
      }

      // Query the MAM of the given conversation, directly ready to
      // use for MUCs and direct chats
      client.searchHistory(options, (err, res) => {
        if (err) {
          self.utils.logError(
            `Error while fetching a message archive ` +
            `as ${test.client.config.jid.bare} (${conversation})`,
            '', err.error
          );
          return callback();
        }

        let messages = res.mamResult.items.map((res) => res.forwarded.message);
        messages = messages.reduce((memo, res) => {
          memo[res.messageId] = {
            body: res.body,
            conversation: res.from.bare,
            from: res.from.resource,
            unread: res.unread == true,
            customStanza: res.customStanza
          };
          return memo;
        }, {});

        callback(messages);
      });
    },

    // Check the message archive for the given conversation and user
    expectMamHistory: (user, conversation, expected, callback) => {
      return (callback) => {
        self.switchUser(user, (test, switchDone) => {
          test.queryMamHistory(conversation, (messages) => {
            self.utils.log(
              `Found ${Object.keys(messages).length.toString().yellow} ` +
              `messages ` +
              `for ${self.coloredJid(conversation)} ` +
              `by ${self.coloredJid(test.config.jid.local)}`,
              false,
              self.config.testLevel
            );

            let actual = Object.keys(messages).reduce((memo, id) => {
              let res = messages[id];
              let key = (res.unread == true) ? 'unread' : 'read';
              memo[key] += 1;
              return memo;
            }, {
              unread: 0,
              read: 0
            });

            Object.keys(expected).forEach((key) => {
              self.utils.setMatcherFake();

              if (actual[key] !== expected[key]) {
                self.utils.logError(
                  `Unexpected ${key} messages count on ${conversation} ` +
                  `of ${user}`,
                  '',
                  `${actual[key]} (actual) != ` +
                  `${expected[key]} (expected)`
                );
              } else {
                let count = (expected[key] == 0) ? 'No' : `${expected[key]}`;
                let what = `${count.yellow} ${key} messages for ` +
                  `${self.coloredJid(conversation)} ` +
                  `on ${self.coloredJid(user)}`;
                self.utils.log(what, false, self.config.testLevel + 2);
              }
            });

            switchDone(callback);
          });
        });
      };
    },

    // Check the message archive for the given conversation and user - we use
    // the first message of the archive to validate the full message payload
    // (custom stanza)
    expectMamHistoryCustomStanza: (user, conversation) => {
      return (callback) => {
        self.switchUser(user, (test, switchDone) => {
          test.queryMamHistory(conversation, (messages) => {
            let message = messages[Object.keys(messages)[0]];
            let errors = 0;

            if (!message || !message.customStanza) {
              self.utils.logError(
                `No message found or no custom stanza included ` +
                `at ${conversation} ` +
                `of ${user}`,
                ''
              );
              return switchDone(callback);
            }

            if (message.customStanza.id != '4') {
              errors++;
              self.utils.logError(
                `Unexpected custom stanza (id)`,
                '',
                `${message.customStanza.id} (actual) != ` +
                `4 (expected)`
              );
            }

            if (message.customStanza.message != "Max's new car is great!") {
              errors++;
              self.utils.logError(
                `Unexpected custom stanza (message)`,
                '',
                `${message.customStanza.message} (actual) != ` +
                `"Max's new car is great!" (expected)`
              );
            }

            if (message.customStanza.owner.id != '7') {
              errors++;
              self.utils.logError(
                `Unexpected custom stanza (owner.id)`,
                '',
                `${message.customStanza.owner.id} (actual) != ` +
                `7 (expected)`
              );
            }

            if (message.customStanza.owner.name != 'Max Mustermann') {
              errors++;
              self.utils.logError(
                `Unexpected custom stanza (owner.name)`,
                '',
                `${message.customStanza.owner.name} (actual) != ` +
                `"Max Mustermann" (expected)`
              );
            }

            if (errors == 0) {
              self.utils.log(
                `Check custom stanza completeness on message`,
                false, self.config.testLevel + 2
              );
            }

            switchDone(callback);
          });
        });
      };
    }
  };

  return self;
};
