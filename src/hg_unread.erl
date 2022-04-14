%% Created automatically by XML generator (fxml_gen.erl)
%% Source: xmpp_codec.spec

-module(hg_unread).

-compile(export_all).

do_decode(<<"unread">>, <<"urn:xmpp:unread">>, El,
    Opts) ->
    decode_ur_unread(<<"urn:xmpp:unread">>, Opts, El);
do_decode(<<"unread-message">>, <<"urn:xmpp:unread">>,
    El, Opts) ->
    decode_ur_unread_message(<<"urn:xmpp:unread">>, Opts,
           El);
do_decode(<<"unread-messages">>, <<"urn:xmpp:unread">>,
    El, Opts) ->
    decode_ur_unread_messages(<<"urn:xmpp:unread">>, Opts,
            El);
do_decode(<<"query">>, <<"urn:xmpp:unread">>, El,
    Opts) ->
    decode_ur_query(<<"urn:xmpp:unread">>, Opts, El);
do_decode(<<"ack">>, <<"urn:xmpp:unread">>, El, Opts) ->
    decode_ur_ack(<<"urn:xmpp:unread">>, Opts, El);
do_decode(Name, <<>>, _, _) ->
    erlang:error({xmpp_codec, {missing_tag_xmlns, Name}});
do_decode(Name, XMLNS, _, _) ->
    erlang:error({xmpp_codec, {unknown_tag, Name, XMLNS}}).

tags() ->
    [{<<"unread">>, <<"urn:xmpp:unread">>},
     {<<"unread-message">>, <<"urn:xmpp:unread">>},
     {<<"unread-messages">>, <<"urn:xmpp:unread">>},
     {<<"query">>, <<"urn:xmpp:unread">>},
     {<<"ack">>, <<"urn:xmpp:unread">>}].

do_encode({ur_ack, _, _} = Ack, TopXMLNS) ->
    encode_ur_ack(Ack, TopXMLNS);
do_encode({ur_query, _} = Query, TopXMLNS) ->
    encode_ur_query(Query, TopXMLNS);
do_encode({ur_unread_messages, _, _} = Unread_messages,
    TopXMLNS) ->
    encode_ur_unread_messages(Unread_messages, TopXMLNS);
do_encode({ur_unread_message, _, _} = Unread_message,
    TopXMLNS) ->
    encode_ur_unread_message(Unread_message, TopXMLNS);
do_encode({ur_unread, _} = Unread, TopXMLNS) ->
    encode_ur_unread(Unread, TopXMLNS).

do_get_name({ur_ack, _, _}) -> <<"ack">>;
do_get_name({ur_query, _}) -> <<"query">>;
do_get_name({ur_unread, _}) -> <<"unread">>;
do_get_name({ur_unread_message, _, _}) ->
    <<"unread-message">>;
do_get_name({ur_unread_messages, _, _}) ->
    <<"unread-messages">>.

do_get_ns({ur_ack, _, _}) -> <<"urn:xmpp:unread">>;
do_get_ns({ur_query, _}) -> <<"urn:xmpp:unread">>;
do_get_ns({ur_unread, _}) -> <<"urn:xmpp:unread">>;
do_get_ns({ur_unread_message, _, _}) ->
    <<"urn:xmpp:unread">>;
do_get_ns({ur_unread_messages, _, _}) ->
    <<"urn:xmpp:unread">>.

pp(ur_ack, 2) -> [jid, id];
pp(ur_query, 1) -> [jid];
pp(ur_unread_messages, 2) -> [jid, amount];
pp(ur_unread_message, 2) -> [jid, id];
pp(ur_unread, 1) -> [state];
pp(_, _) -> no.

records() ->
    [{ur_ack, 2}, {ur_query, 1}, {ur_unread_messages, 2},
     {ur_unread_message, 2}, {ur_unread, 1}].

dec_int(Val, Min, Max) ->
    case erlang:binary_to_integer(Val) of
      Int when Int =< Max, Min == infinity -> Int;
      Int when Int =< Max, Int >= Min -> Int
    end.

enc_int(Int) -> erlang:integer_to_binary(Int).

