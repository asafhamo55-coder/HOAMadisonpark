-- ============================================================
-- 014 — Seed system letter templates and default
--       violation categories for every existing tenant
-- ============================================================
-- Stream E — Tenant Configuration, Branding & Knowledge Base
--
-- A future tenant created via the onboarding wizard (Stream C)
-- will get these same defaults at signup time. This migration
-- back-fills them for any tenant that already exists at the
-- moment 014 is applied (i.e. madison-park).
--
-- All templates use double-curly merge fields, e.g.
-- {{property.address}}, {{resident.first_name}}.
--
-- Default fines come from Madison Park's existing schedule per
-- DECISIONS.md (C.2: "use Madison Park's existing schedule as
-- the seed default").
-- ============================================================

-- ============================================================
-- 0. Seed catalog (CTEs reused per tenant)
-- ============================================================
do $$
declare
  t record;
  tpl record;
  cat record;
  warning_id uuid;
  notice_id  uuid;
  fine_id    uuid;
begin
  for t in
    select id from public.tenants where deleted_at is null
  loop
    -- ====================================================
    -- Letter templates (idempotent on (tenant_id, key))
    -- ====================================================
    for tpl in
      select * from (values
        ('welcome',
         'Welcome — New Resident',
         'Welcomes a new resident to the community on first move-in or sign-up.',
         'email',
         'Welcome to {{tenant.name}}',
         '<p>Hi {{resident.first_name}},</p>'
         || '<p>Welcome to <strong>{{tenant.name}}</strong>. We''re glad you''re here at {{property.address}}.</p>'
         || '<p>Your community portal lives at {{tenant.portal_url}} — log in any time to view announcements, pay dues, submit requests, and review the governing documents.</p>'
         || '<p>If you have any questions, reply to this email or reach the board at {{tenant.contact_email}}.</p>'
         || '<p>— The {{tenant.name}} Board</p>',
         jsonb_build_array(
           'tenant.name', 'tenant.portal_url', 'tenant.contact_email',
           'resident.first_name', 'resident.last_name',
           'property.address'
         )
        ),
        ('courtesy_notice',
         'Courtesy Notice — Friendly Reminder',
         'A pre-violation friendly nudge before any formal action is taken.',
         'letter',
         'Friendly Reminder — {{violation.category_name}}',
         '<p>Dear {{resident.first_name}} {{resident.last_name}},</p>'
         || '<p>This is a friendly reminder regarding {{violation.category_name}} at {{property.address}}.'
         || ' We noticed: <em>{{violation.description}}</em>.</p>'
         || '<p>This is <strong>not</strong> a formal violation, just a heads-up so you can address it before any further action is needed.'
         || ' Please correct the issue by {{violation.cure_by_date}}.</p>'
         || '<p>If you''ve already addressed this or believe we made a mistake, please reply to this notice.</p>'
         || '<p>Thank you,<br/>{{tenant.name}} Board</p>',
         jsonb_build_array(
           'tenant.name',
           'resident.first_name', 'resident.last_name',
           'property.address',
           'violation.category_name', 'violation.description', 'violation.cure_by_date'
         )
        ),
        ('first_violation',
         '1st Violation Notice',
         'First formal violation notice. No fine yet — sets the cure-by date.',
         'letter',
         'Notice of Violation — {{violation.category_name}}',
         '<p>Dear {{resident.first_name}} {{resident.last_name}},</p>'
         || '<p>This is a formal <strong>1st Notice of Violation</strong> for {{property.address}}.</p>'
         || '<p><strong>Violation:</strong> {{violation.category_name}} — {{violation.description}}</p>'
         || '<p><strong>Cure by:</strong> {{violation.cure_by_date}}</p>'
         || '<p>Please correct the issue by the cure-by date above. Failure to do so may result in a fine in accordance with our governing documents.</p>'
         || '<p>If you believe this notice was issued in error or you need additional time, you may request a hearing within 14 days by replying to this letter.</p>'
         || '<p>Sincerely,<br/>{{tenant.name}} Board</p>',
         jsonb_build_array(
           'tenant.name',
           'resident.first_name', 'resident.last_name',
           'property.address',
           'violation.category_name', 'violation.description', 'violation.cure_by_date'
         )
        ),
        ('second_violation',
         '2nd Violation Notice (with Fine)',
         'Second formal notice when the first was not cured. Includes the assessed fine.',
         'letter',
         '2nd Notice — {{violation.category_name}} (Fine Assessed)',
         '<p>Dear {{resident.first_name}} {{resident.last_name}},</p>'
         || '<p>This is a <strong>2nd Notice of Violation</strong> for {{property.address}}.'
         || ' The 1st notice issued on {{violation.first_notice_date}} was not cured.</p>'
         || '<p><strong>Violation:</strong> {{violation.category_name}} — {{violation.description}}</p>'
         || '<p><strong>Fine assessed:</strong> {{violation.fine_amount}}</p>'
         || '<p>The fine is now due. Please remit payment within 30 days.</p>'
         || '<p>You retain the right to request a hearing before the board within 14 days of this notice.</p>'
         || '<p>Sincerely,<br/>{{tenant.name}} Board</p>',
         jsonb_build_array(
           'tenant.name',
           'resident.first_name', 'resident.last_name',
           'property.address',
           'violation.category_name', 'violation.description',
           'violation.first_notice_date', 'violation.fine_amount'
         )
        ),
        ('final_violation',
         'Final Violation Notice (Lien Warning)',
         'Final notice — failure to cure may result in a lien against the property.',
         'letter',
         'FINAL NOTICE — {{violation.category_name}}',
         '<p>Dear {{resident.first_name}} {{resident.last_name}},</p>'
         || '<p>This is your <strong>FINAL NOTICE</strong> of violation for {{property.address}}.</p>'
         || '<p><strong>Violation:</strong> {{violation.category_name}} — {{violation.description}}</p>'
         || '<p><strong>Total amount due:</strong> {{violation.total_amount}}</p>'
         || '<p>Failure to cure this violation and pay all outstanding amounts within 30 days may result in legal action, including but not limited to a lien being placed against your property.</p>'
         || '<p>To resolve this matter immediately, contact us at {{tenant.contact_email}}.</p>'
         || '<p>Sincerely,<br/>{{tenant.name}} Board</p>',
         jsonb_build_array(
           'tenant.name', 'tenant.contact_email',
           'resident.first_name', 'resident.last_name',
           'property.address',
           'violation.category_name', 'violation.description', 'violation.total_amount'
         )
        ),
        ('hearing_invite',
         'Hearing Invitation',
         'Invitation to a violation hearing in front of the board.',
         'email',
         'Hearing Notice — {{hearing.date}}',
         '<p>Dear {{resident.first_name}} {{resident.last_name}},</p>'
         || '<p>You are invited to a hearing before the {{tenant.name}} board to discuss the violation at {{property.address}}.</p>'
         || '<p><strong>Date:</strong> {{hearing.date}}<br/>'
         || '<strong>Time:</strong> {{hearing.time}}<br/>'
         || '<strong>Location:</strong> {{hearing.location}}</p>'
         || '<p>You may attend in person, send a representative, or submit a written statement in advance. If you cannot attend, the board may proceed in your absence.</p>'
         || '<p>Sincerely,<br/>{{tenant.name}} Board</p>',
         jsonb_build_array(
           'tenant.name',
           'resident.first_name', 'resident.last_name',
           'property.address',
           'hearing.date', 'hearing.time', 'hearing.location'
         )
        ),
        ('payment_reminder',
         'Payment Reminder',
         'Polite reminder that dues or fines are past due.',
         'email',
         'Payment Reminder — {{payment.amount_due}} past due',
         '<p>Hi {{resident.first_name}},</p>'
         || '<p>This is a friendly reminder that an amount of <strong>{{payment.amount_due}}</strong> is past due on your account at {{property.address}}.</p>'
         || '<p><strong>Original due date:</strong> {{payment.due_date}}<br/>'
         || '<strong>Days past due:</strong> {{payment.days_late}}<br/>'
         || '<strong>Late fees applied:</strong> {{payment.late_fees}}</p>'
         || '<p>You can pay online at {{tenant.portal_url}}.</p>'
         || '<p>If you have already paid or believe this is an error, please reply and let us know.</p>'
         || '<p>Thanks,<br/>{{tenant.name}}</p>',
         jsonb_build_array(
           'tenant.name', 'tenant.portal_url',
           'resident.first_name',
           'property.address',
           'payment.amount_due', 'payment.due_date', 'payment.days_late', 'payment.late_fees'
         )
        ),
        ('annual_meeting',
         'Annual Meeting Notice',
         'Statutory notice of the annual membership meeting.',
         'email',
         'Annual Meeting — {{meeting.date}}',
         '<p>Dear {{tenant.name}} member,</p>'
         || '<p>You are hereby given notice of the annual membership meeting of {{tenant.name}}.</p>'
         || '<p><strong>Date:</strong> {{meeting.date}}<br/>'
         || '<strong>Time:</strong> {{meeting.time}}<br/>'
         || '<strong>Location:</strong> {{meeting.location}}</p>'
         || '<p><strong>Agenda highlights:</strong></p>'
         || '<ul><li>{{meeting.agenda_item_1}}</li><li>{{meeting.agenda_item_2}}</li><li>{{meeting.agenda_item_3}}</li></ul>'
         || '<p>If you cannot attend, please submit a proxy via the resident portal.</p>'
         || '<p>Sincerely,<br/>{{tenant.name}} Board</p>',
         jsonb_build_array(
           'tenant.name',
           'meeting.date', 'meeting.time', 'meeting.location',
           'meeting.agenda_item_1', 'meeting.agenda_item_2', 'meeting.agenda_item_3'
         )
        ),
        ('general_announcement',
         'General Announcement',
         'A blank, reusable announcement template for ad-hoc news.',
         'email',
         '{{announcement.subject}}',
         '<p>Hi {{resident.first_name}},</p>'
         || '<p>{{announcement.body}}</p>'
         || '<p>Thanks,<br/>{{tenant.name}}</p>',
         jsonb_build_array(
           'tenant.name',
           'resident.first_name',
           'announcement.subject', 'announcement.body'
         )
        )
      ) as v(key, name, description, channel, subject, body_html, variables)
    loop
      insert into public.letter_templates
        (tenant_id, key, name, description, channel, subject, body_html, variables, is_default, is_system, system_key)
      values
        (t.id, tpl.key, tpl.name, tpl.description, tpl.channel, tpl.subject, tpl.body_html, tpl.variables, true, true, tpl.key)
      on conflict (tenant_id, key) do nothing;
    end loop;

    -- ====================================================
    -- Default violation categories
    -- (Madison Park's seed schedule per DECISIONS.md C.2)
    -- ====================================================
    -- Look up the system templates we just inserted so we can
    -- link the per-category letter triggers.
    select id into warning_id from public.letter_templates
      where tenant_id = t.id and key = 'first_violation';
    select id into notice_id from public.letter_templates
      where tenant_id = t.id and key = 'second_violation';
    select id into fine_id from public.letter_templates
      where tenant_id = t.id and key = 'final_violation';

    for cat in
      select * from (values
        ('lawn',         'Lawn & Landscaping',  'Unmaintained lawn, weeds, dead plants, overgrown shrubs.',                 5000, 2500,  5000, 10000, 10),
        ('parking',      'Parking',             'Improperly parked vehicles, blocked driveways, parking on lawn.',          5000, 2500,  5000, 10000, 20),
        ('trash',        'Trash & Bins',        'Trash bins left out past collection day or stored visibly.',               2500, 1000,  2500,  5000, 30),
        ('exterior',     'Exterior Maintenance','Peeling paint, damaged siding, broken windows, deferred upkeep.',          5000, 2500,  5000, 10000, 40),
        ('arc',          'Architectural (No ARC)','Modifications made without Architectural Review Committee approval.',    7500, 5000,  7500, 15000, 50),
        ('pet',          'Pets',                'Off-leash pets, excessive noise, waste not picked up.',                    2500, 1000,  2500,  5000, 60),
        ('noise',        'Noise',               'Quiet-hours violations, loud music, persistent disturbances.',             2500, 1000,  2500,  5000, 70),
        ('signage',      'Signage',             'Unapproved signs, banners, or flags posted on property.',                  2500, 1000,  2500,  5000, 80),
        ('pool_amenity', 'Pool & Amenity',      'Misuse of pool, clubhouse, fitness center, or other amenities.',           5000, 2500,  5000, 10000, 90),
        ('other',        'Other',               'Any violation not covered by the categories above.',                       2500, 1000,  2500,  5000, 100)
      ) as v(slug, name, description, default_fine, first_off, second_off, third_off, sort)
    loop
      insert into public.violation_categories
        (tenant_id, slug, name, description, default_fine_cents,
         first_offense_cents, second_offense_cents, third_offense_cents,
         warning_letter_template, notice_letter_template, fine_letter_template,
         active, sort_order)
      values
        (t.id, cat.slug, cat.name, cat.description, cat.default_fine,
         cat.first_off, cat.second_off, cat.third_off,
         warning_id, notice_id, fine_id,
         true, cat.sort)
      on conflict (tenant_id, slug) do nothing;
    end loop;
  end loop;
end $$;

-- ============================================================
-- DONE.
-- ============================================================
