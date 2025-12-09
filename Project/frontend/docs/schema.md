| table_name         | column_name          | data_type                   | is_nullable | column_default                        |
| ------------------ | -------------------- | --------------------------- | ----------- | ------------------------------------- |
| attachments        | id                   | bigint                      | NO          | null                                  |
| attachments        | message_id           | bigint                      | NO          | null                                  |
| attachments        | file_name            | text                        | NO          | null                                  |
| attachments        | file_url             | text                        | NO          | null                                  |
| attachments        | file_type            | text                        | YES         | null                                  |
| attachments        | file_size            | bigint                      | YES         | null                                  |
| attachments        | created_at           | timestamp without time zone | YES         | now()                                 |
| message_recipients | id                   | bigint                      | NO          | null                                  |
| message_recipients | message_id           | bigint                      | NO          | null                                  |
| message_recipients | recipient_id         | uuid                        | NO          | null                                  |
| message_recipients | status               | text                        | YES         | '未読'::text                            |
| message_recipients | read_at              | timestamp without time zone | YES         | null                                  |
| message_recipients | created_at           | timestamp without time zone | YES         | now()                                 |
| messages           | id                   | bigint                      | NO          | nextval('messages_id_seq'::regclass)  |
| messages           | sender_id            | text                        | NO          | null                                  |
| messages           | recipient_id         | text                        | NO          | null                                  |
| messages           | title                | text                        | NO          | null                                  |
| messages           | content              | text                        | NO          | null                                  |
| messages           | created_at           | timestamp without time zone | YES         | now()                                 |
| messages           | status               | text                        | YES         | '未読'::text                            |
| messages           | attachment_url       | text                        | YES         | null                                  |
| messages           | is_complex           | boolean                     | NO          | false                                 |
| messages           | require_confirmation | boolean                     | NO          | false                                 |
| messages           | read_at              | timestamp without time zone | YES         | null                                  |
| messages           | parent_id            | bigint                      | YES         | null                                  |
| messages           | priority             | text                        | YES         | 'normal'::text                        |
| messages           | updated_at           | timestamp without time zone | YES         | now()                                 |
| reminders          | id                   | bigint                      | NO          | nextval('reminders_id_seq'::regclass) |
| reminders          | message_id           | bigint                      | NO          | null                                  |
| reminders          | student_id           | text                        | NO          | null                                  |
| reminders          | teacher_id           | text                        | NO          | null                                  |
| reminders          | reminder_datetime    | timestamp with time zone    | NO          | null                                  |
| reminders          | remind_on_no_reply   | boolean                     | YES         | false                                 |
| reminders          | memo                 | text                        | YES         | null                                  |
| reminders          | is_sent              | boolean                     | NO          | false                                 |
| reminders          | created_at           | timestamp with time zone    | NO          | now()                                 |
| reminders          | sent_at              | timestamp with time zone    | YES         | null                                  |
| system_settings    | id                   | bigint                      | NO          | null                                  |
| system_settings    | setting_key          | text                        | NO          | null                                  |
| system_settings    | setting_value        | text                        | YES         | null                                  |
| system_settings    | description          | text                        | YES         | null                                  |
| system_settings    | created_at           | timestamp without time zone | YES         | now()                                 |
| system_settings    | updated_at           | timestamp without time zone | YES         | now()                                 |
| user_settings      | id                   | bigint                      | NO          | null                                  |
| user_settings      | user_id              | uuid                        | NO          | null                                  |
| user_settings      | language             | text                        | YES         | 'jp'::text                            |
| user_settings      | notification_enabled | boolean                     | YES         | true                                  |
| user_settings      | reminder_frequency   | text                        | YES         | 'daily'::text                         |
| user_settings      | created_at           | timestamp without time zone | YES         | now()                                 |
| user_settings      | updated_at           | timestamp without time zone | YES         | now()                                 |
| users              | id                   | uuid                        | NO          | uuid_generate_v4()                    |
| users              | username             | text                        | NO          | null                                  |
| users              | email                | text                        | NO          | null                                  |
| users              | password             | text                        | NO          | null                                  |
| users              | role                 | text                        | NO          | null                                  |
| users              | created_at           | timestamp without time zone | YES         | now()                                 |
| users              | first_name           | text                        | YES         | null                                  |
| users              | last_name            | text                        | YES         | null                                  |
| users              | class                | text                        | YES         | null                                  |
| users              | phone                | text                        | YES         | null                                  |
| users              | avatar_url           | text                        | YES         | null                                  |
| users              | is_active            | boolean                     | YES         | true                                  |
| users              | last_login           | timestamp without time zone | YES         | null                                  |
| users              | updated_at           | timestamp without time zone | YES         | now()                                 |
| users              | user_code            | text                        | YES         | null                                  |
| words              | id                   | bigint                      | NO          | nextval('words_id_seq'::regclass)     |
| words              | word                 | text                        | YES         | null                                  |
| words              | meaning              | text                        | YES         | null                                  |
| words              | created_at           | timestamp without time zone | YES         | now()                                 |