```
Table member {
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

Table workspace {
  id uuid [primary key]
  name varchar [not null]
  description text
  platform varchar [not null] // ex: 'discord', 'web', 'slack'
  platform_id varchar         // guild_id, channel_id, etc.
  created_at timestamp
  updated_at timestamp
  active boolean
}

Table bookmark {
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

Table membership {
  id uuid [primary key]
  member_id uuid [not null]
  workspace_id uuid [not null]
  // UNIQUE (member_id, workspace_id)
}

Ref: bookmark.member_id > member.id
Ref: bookmark.workspace_id > workspace.id
Ref: membership.member_id > member.id
Ref: membership.workspace_id > workspace.id
```