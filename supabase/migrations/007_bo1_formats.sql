-- Allow one-set match formats (singles and doubles)

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_format_check;

ALTER TABLE matches ADD CONSTRAINT matches_format_check
  CHECK (format IN (
    '1v1_bo1', '1v1_bo3', '1v1_bo5',
    '2v2_bo1', '2v2_bo3', '2v2_bo5'
  ));
