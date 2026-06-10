-- Home page display fields

ALTER TABLE site_config ADD COLUMN couple_display_name TEXT NOT NULL DEFAULT '';
ALTER TABLE site_config ADD COLUMN venue_hall TEXT NOT NULL DEFAULT '';
ALTER TABLE site_config ADD COLUMN check_in_time TEXT NOT NULL DEFAULT '';
ALTER TABLE site_config ADD COLUMN ceremony_time TEXT NOT NULL DEFAULT '';
ALTER TABLE site_config ADD COLUMN parking_info TEXT NOT NULL DEFAULT '';

UPDATE site_config
SET couple_display_name = groom_name || ' & ' || bride_name
WHERE id = 1 AND (couple_display_name IS NULL OR couple_display_name = '');
