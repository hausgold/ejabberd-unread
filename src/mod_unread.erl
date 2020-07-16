-module(mod_unread).
-author("hermann.mayer92@gmail.com").
-behaviour(gen_mod).
-export([%% ejabberd module API
         start/2, stop/1, reload/3, mod_opt_type/1, depends/2,
         %% Helpers (database, packet handling)
         store/3, drop/4, add_unread_to_mam_result/5,
         %% Hooks
         on_muc_filter_message/3, on_store_mam_message/6, on_filter_packet/1,
         %% IQ handlers
         on_iq/1
        ]).

-include("ejabberd.hrl").
-include("logger.hrl").
-include("xmpp.hrl").
-include("mod_muc.hrl").
-include("mod_muc_room.hrl").
-include("hg_unread.hrl").
-include("mod_unread.hrl").

-callback init(binary(), gen_mod:opts())
  -> ok | {ok, pid()}.
-callback start(binary(), gen_mod:opts())
  -> ok | {ok, pid()}.
-callback stop(binary())
  -> any().
-callback store(binary(), binary(), binary(), non_neg_integer())
  -> ok | {error, any()}.
-callback drop(binary(), binary(), binary(), binary())
  -> ok | {error, any()}.
-callback count(binary(), binary())
  -> [#ur_unread_messages{}].
-callback first_unread(binary(), binary())
  -> [#ur_unread_message{}].
-callback is_unread(binary(), binary(), binary(), non_neg_integer())
  -> #ur_unread{}.

%% Start the module by implementing the +gen_mod+ behaviour. Here we register
%% the custom XMPP codec, the IQ handler and the hooks to listen to, for the
%% custom unread functionality.
-spec start(binary(), gen_mod:opts()) -> ok.
start(Host, Opts) ->
  %% Initialize the module options
  IQDisc = gen_mod:get_opt(iqdisc, Opts, gen_iq_handler:iqdisc(Host)),
  %% Initialize the database module
  Mod = gen_mod:db_mod(Host, Opts, ?MODULE),
  Mod:init(Host, Opts),
  %% Register the custom XMPP codec
  xmpp:register_codec(hg_unread),
  %% Register hooks
  %% Run the meta addition for MUC messages, before mod_mam gets it (50)
  ejabberd_hooks:add(muc_filter_message,
                     Host, ?MODULE, on_muc_filter_message, 48),
  %% Run the unread message tracking hook before mod_mam storage
  ejabberd_hooks:add(store_mam_message,
                     Host, ?MODULE, on_store_mam_message, 102),
  %% Run the unread MAM query result manipulation hook before the user receives
  %% the packet (looks like there are no other known users of the hook)
  ejabberd_hooks:add(filter_packet,
                     ?MODULE, on_filter_packet, 50),
  %% Register IQ handlers
  gen_iq_handler:add_iq_handler(ejabberd_local, Host, ?NS_UNREAD,
                                ?MODULE, on_iq, IQDisc),
  %% Log the boot up
  ?INFO_MSG("[UR] Start ejabberd-unread (v~s) for ~s", [?MODULE_VERSION, Host]),
  ok.

%% Stop the module, and deregister the XMPP codec and all hooks as well as the
%% IQ handler.
-spec stop(binary()) -> any().
stop(Host) ->
  %% Deregister the custom XMPP codec
  xmpp:unregister_codec(hg_unread),
  %% Deregister all the hooks
  ejabberd_hooks:delete(store_mam_message,
                        Host, ?MODULE, on_store_mam_message, 101),
  ejabberd_hooks:delete(muc_filter_message,
                        Host, ?MODULE, on_muc_filter_message, 48),
  ejabberd_hooks:delete(filter_packet,
                        ?MODULE, on_filter_packet, 50),
  %% Deregister IQ handlers
  gen_iq_handler:remove_iq_handler(ejabberd_local, Host, ?NS_UNREAD),
  ?INFO_MSG("[UR] Stop ejabberd-unread", []),
  ok.

%% Inline reload the module in case of external triggered +ejabberdctl+ reloads.
-spec reload(binary(), gen_mod:opts(), gen_mod:opts()) -> ok.
reload(Host, NewOpts, OldOpts) ->
  %% Reload the custom XMPP codec
  xmpp:register_codec(hg_unread),
  %% Reload the database module on changes
  NewMod = gen_mod:db_mod(Host, NewOpts, ?MODULE),
  OldMod = gen_mod:db_mod(Host, OldOpts, ?MODULE),
  if NewMod /= OldMod -> NewMod:init(Host, NewOpts);
    true -> ok
  end,
  ok.

%% Unfortunately the mod_man +store_mam_message+ hook does not deliver the
%% state data structure of a groupchat message (MUC). We need to get all
%% member/owner affiliations and put their respective JIDs on the packet meta
%% as +users+ key. This will later be picked up by the regular
%% +on_store_mam_message+ hook to multiply the unread messages for all
%% affiliated users of the MUC.
-spec on_muc_filter_message(message(), mod_muc_room:state(),
                            binary()) -> message().
on_muc_filter_message(#message{} = Packet, MUCState, _FromNick) ->
  case xmpp:get_meta(Packet, users, not_found) of
  not_found -> xmpp:put_meta(Packet, users, get_muc_users(MUCState));
  _ -> Packet
  end;
on_muc_filter_message(Acc, _MUCState, _FromNick) -> Acc.

%% Hook on all MAM (message archive management) storage requests to grab the
%% stanza packet and write it to the database. This is the core of this module
%% and takes care of the unread message tracking per user.
-spec on_store_mam_message(message() | drop, binary(), binary(), jid(),
                           chat | groupchat, recv | send) -> message().
on_store_mam_message(#message{to = Conversation} = Packet,
                     _LUser, _LServer, _Peer, groupchat, recv) ->
  %% Add the current message as unread for all room members.
  lists:foreach(fun(User) -> store(User, Conversation, Packet) end,
                affiliated_jids(Packet)),
  Packet;
on_store_mam_message(#message{from = Conversation, to = User} = Packet,
                     _LUser, _LServer, _Peer, chat, recv) ->
  store(User, Conversation, Packet);
on_store_mam_message(Packet, _LUser, _LServer, _Peer, _Type, _Dir) -> Packet.

%% Handle all IQ packets from the user.
-spec on_iq(iq()) -> iq().
%% Handle a "mark all unread messages of a conversation" or a "mark a single
%% message of a conversation as read" request.
on_iq(#iq{type = set, from = UserJid,
          sub_els = [#ur_ack{jid = ConversationJid, id = MessageId}]} = IQ) ->
  drop(UserJid, ConversationJid, MessageId, IQ);
%% Handle a "list all unread counts of all conversations (own perspective)"
%% request. The "own perspective" is the request sender.
on_iq(#iq{type = get, from = #jid{lserver = LServer} = User,
          sub_els = [#ur_query{jid = undefined}]} = IQ) ->
  Mod = gen_mod:db_mod(LServer, ?MODULE),
  Counts = Mod:count(LServer, bare_jid(User)),
  make_iq_result_els(IQ, Counts);
%% Handle a "list first unread message per user of a conversation (peer
%% perspective)" request. The "peer perspective" means we return the states of
%% all conversation affiliated users.
on_iq(#iq{type = get, from = #jid{lserver = LServer},
          sub_els = [#ur_query{jid = Conversation}]} = IQ) ->
  Mod = gen_mod:db_mod(LServer, ?MODULE),
  FirstUnreads = Mod:first_unread(LServer, bare_jid(Conversation)),
  make_iq_result_els(IQ, FirstUnreads);
%% Handle all unmatched IQs.
on_iq(IQ) -> xmpp:make_error(IQ, xmpp:err_not_allowed()).

%% This hook is called everytime a new packet should be sent to a user
%% (receiver), no matter of a group (MUC) or direct chat. When the packet
%% contains a MAM result, we extend it with the unread element based on the
%% database state.
-spec on_filter_packet(stanza()) -> stanza().
on_filter_packet(#message{from = From, to = To,
                          sub_els = [#mam_result{sub_els = [#forwarded{
                            xml_els = [#xmlel{name = <<"message">>} = El]
                          }]}]} = Packet) ->
  %% Decode the original MAM message element again to extend it
  try xmpp:decode(El) of
  %% Group chat (MUC) messages look like this
  #message{type = groupchat} = Decoded ->
    MessageId = get_stanza_id_from_els(Decoded#message.sub_els),
    add_unread_to_mam_result(Packet, Decoded, MessageId, To, From);
  %% Single chat messages look a little bit different
  #message{type = normal, from = Conversation} = Decoded ->
    MessageId = get_stanza_id_from_els(Decoded#message.sub_els),
    add_unread_to_mam_result(Packet, Decoded, MessageId, From, Conversation);
  %% We ignore the decoded message due to the pattern matching above failed
  _ -> Packet
  %% The XML element decoding failed
  catch _:{xmpp_codec, Why} ->
    ?ERROR_MSG("[UR] Failed to decode raw element ~p from message: ~s",
               [El, xmpp:format_error(Why)]),
    Packet
  end;
on_filter_packet(Packet) -> Packet.

%% This function is a helper for the MAM result manipulation. We add the result
%% of the database lookup as a new +unread+ element to the resulting message
%% stanza which indicates the unread state of the message. The helper is used
%% by the +on_filter_packet+ hook for single and group chat messages.
-spec add_unread_to_mam_result(stanza(), message(), jid(), jid(),
                               non_neg_integer()) -> stanza().
add_unread_to_mam_result(#message{sub_els = [#mam_result{
                            sub_els = [#forwarded{} = Forwarded]
                          } = MamResult]} = Packet,
                         #message{sub_els = Els} = Decoded, MessageId,
                         #jid{lserver = LServer} = User,
                         #jid{} = Conversation) ->
  %% Check the database for the message unread state
  Mod = gen_mod:db_mod(LServer, ?MODULE),
  Unread = Mod:is_unread(LServer, bare_jid(User),
                         bare_jid(Conversation), MessageId),
  %% Replace the original MAM result with our extended version
  NewMessage = Decoded#message{sub_els = Els ++ [Unread]},
  NewForwarded = Forwarded#forwarded{xml_els = [xmpp:encode(NewMessage)]},
  NewMamResult = MamResult#mam_result{sub_els = [NewForwarded]},
  Packet#message{sub_els = [NewMamResult]};
%% Any non matching packet/parsed message combination will be passed through.
add_unread_to_mam_result(Packet, _, _, _, _) -> Packet.

%% This function writes a new row to the unread messages database in order
%% to persist the unread message.
-spec store(jid(), jid(), stanza()) -> stanza().
store(#jid{lserver = LServer} = User, #jid{} = Conversation, Packet) ->
  Mod = gen_mod:db_mod(LServer, ?MODULE),
  Mod:store(LServer, bare_jid(User), bare_jid(Conversation),
            get_stanza_id(Packet)),
  Packet.

%% This function deletes on or all unread message(s) of a user/conversation
%% combination. The database adapter takes care of the one/all handling.
-spec drop(jid(), jid(), binary(), iq()) -> iq().
drop(#jid{lserver = LServer} = User, #jid{} = Conversation, Id, IQ) ->
  Mod = gen_mod:db_mod(LServer, ?MODULE),
  Mod:drop(LServer, bare_jid(User), bare_jid(Conversation), Id),
  xmpp:make_iq_result(IQ).

%% Extract all relevant JIDs of all affiliated members. This will drop the
%% packet sender, and any admin users.
-spec affiliated_jids(#message{}) -> [jid()].
affiliated_jids(#message{from = Sender} = Packet) ->
  %% Convert all affiliated user JIDs to their bare
  %% representations for filtering
  BareJids = lists:map(fun(Jid) -> bare_jid(Jid) end,
                       xmpp:get_meta(Packet, users)),
  %% All the affiliated users of the room, except the packet sender
  WithoutSender = lists:delete(bare_jid(Sender), BareJids),
  %% Drop all admin users from the list
  WithoutAdmins = WithoutSender -- admin_jids(Sender#jid.server),
  %% Convert all bare JIDs back to full JIDs
  lists:map(fun(Jid) -> jid:decode(Jid) end, WithoutAdmins).

%% Fetch all configured administration user JIDs and convert them to their bare
%% JID representation for filtering.
-spec admin_jids(binary()) -> [binary()].
admin_jids(Server) ->
  Jids = mnesia:dirty_select(acl, [
   {{acl, {admin, Server}, {user, '$2'}}, [], ['$2']}
  ]),
  lists:map(fun(Raw) ->
    bare_jid(jid:make(erlang:insert_element(3, Raw, <<"">>)))
  end, Jids).

%% Extract all relevant users from the given MUC state (room).
-spec get_muc_users(#state{}) -> [jid()].
get_muc_users(StateData) ->
  dict:fold(
    fun(LJID, owner, Acc) -> [jid:make(LJID)|Acc];
       (LJID, member, Acc) -> [jid:make(LJID)|Acc];
       (LJID, {owner, _}, Acc) -> [jid:make(LJID)|Acc];
       (LJID, {member, _}, Acc) -> [jid:make(LJID)|Acc];
       (_, _, Acc) -> Acc
  end, [], StateData#state.affiliations).

%% This is a simple helper function to search and extract the stanza id from a
%% +stanza-id+ XML element (record version) out of a list of various records.
%% Just like them occur on the MAM result inside the inner message XML element.
-spec get_stanza_id_from_els([tuple()]) -> binary().
get_stanza_id_from_els(Els) ->
  case lists:keyfind(stanza_id, 1, Els) of
  #stanza_id{id = Id} -> Id;
  _ -> <<"0">>
  end.

%% Extract the stanza id from a message packet and convert it to a string.
-spec get_stanza_id(stanza()) -> integer().
get_stanza_id(#message{meta = #{stanza_id := ID}}) -> ID.

%% Convert the given JID (full, or bare) to a bare JID and encode it to a
%% string.
-spec bare_jid(jid()) -> binary().
bare_jid(#jid{} = Jid) -> jid:encode(jid:remove_resource(Jid)).

%% Allow IQ results to have multiple sub elements.
%% See: http://bit.ly/2KgmAQb
-spec make_iq_result_els(iq(), [xmpp_element() | xmlel() | undefined]) -> iq().
make_iq_result_els(#iq{from = From, to = To} = IQ, SubEls) ->
  IQ#iq{type = result, to = From, from = To, sub_els = SubEls}.

%% Some ejabberd custom module API fullfilments
-spec depends(binary(), gen_mod:opts()) -> [{module(), hard | soft}].
depends(_Host, _Opts) -> [{mod_mam, hard},
                          {mod_muc, hard}].

mod_opt_type(db_type) -> fun(T) -> ejabberd_config:v_db(?MODULE, T) end;
mod_opt_type(iqdisc) -> fun gen_iq_handler:check_type/1;
%% TODO: http://bit.ly/2LU3jto
%% mod_opt_type(_) -> [db_type, iqdisc].
mod_opt_type(_) -> [].
