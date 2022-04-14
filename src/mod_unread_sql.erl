-module(mod_unread_sql).
-author("hermann.mayer92@gmail.com").
-behaviour(mod_unread).
-compile([{parse_transform, ejabberd_sql_pt}]).
-export([init/2, is_unread/4, store/4, drop/4, count/2, first_unread/2]).

-include("hg_unread.hrl").
-include("logger.hrl").
-include("xmpp.hrl").
-include("ejabberd_sql_pt.hrl").

init(_Host, _Opts) ->
  ok.

%% This function allows to query the unread state of the given
%% user/conversation/message combination.
-spec is_unread(binary(), binary(), binary(), non_neg_integer())
  -> #ur_unread{}.
is_unread(LServer, UserJid, ConversationJid, MessageId) ->
  Query = ?SQL("SELECT @(1)d "
               "FROM unread_messages "
               "WHERE user_jid = %(UserJid)s "
               "AND conversation_jid = %(ConversationJid)s "
               "AND message_id = %(MessageId)d"),
  case ejabberd_sql:sql_query(LServer, Query) of
    %% When there is a row found, the message is unread.
    {selected, [{1}]} -> #ur_unread{state = <<"true">>};
    %% Not found or issues mean the message is already read.
    _ -> #ur_unread{state = <<"false">>}
  end.

%% This function writes a new row to the unread messages database in order
%% to persist it.
-spec store(binary(), binary(), binary(), non_neg_integer()) -> any().
store(LServer, UserJid, ConversationJid, Id) ->
  case ?SQL_UPSERT(LServer,
                   "unread_messages",
                   ["!user_jid=%(UserJid)s",
                    "!conversation_jid=%(ConversationJid)s",
                    "!message_id=%(Id)d",
                    "created_at=NOW()"]) of
  ok -> ok;
  _Err -> {error, db_failure}
  end.

%% This function drops a single/all message(s) for the given user/conversation
%% combination based on the given message id.
-spec drop(binary(), binary(), binary(), binary()) -> any().
drop(LServer, UserJid, ConversationJid, <<"all">>) ->
  case ejabberd_sql:sql_query(LServer,
              ?SQL("DELETE FROM unread_messages"
                   " WHERE user_jid = %(UserJid)s"
                   " AND conversation_jid = %(ConversationJid)s")) of
  ok -> ok;
  _Err -> {error, db_failure}
  end;
drop(LServer, UserJid, ConversationJid, MessageId) ->
  case ejabberd_sql:sql_query(LServer,
              ?SQL("DELETE FROM unread_messages"
                   " WHERE user_jid = %(UserJid)s"
                   " AND conversation_jid = %(ConversationJid)s"
                   " AND message_id = %(MessageId)d")) of
  ok -> ok;
  _Err -> {error, db_failure}
  end.

%% This function aggregates and selects the count of unread messages per
%% conversation of the given user.
-spec count(binary(), binary()) -> [#ur_unread_messages{}].
count(LServer, UserJid) ->
  Query = ?SQL("SELECT @(conversation_jid)s, "
               "COUNT(*) AS @(amount)d "
               "FROM unread_messages "
               "WHERE user_jid = %(UserJid)s "
               "GROUP BY conversation_jid"),
  case ejabberd_sql:sql_query(LServer, Query) of
    {selected, Counts} ->
      [#ur_unread_messages{jid = Conversation, amount = Amount}
        || {Conversation, Amount} <- Counts];
    {'EXIT', _} -> [];
    _ -> []
  end.

%% This function selects the first unread message of all affiliated users of
%% the given conversation. See https://bit.ly/3gOr40S for SQL details.
-spec first_unread(binary(), binary()) -> [#ur_unread_message{}].
first_unread(LServer, ConversationJid) ->
  Query = ?SQL("SELECT DISTINCT "
               "@(user_jid)s, "
               "@(message_id)d "
               "@(conversation_jid)d "
               "FROM unread_messages "
               "WHERE conversation_jid = %(ConversationJid)s "
               "ORDER BY user_jid, message_id ASC"),
  case ejabberd_sql:sql_query(LServer, Query) of
    {selected, Messages} ->
      [#ur_unread_message{jid = User, id = MessageId}
        || {User, MessageId} <- Messages];
    {'EXIT', _} -> [];
    _ -> []
  end.
