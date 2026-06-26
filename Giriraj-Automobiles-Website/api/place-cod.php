<?php
/** Records a Cash-on-Delivery order (no payment gateway needed). */
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['error' => 'POST only'], 405);

$body     = read_json_body();
$items    = $body['items'] ?? [];
$customer = $body['customer'] ?? [];

if (!valid_customer($customer)) {
    json_out(['error' => 'Please provide name, a valid phone number and a complete delivery address.'], 400);
}

list($total, $snapshot) = price_cart($items);

$id = save_order([
    'items'          => $snapshot,
    'total_amount'   => $total,
    'customer'       => $customer,
    'payment_method' => 'cod',
    'payment_status' => 'cod_pending',
    'status'         => 'confirmed',
]);

json_out(['ok' => true, 'order_id' => $id, 'total' => $total, 'payment_method' => 'cod']);
