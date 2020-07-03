%% This file was generated automatically by compile-xmpp-specs

-record(ur_query, {jid :: undefined | jid:jid()}).
-type ur_query() :: #ur_query{}.

-record(ur_ack, {jid :: jid:jid(),
                 id = <<>> :: binary()}).
-type ur_ack() :: #ur_ack{}.

-record(ur_unread_messages, {jid = <<>> :: binary(),
                             amount :: non_neg_integer()}).
-type ur_unread_messages() :: #ur_unread_messages{}.

-record(ur_unread, {state = <<>> :: binary()}).
-type ur_unread() :: #ur_unread{}.

-record(ur_unread_message, {jid = <<>> :: binary(),
                            id :: non_neg_integer()}).
-type ur_unread_message() :: #ur_unread_message{}.
