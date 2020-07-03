## Archive Table

### Group Chat Message

Column     | Value
-----------|----------
username   | room1@conference.example.com
timestamp  | 1575302647077008
peer       | bot@example.com
bare_peer  | bot@example.com
xml        | `<message to='room1@conference.example.com' from='bot@example.com' type='groupchat' xmlns='jabber:client'><body>Hey there!</body></message>`
txt        | Hey there!
id         | 1172156
kind       | groupchat
nick       | Bot (1f258b6f-2455-4be2-b065-266572785f7c)
created_at | 2019-12-02 16:04:07.082938

### Direct Chat Message

Column     | Value
-----------|----------
username   | alice
timestamp  | 1586540725601772
peer       | bob@example.com
bare_peer  | bob@example.com
xml        | `<message xml:lang='en' to='bob@example.com' from='alice@example.com/22549429738924644497871331' id='cf28e873-a7c6-4c7d-917e-c1abce2e320b' xmlns='jabber:client'><body>Hey there!</body></message>`
txt        | Hey there!
id         | 1589637
kind       | chat
nick       |
created_at | 2020-04-10 17:45:25.606802