decode_ur_unread(__TopXMLNS, __Opts,
     {xmlel, <<"unread">>, _attrs, _els}) ->
    State = decode_ur_unread_attrs(__TopXMLNS, _attrs,
           undefined),
    {ur_unread, State}.

decode_ur_unread_attrs(__TopXMLNS,
           [{<<"state">>, _val} | _attrs], _State) ->
    decode_ur_unread_attrs(__TopXMLNS, _attrs, _val);
decode_ur_unread_attrs(__TopXMLNS, [_ | _attrs],
           State) ->
    decode_ur_unread_attrs(__TopXMLNS, _attrs, State);
decode_ur_unread_attrs(__TopXMLNS, [], State) ->
    decode_ur_unread_attr_state(__TopXMLNS, State).

encode_ur_unread({ur_unread, State}, __TopXMLNS) ->
    __NewTopXMLNS =
  xmpp_codec:choose_top_xmlns(<<"urn:xmpp:unread">>, [],
            __TopXMLNS),
    _els = [],
    _attrs = encode_ur_unread_attr_state(State,
           xmpp_codec:enc_xmlns_attrs(__NewTopXMLNS,
                    __TopXMLNS)),
    {xmlel, <<"unread">>, _attrs, _els}.

decode_ur_unread_attr_state(__TopXMLNS, undefined) ->
    erlang:error({xmpp_codec,
      {missing_attr, <<"state">>, <<"unread">>, __TopXMLNS}});
decode_ur_unread_attr_state(__TopXMLNS, _val) -> _val.

encode_ur_unread_attr_state(_val, _acc) ->
    [{<<"state">>, _val} | _acc].

decode_ur_unread_message(__TopXMLNS, __Opts,
       {xmlel, <<"unread-message">>, _attrs, _els}) ->
    {Jid, Id} = decode_ur_unread_message_attrs(__TopXMLNS,
                 _attrs, undefined, undefined),
    {ur_unread_message, Jid, Id, ConversationId}.

decode_ur_unread_message_attrs(__TopXMLNS,
             [{<<"jid">>, _val} | _attrs], _Jid, Id) ->
    decode_ur_unread_message_attrs(__TopXMLNS, _attrs, _val,
           Id);
decode_ur_unread_message_attrs(__TopXMLNS,
             [{<<"id">>, _val} | _attrs], Jid, _Id) ->
    decode_ur_unread_message_attrs(__TopXMLNS, _attrs, Jid,
           _val);
decode_ur_unread_message_attrs(__TopXMLNS, [_ | _attrs],
             Jid, Id) ->
    decode_ur_unread_message_attrs(__TopXMLNS, _attrs, Jid,
           Id);
decode_ur_unread_message_attrs(__TopXMLNS, [], Jid,
             Id) ->
    {decode_ur_unread_message_attr_jid(__TopXMLNS, Jid),
     decode_ur_unread_message_attr_id(__TopXMLNS, Id)}.

encode_ur_unread_message({ur_unread_message, Jid, Id, ConversationId},
       __TopXMLNS) ->
    __NewTopXMLNS =
  xmpp_codec:choose_top_xmlns(<<"urn:xmpp:unread">>, [],
            __TopXMLNS),
    _els = [],
    _attrs = encode_ur_unread_message_attr_id(Id,
                encode_ur_unread_message_attr_jid(Jid,
                    xmpp_codec:enc_xmlns_attrs(__NewTopXMLNS,
                             __TopXMLNS))),
    {xmlel, <<"unread-message">>, _attrs, _els}.

decode_ur_unread_message_attr_jid(__TopXMLNS,
          undefined) ->
    erlang:error({xmpp_codec,
      {missing_attr, <<"jid">>, <<"unread-message">>,
       __TopXMLNS}});
decode_ur_unread_message_attr_jid(__TopXMLNS, _val) ->
    _val.

encode_ur_unread_message_attr_jid(_val, _acc) ->
    [{<<"jid">>, _val} | _acc].

decode_ur_unread_message_attr_id(__TopXMLNS,
         undefined) ->
    erlang:error({xmpp_codec,
      {missing_attr, <<"id">>, <<"unread-message">>,
       __TopXMLNS}});
