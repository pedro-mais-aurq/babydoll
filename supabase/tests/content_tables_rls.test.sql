begin;

select plan(24);

insert into public.images (id, name, storage_path)
values (
  '11111111-1111-1111-1111-111111111111',
  'test image',
  'tests/image.webp'
);

insert into public.texts (id, content, author, sent_at)
values (
  '22222222-2222-2222-2222-222222222222',
  'test text',
  'test author',
  '2026-09-01T12:00:00Z'
);

insert into public.videos (id, name, storage_path)
values (
  '33333333-3333-3333-3333-333333333333',
  'test video',
  'tests/video.mp4'
);

insert into public.songs (id, name, spotify_url)
values (
  '44444444-4444-4444-4444-444444444444',
  'test song',
  'https://open.spotify.com/track/test'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.images'::regclass),
  'images has RLS enabled'
);
select ok(has_table_privilege('anon', 'public.images', 'select'), 'anon can select images');
select ok(not has_table_privilege('anon', 'public.images', 'insert'), 'anon cannot insert images');
select ok(not has_table_privilege('anon', 'public.images', 'update'), 'anon cannot update images');
select ok(not has_table_privilege('anon', 'public.images', 'delete'), 'anon cannot delete images');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.texts'::regclass),
  'texts has RLS enabled'
);
select ok(has_table_privilege('anon', 'public.texts', 'select'), 'anon can select texts');
select ok(not has_table_privilege('anon', 'public.texts', 'insert'), 'anon cannot insert texts');
select ok(not has_table_privilege('anon', 'public.texts', 'update'), 'anon cannot update texts');
select ok(not has_table_privilege('anon', 'public.texts', 'delete'), 'anon cannot delete texts');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.videos'::regclass),
  'videos has RLS enabled'
);
select ok(has_table_privilege('anon', 'public.videos', 'select'), 'anon can select videos');
select ok(not has_table_privilege('anon', 'public.videos', 'insert'), 'anon cannot insert videos');
select ok(not has_table_privilege('anon', 'public.videos', 'update'), 'anon cannot update videos');
select ok(not has_table_privilege('anon', 'public.videos', 'delete'), 'anon cannot delete videos');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.songs'::regclass),
  'songs has RLS enabled'
);
select ok(has_table_privilege('anon', 'public.songs', 'select'), 'anon can select songs');
select ok(not has_table_privilege('anon', 'public.songs', 'insert'), 'anon cannot insert songs');
select ok(not has_table_privilege('anon', 'public.songs', 'update'), 'anon cannot update songs');
select ok(not has_table_privilege('anon', 'public.songs', 'delete'), 'anon cannot delete songs');

set local role anon;

select is((select count(*)::integer from public.images), 1, 'anon reads images');
select is((select count(*)::integer from public.texts), 1, 'anon reads texts');
select is((select count(*)::integer from public.videos), 1, 'anon reads videos');
select is((select count(*)::integer from public.songs), 1, 'anon reads songs');

select * from finish();

rollback;
