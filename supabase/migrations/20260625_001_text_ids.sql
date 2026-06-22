-- Change card_sets and cards to use text IDs (matching TCG API)
-- This allows direct use of pokemontcg.io IDs like "swsh4", "base1", etc.

-- Drop dependent foreign keys first
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_set_id_fkey;
ALTER TABLE collection_items DROP CONSTRAINT IF EXISTS collection_items_card_id_fkey;
ALTER TABLE want_list_items DROP CONSTRAINT IF EXISTS want_list_items_card_id_fkey;
ALTER TABLE trade_items DROP CONSTRAINT IF EXISTS trade_items_card_id_fkey;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_card_id_fkey;
ALTER TABLE portfolio_snapshots DROP CONSTRAINT IF EXISTS portfolio_snapshots_most_valuable_card_id_fkey;

-- Change card_sets.id to text
ALTER TABLE card_sets ALTER COLUMN id SET DATA TYPE text USING id::text;
ALTER TABLE card_sets ALTER COLUMN id SET DEFAULT NULL;
DROP INDEX IF EXISTS idx_card_sets_name;
CREATE INDEX IF NOT EXISTS idx_card_sets_name ON card_sets(name);

-- Change cards.id and cards.set_id to text
ALTER TABLE cards ALTER COLUMN id SET DATA TYPE text USING id::text;
ALTER TABLE cards ALTER COLUMN id SET DEFAULT NULL;
ALTER TABLE cards ALTER COLUMN set_id SET DATA TYPE text USING set_id::text;

-- Change referencing columns to text
ALTER TABLE collection_items ALTER COLUMN card_id SET DATA TYPE text USING card_id::text;
ALTER TABLE want_list_items ALTER COLUMN card_id SET DATA TYPE text USING card_id::text;
ALTER TABLE trade_items ALTER COLUMN card_id SET DATA TYPE text USING card_id::text;
ALTER TABLE listings ALTER COLUMN card_id SET DATA TYPE text USING card_id::text;
ALTER TABLE portfolio_snapshots ALTER COLUMN most_valuable_card_id SET DATA TYPE text USING most_valuable_card_id::text;

-- Re-add foreign keys
ALTER TABLE cards ADD CONSTRAINT cards_set_id_fkey FOREIGN KEY (set_id) REFERENCES card_sets(id) ON DELETE CASCADE;
ALTER TABLE collection_items ADD CONSTRAINT collection_items_card_id_fkey FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;
ALTER TABLE want_list_items ADD CONSTRAINT want_list_items_card_id_fkey FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;
ALTER TABLE trade_items ADD CONSTRAINT trade_items_card_id_fkey FOREIGN KEY (card_id) REFERENCES cards(id);
ALTER TABLE listings ADD CONSTRAINT listings_card_id_fkey FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;
ALTER TABLE portfolio_snapshots ADD CONSTRAINT portfolio_snapshots_most_valuable_card_id_fkey FOREIGN KEY (most_valuable_card_id) REFERENCES cards(id);

-- Drop the unique constraint that uses uuid, re-add with text
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_set_id_number_key;
ALTER TABLE cards ADD CONSTRAINT cards_set_id_number_key UNIQUE (set_id, number);