decode_ur_unread_message_attr_id(__TopXMLNS, _val) ->
    case catch dec_int(_val, 0, infinity) of
      {'EXIT', _} ->
    erlang:error({xmpp_codec,
      {bad_attr_value, <<"id">>, <<"unread-message">>,
       __TopXMLNS}});
      _res -> _res
    end.

encode_ur_unread_message_attr_id(_val, _acc) ->
    [{<<"id">>, enc_int(_val)} | _acc].

decode_ur_unread_messages(__TopXMLNS, __Opts,
        {xmlel, <<"unread-messages">>, _attrs, _els}) ->
    {Jid, Amount} =
  decode_ur_unread_messages_attrs(__TopXMLNS, _attrs,
          undefined, undefined),
    {ur_unread_messages, Jid, Amount}.

decode_ur_unread_messages_attrs(__TopXMLNS,
        [{<<"jid">>, _val} | _attrs], _Jid, Amount) ->
    decode_ur_unread_messages_attrs(__TopXMLNS, _attrs,
            _val, Amount);
decode_ur_unread_messages_attrs(__TopXMLNS,
        [{<<"amount">>, _val} | _attrs], Jid,
        _Amount) ->
    decode_ur_unread_messages_attrs(__TopXMLNS, _attrs, Jid,
            _val);
decode_ur_unread_messages_attrs(__TopXMLNS,
        [_ | _attrs], Jid, Amount) ->
    decode_ur_unread_messages_attrs(__TopXMLNS, _attrs, Jid,
            Amount);
decode_ur_unread_messages_attrs(__TopXMLNS, [], Jid,
        Amount) ->
    {decode_ur_unread_messages_attr_jid(__TopXMLNS, Jid),
     decode_ur_unread_messages_attr_amount(__TopXMLNS,
             Amount)}.

encode_ur_unread_messages({ur_unread_messages, Jid,
         Amount},
        __TopXMLNS) ->
    __NewTopXMLNS =
  xmpp_codec:choose_top_xmlns(<<"urn:xmpp:unread">>, [],
            __TopXMLNS),
    _els = [],
    _attrs = encode_ur_unread_messages_attr_amount(Amount,
               encode_ur_unread_messages_attr_jid(Jid,
                          xmpp_codec:enc_xmlns_attrs(__NewTopXMLNS,
                             __TopXMLNS))),
    {xmlel, <<"unread-messages">>, _attrs, _els}.

decode_ur_unread_messages_attr_jid(__TopXMLNS,
           undefined) ->
    erlang:error({xmpp_codec,
      {missing_attr, <<"jid">>, <<"unread-messages">>,
       __TopXMLNS}});
decode_ur_unread_messages_attr_jid(__TopXMLNS, _val) ->
    _val.

encode_ur_unread_messages_attr_jid(_val, _acc) ->
    [{<<"jid">>, _val} | _acc].

decode_ur_unread_messages_attr_amount(__TopXMLNS,
              undefined) ->
    erlang:error({xmpp_codec,
      {missing_attr, <<"amount">>, <<"unread-messages">>,
       __TopXMLNS}});
decode_ur_unread_messages_attr_amount(__TopXMLNS,
              _val) ->
    case catch dec_int(_val, 0, infinity) of
      {'EXIT', _} ->
    erlang:error({xmpp_codec,
      {bad_attr_value, <<"amount">>, <<"unread-messages">>,
       __TopXMLNS}});
      _res -> _res
    end.

encode_ur_unread_messages_attr_amount(_val, _acc) ->
    [{<<"amount">>, enc_int(_val)} | _acc].

decode_ur_query(__TopXMLNS, __Opts,
    {xmlel, <<"query">>, _attrs, _els}) ->
    Jid = decode_ur_query_attrs(__TopXMLNS, _attrs,
        undefined),
    {ur_query, Jid}.

decode_ur_query_attrs(__TopXMLNS,
          [{<<"jid">>, _val} | _attrs], _Jid) ->
    decode_ur_query_attrs(__TopXMLNS, _attrs, _val);
