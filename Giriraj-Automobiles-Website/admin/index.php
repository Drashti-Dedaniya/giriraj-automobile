<?php
/** Giriraj Automobiles — password-protected Orders admin. */
require __DIR__ . '/../api/config.php';

session_start();

// ---- auth ----
if (isset($_GET['logout'])) { session_destroy(); header('Location: index.php'); exit; }

$err = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    if (hash_equals(ADMIN_PASSWORD, (string)$_POST['password'])) {
        session_regenerate_id(true);
        $_SESSION['giriraj_admin'] = true;
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
        header('Location: index.php'); exit;
    } else {
        usleep(600000); // slow down guessing
        $err = 'Incorrect password.';
    }
}
$authed = !empty($_SESSION['giriraj_admin']);

// ---- status update (authed) ----
$notice = '';
if ($authed && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_id'])) {
    if (!isset($_POST['csrf']) || !hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'])) {
        $notice = 'Session expired, please try again.';
    } else {
        $newStatus = $_POST['status'] ?? '';
        if (in_array($newStatus, ORDER_STATUSES, true)) {
            $orders = read_orders();
            foreach ($orders as &$o) { if (($o['id'] ?? '') === $_POST['update_id']) { $o['status'] = $newStatus; break; } }
            unset($o);
            write_orders($orders);
            $notice = 'Order ' . htmlspecialchars($_POST['update_id']) . ' updated to “' . htmlspecialchars($newStatus) . '”.';
        }
    }
}

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES); }
function money($n) { return '₹' . number_format((float)$n, 0); }

