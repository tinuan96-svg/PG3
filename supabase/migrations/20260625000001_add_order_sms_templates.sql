/*
  # Add missing Order SMS templates

  Ensures SMS templates exist for Shipped, Delivered, and Cancelled status updates.
*/

INSERT INTO communication_templates (name, channel, type, body_text, variables) VALUES
(
  'Order Shipped',
  'sms',
  'transactional',
  'PocketGrocery: Great news! Your order #{{order_number}} has been dispatched. Track it in your account. Reply STOP to opt out.',
  '[{"key":"customer_name","description":"Customer full name"},{"key":"order_number","description":"Order number"}]'
),
(
  'Order Delivered',
  'sms',
  'transactional',
  'PocketGrocery: Hi {{customer_name}}, your order #{{order_number}} has been delivered. Enjoy your groceries! Reply STOP to opt out.',
  '[{"key":"customer_name","description":"Customer full name"},{"key":"order_number","description":"Order number"}]'
),
(
  'Order Cancelled',
  'sms',
  'transactional',
  'PocketGrocery: Your order #{{order_number}} has been cancelled. If this was a mistake, please contact us. Reply STOP to opt out.',
  '[{"key":"customer_name","description":"Customer full name"},{"key":"order_number","description":"Order number"}]'
)
ON CONFLICT DO NOTHING;
