-- Add segment support to routes table
ALTER TABLE routes ADD COLUMN segment_enabled BOOLEAN DEFAULT true;
ALTER TABLE routes ADD COLUMN auto_calculated BOOLEAN DEFAULT false;
ALTER TABLE routes ADD COLUMN calculation_data JSONB;

-- Create route_segments table for stopover-based pricing
CREATE TABLE route_segments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  route_id TEXT NOT NULL,
  segment_order INTEGER NOT NULL,
  from_location VARCHAR(255) NOT NULL,
  to_location VARCHAR(255) NOT NULL,
  distance_km DECIMAL(10,2),
  duration_minutes INTEGER,
  base_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_route_segments_route FOREIGN KEY (route_id) 
    REFERENCES routes(id) ON DELETE CASCADE,
  CONSTRAINT unique_route_segment_order UNIQUE(route_id, segment_order)
);

-- Create segment_price_variations for date-based pricing (weekend/holiday premiums)
CREATE TABLE segment_price_variations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  segment_id TEXT NOT NULL,
  variation_type VARCHAR(50) NOT NULL, -- 'weekend', 'holiday', 'peak_season', 'custom'
  price_adjustment DECIMAL(10,2) NOT NULL, -- Can be positive (premium) or negative (discount)
  adjustment_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage' or 'fixed'
  applies_to_dates JSONB, -- {"days": ["saturday", "sunday"]} or {"dates": ["2026-12-25"]}
  start_date DATE,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_segment_variations_segment FOREIGN KEY (segment_id) 
    REFERENCES route_segments(id) ON DELETE CASCADE
);

-- Indexes for fast searching by location
CREATE INDEX idx_route_segments_locations ON route_segments(from_location, to_location);
CREATE INDEX idx_route_segments_from ON route_segments(from_location);
CREATE INDEX idx_route_segments_to ON route_segments(to_location);
CREATE INDEX idx_route_segments_route_id ON route_segments(route_id);

-- Indexes for date-based pricing lookups
CREATE INDEX idx_segment_variations_dates 
  ON segment_price_variations(segment_id, start_date, end_date) 
  WHERE active = true;

-- Add updated_at trigger for route_segments
CREATE OR REPLACE FUNCTION update_route_segments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_route_segments_updated_at
  BEFORE UPDATE ON route_segments
  FOR EACH ROW
  EXECUTE FUNCTION update_route_segments_updated_at();

-- Add updated_at trigger for segment_price_variations
CREATE OR REPLACE FUNCTION update_segment_variations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_segment_variations_updated_at
  BEFORE UPDATE ON segment_price_variations
  FOR EACH ROW
  EXECUTE FUNCTION update_segment_variations_updated_at();

-- Add comments for documentation
COMMENT ON TABLE route_segments IS 'Route segments enable stopover-based pricing and searchable intermediate destinations';
COMMENT ON TABLE segment_price_variations IS 'Date-based pricing variations for route segments (weekend/holiday premiums)';
COMMENT ON COLUMN routes.segment_enabled IS 'Whether this route uses segment-based pricing';
COMMENT ON COLUMN routes.auto_calculated IS 'Whether distance/duration was auto-calculated via Google Maps';
COMMENT ON COLUMN routes.calculation_data IS 'Cached route calculation data from Google Maps API';