$orders = $authed ? read_orders() : [];
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Orders · Giriraj Automobiles Admin</title>
  <link href="https://fonts.googleapis.com/css2?family=Chivo:wght@700;900&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "IBM Plex Sans", system-ui, sans-serif; background: #f1f5f9; color: #0f172a; }
    .bar { background: #0f172a; color: #fff; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
    .bar .b { font-family: "Chivo"; font-weight: 900; letter-spacing: -.01em; }
    .bar .b span { color: #f87171; }
    .bar a { color: #cbd5e1; text-decoration: none; font-weight: 700; font-size: 14px; }
    .bar a:hover { color: #fff; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 28px 24px; }
    .login { max-width: 380px; margin: 80px auto; background: #fff; border: 2px solid #0f172a; padding: 32px; }
    .login h1 { font-family: "Chivo"; font-size: 24px; margin-bottom: 6px; }
    .login p { color: #64748b; font-size: 14px; margin-bottom: 18px; }
    input[type=password] { width: 100%; padding: 12px; border: 2px solid #e2e8f0; font-size: 15px; font-family: inherit; }
    input[type=password]:focus { outline: none; border-color: #dc2626; }
    .btn { background: #dc2626; color: #fff; border: none; padding: 12px 20px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; font-size: 13px; cursor: pointer; font-family: inherit; }
    .btn:hover { background: #b91c1c; }
    .err { background: #fef2f2; border: 2px solid #dc2626; color: #b91c1c; padding: 10px 12px; font-size: 14px; margin-bottom: 14px; }
    .notice { background: #f0fdf4; border: 2px solid #16a34a; color: #15803d; padding: 12px 14px; font-size: 14px; margin-bottom: 18px; }
    .head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
    .head h1 { font-family: "Chivo"; font-size: 28px; }
    .stats { display: flex; gap: 22px; color: #64748b; font-size: 14px; font-weight: 600; }
    .stats b { color: #0f172a; }
    .order { background: #fff; border: 2px solid #e2e8f0; padding: 18px; margin-bottom: 14px; }
    .order.s-delivered { border-color: #16a34a; }
    .order.s-cancelled { opacity: .7; }
    .order .top { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
    .oid { font-family: "Chivo"; font-weight: 900; font-size: 16px; }
    .when { color: #94a3b8; font-size: 13px; }
    .pill { display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; padding: 3px 9px; border-radius: 999px; }
    .pill.paid { background: #dcfce7; color: #15803d; }
    .pill.cod { background: #fef9c3; color: #854d0e; }
    .grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 18px; }
    .items { font-size: 14px; }
    .items div { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0; }
    .items .tot { font-weight: 800; border-bottom: none; padding-top: 8px; }
    .cust { font-size: 14px; color: #334155; }
    .cust b { display: block; color: #0f172a; }
    .cust .ph { margin: 4px 0; }
    .actions { display: flex; gap: 8px; align-items: center; margin-top: 14px; flex-wrap: wrap; }
    .actions select { padding: 9px; border: 2px solid #e2e8f0; font-family: inherit; font-size: 14px; }
    .actions .wa { background: #25d366; color: #fff; text-decoration: none; padding: 9px 14px; font-weight: 700; font-size: 13px; }
    .empty { background: #fff; border: 2px dashed #cbd5e1; padding: 50px; text-align: center; color: #64748b; }
    @media (max-width: 680px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="bar">
    <div class="b">GIRIRAJ <span>·</span> Orders Admin</div>
    <?php if ($authed): ?><a href="?logout=1">Log out →</a><?php endif; ?>
  </div>

<?php if (!$authed): ?>
  <div class="login">
    <h1>Staff login</h1>
    <p>Enter the admin password to view orders.</p>
    <?php if ($err): ?><div class="err"><?= h($err) ?></div><?php endif; ?>
    <form method="post">
      <input type="password" name="password" placeholder="Password" autofocus required />
      <button class="btn" type="submit" style="width:100%;margin-top:12px">Sign in</button>
    </form>
  </div>
<?php else: ?>
  <div class="wrap">
    <?php if ($notice): ?><div class="notice"><?= h($notice) ?></div><?php endif; ?>
    <?php
      $count = count($orders);
      $revenue = 0; $pending = 0;
      foreach ($orders as $o) {
        if (($o['payment_status'] ?? '') === 'paid') $revenue += (float)($o['total_amount'] ?? 0);
        if (in_array(($o['status'] ?? ''), ['pending','confirmed'], true)) $pending++;
      }
    ?>
    <div class="head">
      <h1>Orders</h1>
      <div class="stats">
        <span><b><?= $count ?></b> total</span>
        <span><b><?= $pending ?></b> to fulfil</span>
        <span>Paid revenue: <b><?= money($revenue) ?></b></span>
      </div>
    </div>

    <?php if (!$count): ?>
      <div class="empty">No orders yet. They'll appear here as customers check out.</div>
    <?php else: foreach ($orders as $o):
      $status = $o['status'] ?? 'pending';
      $pm = $o['payment_method'] ?? 'cod';
      $ps = $o['payment_status'] ?? '';
      $cust = $o['customer'] ?? [];
      $phone = preg_replace('/\D/', '', $cust['phone'] ?? '');
      $wa = $phone ? 'https://wa.me/' . (strlen($phone) === 10 ? '91' . $phone : $phone) : '';
    ?>
      <div class="order s-<?= h($status) ?>">
        <div class="top">
          <div>
            <span class="oid"><?= h($o['id'] ?? '—') ?></span>
            <span class="when"> · <?= h(date('d M Y, g:i a', strtotime($o['created_at'] ?? 'now'))) ?></span>
          </div>
          <div>
            <?php if ($pm === 'online'): ?><span class="pill paid">Paid online</span>
            <?php else: ?><span class="pill cod">Cash on Delivery</span><?php endif; ?>
          </div>
        </div>
        <div class="grid">
          <div class="items">
            <?php foreach (($o['items'] ?? []) as $it): ?>
              <div><span><?= h($it['name']) ?> <span style="color:#94a3b8">× <?= (int)$it['qty'] ?></span></span><span><?= money($it['line']) ?></span></div>
            <?php endforeach; ?>
            <div class="tot"><span>Total</span><span><?= money($o['total_amount'] ?? 0) ?></span></div>
          </div>
          <div class="cust">
            <b><?= h($cust['name'] ?? '—') ?></b>
            <div class="ph"><?= h($cust['phone'] ?? '') ?><?= !empty($cust['email']) ? ' · ' . h($cust['email']) : '' ?></div>
            <div><?= h($cust['address'] ?? '') ?></div>
            <div class="actions">
              <form method="post" style="display:flex;gap:8px;align-items:center">
                <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>" />
                <input type="hidden" name="update_id" value="<?= h($o['id']) ?>" />
                <select name="status">
                  <?php foreach (ORDER_STATUSES as $s): ?>
                    <option value="<?= $s ?>"<?= $s === $status ? ' selected' : '' ?>><?= ucfirst($s) ?></option>
                  <?php endforeach; ?>
                </select>
                <button class="btn" type="submit">Update</button>
              </form>
              <?php if ($wa): ?><a class="wa" href="<?= h($wa) ?>" target="_blank" rel="noreferrer">WhatsApp</a><?php endif; ?>
            </div>
          </div>
        </div>
      </div>
    <?php endforeach; endif; ?>
  </div>
<?php endif; ?>
</body>
</html>
