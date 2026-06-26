<?php
/** Verifies the Razorpay payment signature server-side and records the paid order. */
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['error' => 'POST only'], 405);
if (!keys_configured()) json_out(['error' => 'Online payment is not configured.'], 503);

$body = read_json_body();
$orderId   = $body['razorpay_order_id']   ?? '';
$paymentId = $body['razorpay_payment_id'] ?? '';
$signature = $body['razorpay_signature']  ?? '';
$customer  = $body['customer'] ?? [];
$items     = $body['items'] ?? [];

if (!$orderId || !$paymentId || !$signature) json_out(['error' => 'Missing payment fields'], 400);

// Signature = HMAC_SHA256(order_id . "|" . payment_id, secret)
$expected = hash_hmac('sha256', $orderId . '|' . $paymentId, RAZORPAY_KEY_SECRET);
if (!hash_equals($expected, $signature)) {
    json_out(['error' => 'Payment verification failed'], 400);
}

list($total, $snapshot) = price_cart($items);

$id = save_order([
    'items'          => $snapshot,
    'total_amount'   => $total,
    'customer'       => $customer,
    'payment_method' => 'online',
    'payment_status' => 'paid',
    'status'         => 'confirmed',
    'razorpay_order_id'   => $orderId,
    'razorpay_payment_id' => $paymentId,
]);

json_out(['ok' => true, 'order_id' => $id, 'payment_status' => 'paid']);
