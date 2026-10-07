-- Per-poster layout options set by admins: how the poster image sits in its
-- card and where/how the title text is placed so it stays readable.
alter table public.banners
  add column if not exists image_fit text not null default 'contain'
    check (image_fit in ('contain','cover')),
  add column if not exists image_position text not null default 'center'
    check (image_position in ('center','top','bottom','left','right')),
  add column if not exists text_position text not null default 'bottom'
    check (text_position in ('top','center','bottom')),
  add column if not exists text_align text not null default 'left'
    check (text_align in ('left','center','right'));

-- Real dates so posters sort themselves and move to the archive once the
-- event is over. event_date_label stays as the text shown on the poster.
alter table public.banners
  add column if not exists event_date date,
  add column if not exists event_end_date date;

-- Free positioning of the poster image inside its card (percent / percent / zoom %).
alter table public.banners
  add column if not exists image_x integer not null default 50 check (image_x between 0 and 100),
  add column if not exists image_y integer not null default 50 check (image_y between 0 and 100),
  add column if not exists image_zoom integer not null default 100 check (image_zoom between 100 and 300);
