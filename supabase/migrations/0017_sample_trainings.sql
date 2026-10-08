-- Sample trainings (DLT 1, 2, 3) so there is something to edit. Safe to re-run:
-- a course is only created if no course with that title exists yet.
-- Change, add or remove anything from the Training tab afterwards.
do $$
declare
  spec jsonb := '[
    {"title":"DLT 1 — Discipleship Leadership Training","modules":[
      {"title":"Knowing Christ","topics":["Called to follow","Abiding in Christ","The gospel story","Assurance of salvation"]},
      {"title":"Spiritual disciplines","topics":["Prayer","Bible reading and study","Fasting and solitude","Worship as a lifestyle"]},
      {"title":"Life in community","topics":["Why the church matters","Fellowship and accountability","Serving with your gifts","Sharing your faith"]}]},
    {"title":"DLT 2 — Discipleship Leadership Training","modules":[
      {"title":"Character of a leader","topics":["Integrity and humility","Servant leadership","Handling conflict","Stewardship of time"]},
      {"title":"Leading a small group","topics":["Preparing a lesson","Facilitating discussion","Praying with and for people","Caring for members"]},
      {"title":"Mentoring others","topics":["What it means to make disciples","Walking with a younger believer","Giving feedback with grace"]}]},
    {"title":"DLT 3 — Discipleship Leadership Training","modules":[
      {"title":"Vision and mission","topics":["Hearing God''s vision","Casting vision to a team","Setting goals"]},
      {"title":"Building teams","topics":["Recruiting and releasing","Delegation and trust","Building a healthy team culture"]},
      {"title":"Multiplication","topics":["Training trainers","Planting new groups","Sustaining the movement","Finishing well"]}]}
  ]'::jsonb;
  c jsonb; m jsonb; tp text;
  cid uuid; mid uuid; mpos int; tpos int;
begin
  for c in select * from jsonb_array_elements(spec) loop
    if exists (select 1 from public.courses where title = c->>'title') then continue; end if;
    insert into public.courses (title, track, total_modules)
      values (c->>'title', 'Leadership', jsonb_array_length(c->'modules')) returning id into cid;
    mpos := 0;
    for m in select * from jsonb_array_elements(c->'modules') loop
      mpos := mpos + 1;
      insert into public.course_modules (course_id, position, title) values (cid, mpos, m->>'title') returning id into mid;
      tpos := 0;
      for tp in select jsonb_array_elements_text(m->'topics') loop
        tpos := tpos + 1;
        insert into public.course_topics (course_id, module_id, position, title) values (cid, mid, tpos, tp);
      end loop;
    end loop;
  end loop;
end $$;
