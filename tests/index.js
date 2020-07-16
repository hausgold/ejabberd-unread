#!/usr/bin/env node

const async = require('async');

// Setup a new client and run the test suite
require('./src/client')(require('./config'), (client) => {
  // Setup the test cases helpers
  const test = require('./src/testcases')(client, true);
  const seeds = client.config.seeds;

  // Run all test cases
  async.waterfall([
    test.describe('List last read message per user of a conversation (peer)', [
      test.context('with unread messages', [
        test.it('responds the correct first unread message per peer [1]', [
          test.expectFirstUnreadOfPeers('room1', {
            'alice': undefined,
            'amy': '$firstMessageId',
            'bob': '$firstMessageId'
          })
        ]),

        test.it('responds the correct first unread message per peer [6]', [
          test.expectFirstUnreadOfPeers('room6', {
            'alice': undefined,
            'amy': '$firstMessageId',
            'bob': '$firstMessageId'
          })
        ]),

        test.it('responds the correct first unread message per peer [3]', [
          test.expectFirstUnreadOfPeers('bob', {
            'alice': '$firstMessageId',
            'bob': undefined
          })
        ])
      ]),

      test.context('without unread messages', [
        test.it('responds no unread message [3]', [
          test.expectFirstUnreadOfPeers('alice', {
            'alice': undefined,
            'bob': undefined
          })
        ])
      ])
    ]),

    test.describe('List all unread counts of all conversations (own)', [
      test.context('with unread messages', [
        test.it('responds the correct counts per conversation (alice) [2,3,6]',
          [ test.expectUnreadCounts('alice', seeds.alice) ]
        ),

        test.it('responds the correct counts per conversation (amy) [2,3,6]', [
          test.expectUnreadCounts('amy', seeds.amy)
        ]),

        test.it('responds the correct counts per conversation (bob) [2,6]', [
          test.expectUnreadCounts('bob', seeds.bob)
        ])
      ]),

      test.context('without unread messages', [
        test.it('responds the correct counts per conversation (emma) [7]', [
          test.expectUnreadCounts('emma', seeds.emma)
        ])
      ])
    ]),

    test.describe('Mark a message as read (single message)', [
      test.context('without a matching user/conversation/message', [
        test.it('deletes no database row [1]', [
          test.unreadMessagesConversation('amy', 'room6', 3),
          test.markAsRead('amy', 'room6', 404),
          test.unreadMessagesConversation('amy', 'room6', 3),
          test.unreadMessages('amy', 11),
          test.allUnreadMessages(26)
        ]),

        test.it('deletes no database row [4]', [
          test.unreadMessagesConversation('alice', 'bob', 1),
          test.markAsRead('alice', 'bob', 404),
          test.unreadMessagesConversation('alice', 'bob', 1),
          test.unreadMessages('alice', 4),
          test.allUnreadMessages(26)
        ])
      ]),

      test.context('with a matching user/conversation/message', [
        test.it('only deletes one database row [1]', [
          test.unreadMessagesConversation('amy', 'room1', 1),
          test.markAsRead('amy', 'room1', '$lastUnreadMessageId'),
          test.unreadMessagesConversation('amy', 'room1', 0),
          test.unreadMessages('amy', 10),
          test.allUnreadMessages(25)
        ]),

        test.it('only deletes one database row [4]', [
          test.unreadMessagesConversation('alice', 'bob', 1),
          test.markAsRead('alice', 'bob', '$lastUnreadMessageId'),
          test.unreadMessagesConversation('alice', 'bob', 0),
          test.unreadMessages('alice', 3),
          test.allUnreadMessages(24)
        ])
      ])
    ]),

    test.describe('Mark all messages of a conversation as read', [
      test.context('without a matching user/conversation', [
        test.it('deletes no database row [2]', [
          test.markAllAsRead('amy', 'room2'),
          test.unreadMessages('amy', 10),
          test.allUnreadMessages(24)
        ]),

        test.it('deletes no database row [12]', [
          test.markAllAsRead('john', 'bob'),
          test.unreadMessages('john', 1),
          test.allUnreadMessages(24)
        ])
      ]),

      test.context('with a matching user/conversation', [
        test.it('only deletes three database rows [6]', [
          test.unreadMessagesConversation('amy', 'room6', 3),
          test.markAllAsRead('amy', 'room6'),
          test.unreadMessagesConversation('amy', 'room6', 0),
          test.unreadMessages('amy', 7),
          test.allUnreadMessages(21)
        ]),

        test.it('only deletes three database rows [7]', [
          test.unreadMessagesConversation('amy', 'emma', 3),
          test.markAllAsRead('amy', 'emma'),
          test.unreadMessagesConversation('amy', 'emma', 0),
          test.unreadMessages('amy', 4),
          test.allUnreadMessages(18)
        ])
      ])
    ]),

    test.describe('Fetch messages of a conversation from archive', [
      test.context('with unread messages, without read messages', [
        test.it('responds the correct message counts [8]', [
          test.expectMamHistory('amy', 'room8', {
            unread: 3, read: 0
          })
        ]),

        test.it('responds the correct message counts [9]', [
          test.expectMamHistory('alice', 'emma', {
            unread: 3, read: 0
          })
        ]),

        test.it('responds the full messages [10]', [
          test.expectMamHistory('bob', 'room10', {
            unread: 1, read: 0
          }),
          test.expectMamHistoryCustomStanza('bob', 'room10')
        ]),

        test.it('responds the full messages [11]', [
          test.expectMamHistory('bob', 'emma', {
            unread: 1, read: 0
          }),
          test.expectMamHistoryCustomStanza('bob', 'emma')
        ])
      ]),

      test.context('with unread and read messages', [
        test.it('responds the correct message counts [8]', [
          test.markAsRead('amy', 'room8', '$lastUnreadMessageId'),
          test.markAsRead('amy', 'room8', '$lastUnreadMessageId'),
          test.expectMamHistory('amy', 'room8', {
            unread: 1, read: 2
          })
        ]),

        test.it('responds the correct message counts [9]', [
          test.markAsRead('alice', 'emma', '$lastUnreadMessageId'),
          test.expectMamHistory('alice', 'emma', {
            unread: 2, read: 1
          })
        ])
      ]),

      test.context('with read messages, without unread messages', [
        test.it('responds the correct message counts [8]', [
          test.markAllAsRead('amy', 'room8'),
          test.expectMamHistory('amy', 'room8', {
            unread: 0, read: 3
          })
        ]),

        test.it('responds the correct message counts [9]', [
          test.markAllAsRead('alice', 'emma'),
          test.expectMamHistory('alice', 'emma', {
            unread: 0, read: 3
          })
        ]),

        test.it('responds the full messages [10]', [
          test.markAllAsRead('bob', 'room10'),
          test.expectMamHistory('bob', 'room10', {
            unread: 0, read: 1
          }),
          test.expectMamHistoryCustomStanza('bob', 'room10')
        ]),

        test.it('responds the full messages [11]', [
          test.markAllAsRead('bob', 'emma'),
          test.expectMamHistory('bob', 'emma', {
            unread: 0, read: 1
          }),
          test.expectMamHistoryCustomStanza('bob', 'emma')
        ])
      ])
    ])
  ], client.utils.exit);
});
