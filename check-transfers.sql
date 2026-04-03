-- Check existing transfers
SELECT 
  bt.id as transfer_id,
  bt.booking_id,
  bt.status as transfer_status,
  bt.from_route_id,
  bt.to_route_id,
  bt.requested_at,
  bt.reviewed_at,
  b.status as booking_status,
  b.seat_number,
  r_from.origin || ' → ' || r_from.destination as from_route,
  r_to.origin || ' → ' || r_to.destination as to_route
FROM booking_transfers bt
JOIN bookings b ON bt.booking_id = b.id
JOIN routes r_from ON bt.from_route_id = r_from.id
JOIN routes r_to ON bt.to_route_id = r_to.id
ORDER BY bt.requested_at DESC;

-- If you want to clean up pending transfers to restart testing:
-- DELETE FROM booking_transfers WHERE status = 'PENDING';
