-- Rename competitive badge codes to new prize names
UPDATE user_badges SET badge_code = 'pequeno_charles' WHERE badge_code = 'el_yacare';
UPDATE user_badges SET badge_code = 'gabo_moreti' WHERE badge_code IN ('zapatero', 'inviolable', 'paseo_en_coche');
UPDATE user_badges SET badge_code = 'el_padre' WHERE badge_code IN ('papa_de_la_banda', 'papa_del_grupo');
UPDATE user_badges SET badge_code = 'fede_gorrisen' WHERE badge_code IN ('viernes_flex', 'lomo_de_metal');
UPDATE user_badges SET badge_code = 'sorpresa_sauna' WHERE badge_code = 'caza_gigantes';
