<?php
/** Creates a Razorpay order. Returns the order id + public key for the checkout widget. */
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['error' => 'POST only'], 405);
if (!keys_configured()) json_out(['error' => 'Online payment is not configured yet. Please use Cash on Delivery.'], 503);

$body  = read_json_body();
$items = $body['items'] ?? [];
list($total, $snapshot) = price_cart($items);

$amountPaise = (int) round($total * 100);
list($code, $order) = razorpay_request('POST', '/orders', [
    'amount'   => $amountPaise,
    'currency' => CURRENCY,
    'receipt'  => 'rcpt_' . substr(bin2hex(random_bytes(4)), 0, 8),
    'notes'    => ['store' => STORE_NAME],
]);

if ($code !== 200 || empty($order['id'])) {
    $msg = $order['error']['description'] ?? 'Could not create payment order';
    json_out(['error' => $msg], 502);
}

json_out([
    'order_id' => $order['id'],
    'amount'   => $amountPaise,
    'currency' => CURRENCY,
    'key_id'   => RAZORPAY_KEY_ID,
    'total'    => $total,
    'items'    => $snapshot,
]);
