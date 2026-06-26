<?php
/**
 * Giriraj Automobiles — payment backend config & helpers.
 *
 * SET YOUR RAZORPAY KEYS BELOW.
 *   - Test mode keys start with "rzp_test_".  Swap for "rzp_live_" keys to go live.
 *   - Get them from: Razorpay Dashboard → Settings → API Keys.
 *   - The SECRET must stay on the server only — never put it in the website JS.
 */

const RAZORPAY_KEY_ID     = 'rzp_test_REPLACE_ME';      // public key id
const RAZORPAY_KEY_SECRET = 'REPLACE_ME_SECRET';        // secret key (keep private!)

const STORE_NAME    = 'Giriraj Automobiles';
const CURRENCY      = 'INR';

// Password for the /admin Orders page. CHANGE THIS before going live.
const ADMIN_PASSWORD = 'giriraj-admin-2026';
const ORDERS_FILE   = __DIR__ . '/orders/orders.jsonl';
const PRODUCTS_FILE = __DIR__ . '/products.json';

// ---- helpers ----
function json_out($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function read_json_body() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function keys_configured() {
    return RAZORPAY_KEY_ID !== 'rzp_test_REPLACE_ME'
        && RAZORPAY_KEY_SECRET !== 'REPLACE_ME_SECRET'
        && RAZORPAY_KEY_ID !== '' && RAZORPAY_KEY_SECRET !== '';
}

/** Recompute the cart total server-side from trusted prices. Returns [total, snapshot[]]. */
function price_cart($items) {
    $catalogue = json_decode(file_get_contents(PRODUCTS_FILE), true);
    $total = 0; $snapshot = [];
    foreach ($items as $it) {
        $id  = isset($it['id']) ? $it['id'] : (isset($it['sku']) ? $it['sku'] : null);
        $qty = max(1, (int)($it['qty'] ?? 1));
        if (!$id || !isset($catalogue[$id])) {
            json_out(['error' => "Unknown product: " . htmlspecialchars((string)$id)], 400);
        }
        $p = $catalogue[$id];
        if ($p['stock'] < $qty) {
            json_out(['error' => "Insufficient stock for {$p['name']}"], 400);
        }
        $line = $p['price'] * $qty;
        $total += $line;
        $snapshot[] = ['sku' => $p['sku'], 'name' => $p['name'], 'price' => $p['price'], 'qty' => $qty, 'line' => $line];
    }
    if (!$snapshot) json_out(['error' => 'Cart is empty'], 400);
    return [$total, $snapshot];
}

function valid_customer($c) {
    return is_array($c)
        && !empty(trim($c['name'] ?? ''))
        && strlen(trim($c['phone'] ?? '')) >= 7
        && strlen(trim($c['address'] ?? '')) >= 10;
}

function save_order($order) {
    $order['id'] = $order['id'] ?? ('GA-' . date('Ymd') . '-' . substr(bin2hex(random_bytes(4)), 0, 6));
    $order['created_at'] = date('c');
    @file_put_contents(ORDERS_FILE, json_encode($order) . "\n", FILE_APPEND | LOCK_EX);
    return $order['id'];
}

/** Read all saved orders (newest first). */
function read_orders() {
    if (!file_exists(ORDERS_FILE)) return [];
    $out = [];
    foreach (file(ORDERS_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $o = json_decode($line, true);
        if (is_array($o)) $out[] = $o;
    }
    return array_reverse($out);
}

/** Overwrite the orders file with the given list (expects newest-first; stored oldest-first). */
function write_orders($orders) {
    $lines = array_map(function ($o) { return json_encode($o); }, array_reverse($orders));
    @file_put_contents(ORDERS_FILE, implode("\n", $lines) . (count($lines) ? "\n" : ''), LOCK_EX);
}

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

/** Call the Razorpay REST API. */
function razorpay_request($method, $path, $body = null) {
    $ch = curl_init('https://api.razorpay.com/v1' . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD        => RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT        => 20,
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
    if ($resp === false) json_out(['error' => 'Payment gateway unreachable: ' . $err], 502);
    return [$code, json_decode($resp, true)];
}
