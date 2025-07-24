```
Table members {
  id uuid [primary key]
  name varchar
  username varchar
  email varchar
  discord_user_id bigint [unique, not null]
  password_hash varchar
  created_at timestamp
  updated_at timestamp
  active boolean
}

Table workspaces {
  id uuid [primary key]
  name varchar [not null]
  description text
  platform varchar [not null] // ex: 'discord', 'web', 'slack'
  platform_id varchar         // guild_id, channel_id, etc.
  created_at timestamp
  updated_at timestamp
  active boolean
}

Table bookmarks {
  id uuid [primary key]
  workspace_id uuid [not null]
  member_id uuid [not null]
  url varchar [not null]
  url_hash_id char(64) [not null]
  title varchar
  description text
  embedding vector
  created_at timestamp
  updated_at timestamp
  visible boolean
}

Table memberships {
  id uuid [primary key]
  member_id uuid [not null]
  workspace_id uuid [not null]
  // UNIQUE (member_id, workspace_id)
}

Ref: bookmarks.member_id > members.id
Ref: bookmarks.workspace_id > workspaces.id
Ref: memberships.member_id > members.id
Ref: memberships.workspace_id > workspaces.id
```