decode_ur_query_attrs(__TopXMLNS, [_ | _attrs], Jid) ->
    decode_ur_query_attrs(__TopXMLNS, _attrs, Jid);
decode_ur_query_attrs(__TopXMLNS, [], Jid) ->
    decode_ur_query_attr_jid(__TopXMLNS, Jid).

encode_ur_query({ur_query, Jid}, __TopXMLNS) ->
    __NewTopXMLNS =
  xmpp_codec:choose_top_xmlns(<<"urn:xmpp:unread">>, [],
            __TopXMLNS),
    _els = [],
    _attrs = encode_ur_query_attr_jid(Jid,
              xmpp_codec:enc_xmlns_attrs(__NewTopXMLNS,
                 __TopXMLNS)),
    {xmlel, <<"query">>, _attrs, _els}.

decode_ur_query_attr_jid(__TopXMLNS, undefined) ->
    undefined;
decode_ur_query_attr_jid(__TopXMLNS, _val) ->
    case catch jid:decode(_val) of
      {'EXIT', _} ->
    erlang:error({xmpp_codec,
      {bad_attr_value, <<"jid">>, <<"query">>, __TopXMLNS}});
      _res -> _res
    end.

encode_ur_query_attr_jid(undefined, _acc) -> _acc;
encode_ur_query_attr_jid(_val, _acc) ->
    [{<<"jid">>, jid:encode(_val)} | _acc].

decode_ur_ack(__TopXMLNS, __Opts,
        {xmlel, <<"ack">>, _attrs, _els}) ->
    {Jid, Id} = decode_ur_ack_attrs(__TopXMLNS, _attrs,
            undefined, undefined),
    {ur_ack, Jid, Id}.

decode_ur_ack_attrs(__TopXMLNS,
        [{<<"jid">>, _val} | _attrs], _Jid, Id) ->
    decode_ur_ack_attrs(__TopXMLNS, _attrs, _val, Id);
decode_ur_ack_attrs(__TopXMLNS,
        [{<<"id">>, _val} | _attrs], Jid, _Id) ->
    decode_ur_ack_attrs(__TopXMLNS, _attrs, Jid, _val);
decode_ur_ack_attrs(__TopXMLNS, [_ | _attrs], Jid,
        Id) ->
    decode_ur_ack_attrs(__TopXMLNS, _attrs, Jid, Id);
decode_ur_ack_attrs(__TopXMLNS, [], Jid, Id) ->
    {decode_ur_ack_attr_jid(__TopXMLNS, Jid),
     decode_ur_ack_attr_id(__TopXMLNS, Id)}.

encode_ur_ack({ur_ack, Jid, Id}, __TopXMLNS) ->
    __NewTopXMLNS =
  xmpp_codec:choose_top_xmlns(<<"urn:xmpp:unread">>, [],
            __TopXMLNS),
    _els = [],
    _attrs = encode_ur_ack_attr_id(Id,
           encode_ur_ack_attr_jid(Jid,
                xmpp_codec:enc_xmlns_attrs(__NewTopXMLNS,
                         __TopXMLNS))),
    {xmlel, <<"ack">>, _attrs, _els}.

decode_ur_ack_attr_jid(__TopXMLNS, undefined) ->
    erlang:error({xmpp_codec,
      {missing_attr, <<"jid">>, <<"ack">>, __TopXMLNS}});
decode_ur_ack_attr_jid(__TopXMLNS, _val) ->
    case catch jid:decode(_val) of
      {'EXIT', _} ->
    erlang:error({xmpp_codec,
      {bad_attr_value, <<"jid">>, <<"ack">>, __TopXMLNS}});
      _res -> _res
    end.

encode_ur_ack_attr_jid(_val, _acc) ->
    [{<<"jid">>, jid:encode(_val)} | _acc].

decode_ur_ack_attr_id(__TopXMLNS, undefined) ->
    erlang:error({xmpp_codec,
      {missing_attr, <<"id">>, <<"ack">>, __TopXMLNS}});
decode_ur_ack_attr_id(__TopXMLNS, _val) -> _val.

encode_ur_ack_attr_id(_val, _acc) ->
    [{<<"id">>, _val} | _acc].
