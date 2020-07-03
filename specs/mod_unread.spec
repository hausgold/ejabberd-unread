%% See: https://bit.ly/2ZiPHgv
%% See: https://bit.ly/38K4uE1
%% <ack xmlns="urn:xmpp:unread" id="all" jid="test@conference.example.com" />
-xml(ur_ack,
     #elem{name = <<"ack">>,
           xmlns = <<"urn:xmpp:unread">>,
           module = hg_unread,
           result = {ur_ack, '$jid', '$id'},
           attrs = [#attr{name = <<"jid">>,
                          required = true,
                          dec = {jid, decode, []},
                          enc = {jid, encode, []}},
                    #attr{name = <<"id">>,
                          required = true}]}).

%% See: https://bit.ly/2CoXTme
%% See: https://bit.ly/2CoXTme
%% <query xmlns="urn:xmpp:unread" jid="muc@conference.example.com" />
-xml(ur_query,
     #elem{name = <<"query">>,
           xmlns = <<"urn:xmpp:unread">>,
           module = hg_unread,
           result = {ur_query, '$jid'},
           attrs = [#attr{name = <<"jid">>,
                          required = false,
                          dec = {jid, decode, []},
                          enc = {jid, encode, []}}]}).

%% See: https://bit.ly/2CoXTme
%% <unread-messages jid="room42@conference.example.com" amount="5">
-xml(ur_unread_messages,
     #elem{name = <<"unread-messages">>,
           xmlns = <<"urn:xmpp:unread">>,
           module = hg_unread,
           result = {ur_unread_messages, '$jid', '$amount'},
           attrs = [#attr{name = <<"jid">>,
                          required = true},
                    #attr{name = <<"amount">>,
                          required = true,
                          dec = {dec_int, [0, infinity]},
                          enc = {enc_int, []}}]}).

%% See: https://bit.ly/2AS3v8i
%% <unread-message jid="john@example.com" id="1568719009428999">
-xml(ur_unread_message,
     #elem{name = <<"unread-message">>,
           xmlns = <<"urn:xmpp:unread">>,
           module = hg_unread,
           result = {ur_unread_message, '$jid', '$id'},
           attrs = [#attr{name = <<"jid">>,
                          required = true},
                    #attr{name = <<"id">>,
                          required = true,
                          dec = {dec_int, [0, infinity]},
                          enc = {enc_int, []}}]}).

%% See: https://bit.ly/2ZWR97b
%% <unread xmlns='urn:xmpp:unread' state='true/false' />
-xml(ur_unread,
     #elem{name = <<"unread">>,
           xmlns = <<"urn:xmpp:unread">>,
           module = hg_unread,
           result = {ur_unread, '$state'},
           attrs = [#attr{name = <<"state">>,
                          required = true}]}).

%% vim: set filetype=erlang tabstop=2:
