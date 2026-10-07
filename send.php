<?php
/**
 * Обработчик заявок с сайта «Садки Карелии»
 * Поддерживает отправку на Email и в Telegram.
 */

// Заголовки безопасности и JSON
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
    exit;
}

// -------------------------------------------------------------
// НАСТРОЙКИ (Заполняются при запуске на боевом домене)
// -------------------------------------------------------------
$CONFIG = [
    // 1. Почта, куда отправлять заявки:
    'mail_to'       => 'info@sadki-karelii.ru',
    // 2. От кого (рекомендуется no-reply@ваш-домен.ru):
    'mail_from'     => 'no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'sadki-karelii.ru'),
    'site_name'     => 'Садки Карелии',

    // 3. Уведомления в Telegram (необязательно):
    // Токен бота из @BotFather (например: '123456789:ABCdefGhIJKlmNoPQRstuVWXyz'):
    'tg_token'      => '',
    // ID вашего чата или рабочей группы (например: '-100123456789' или '123456789'):
    'tg_chat_id'    => '',
];

// Получаем данные (поддерживаем и multipart/form-data, и application/json)
$input = [];
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (stripos($contentType, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? [];
} else {
    $input = $_POST;
}

// -------------------------------------------------------------
// ЗАЩИТА ОТ СПАМА (Honeypot)
// -------------------------------------------------------------
// Невидимое поле для спам-ботов. Если заполнено — тихо глушим спамера
if (!empty($input['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

// Очистка и получение полей
function clean($val) {
    if (is_array($val)) {
        return implode(', ', array_map('clean', $val));
    }
    return trim(htmlspecialchars((string)$val, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
}

$name     = clean($input['name'] ?? $input['Имя'] ?? '');
$phone    = clean($input['phone'] ?? $input['Телефон'] ?? '');
$type     = clean($input['type'] ?? $input['Что нужно'] ?? 'Не указано');
$size     = clean($input['size'] ?? $input['Размер, м'] ?? '—');
$volume   = clean($input['volume'] ?? $input['Объём мешка, т'] ?? '—');
$pipes    = clean($input['pipes'] ?? $input['Труб в кольце'] ?? '—');
$dia      = clean($input['dia'] ?? $input['Ø трубы, мм'] ?? '—');
$deck     = clean($input['deck'] ?? $input['Настил'] ?? '—');
$qty      = clean($input['qty'] ?? $input['Количество'] ?? '—');
$opts     = clean($input['opts'] ?? $input['Дополнительно'] ?? '—');
$comment  = clean($input['comment'] ?? $input['Регион / комментарий'] ?? '—');

// Валидация обязательных полей
if (mb_strlen($name) < 2 || mb_strlen(preg_replace('/\D/', '', $phone)) < 10) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Заполните обязательные поля: имя и телефон']);
    exit;
}

$date = date('d.m.Y H:i:s');
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'Unknown';

// -------------------------------------------------------------
// 1. ОТПРАВКА НА EMAIL
// -------------------------------------------------------------
$subject = "=?UTF-8?B?" . base64_encode("Новая заявка с сайта [{$type}]: {$name}") . "?=";

$htmlBody = "
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f6f8fa; margin: 0; padding: 24px; color: #1a202c; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: #0b1e2b; color: #ffffff; padding: 24px 28px; }
    .header h2 { margin: 0; font-size: 20px; font-weight: 700; }
    .header p { margin: 6px 0 0; color: #f26a1b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .content { padding: 28px; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 11px 0; border-bottom: 1px solid #edf2f7; text-align: left; font-size: 15px; }
    .table th { color: #718096; font-weight: 500; width: 40%; vertical-align: top; }
    .table td { color: #1a202c; font-weight: 600; }
    .highlight { font-size: 18px; color: #f26a1b; font-weight: 700; }
    .footer { background: #f7fafc; padding: 16px 28px; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }
  </style>
</head>
<body>
  <div class='card'>
    <div class='header'>
      <p>Садки Карелии • Заявка с сайта</p>
      <h2>{$name} ({$phone})</h2>
    </div>
    <div class='content'>
      <table class='table'>
        <tr><th>Клиент:</th><td>{$name}</td></tr>
        <tr><th>Телефон:</th><td class='highlight'><a href='tel:{$phone}' style='color:#f26a1b;text-decoration:none;'>{$phone}</a></td></tr>
        <tr><th>Интересует:</th><td>{$type}</td></tr>
        <tr><th>Размер садка:</th><td>{$size} м</td></tr>
        <tr><th>Объём мешка:</th><td>{$volume} т</td></tr>
        <tr><th>Количество труб:</th><td>{$pipes}</td></tr>
        <tr><th>Диаметр трубы:</th><td>{$dia} мм</td></tr>
        <tr><th>Настил:</th><td>{$deck}</td></tr>
        <tr><th>Количество садков:</th><td>{$qty}</td></tr>
        <tr><th>Доп. опции:</th><td>{$opts}</td></tr>
        <tr><th>Водоём / Комментарий:</th><td>{$comment}</td></tr>
      </table>
    </div>
    <div class='footer'>
      Дата отправки: {$date} | IP: {$ip}
    </div>
  </div>
</body>
</html>
";

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "From: {$CONFIG['site_name']} <{$CONFIG['mail_from']}>\r\n";
$headers .= "Reply-To: {$CONFIG['mail_to']}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

$mailSuccess = @mail($CONFIG['mail_to'], $subject, $htmlBody, $headers);

// -------------------------------------------------------------
// 2. ОТПРАВКА В TELEGRAM (Если настроены токен и chat_id)
// -------------------------------------------------------------
$tgSuccess = false;
if (!empty($CONFIG['tg_token']) && !empty($CONFIG['tg_chat_id'])) {
    $tgText  = "🐟 *Новая заявка с сайта «{$CONFIG['site_name']}»*\n\n";
    $tgText .= "👤 *Клиент:* {$name}\n";
    $tgText .= "📞 *Телефон:* `{$phone}`\n";
    $tgText .= "📦 *Продукция:* {$type}\n";
    if ($size !== '—') $tgText .= "📏 *Размер:* {$size} м\n";
    if ($volume !== '—') $tgText .= "⚖️ *Объём мешка:* {$volume} т\n";
    if ($qty !== '—') $tgText .= "🔢 *Количество:* {$qty} шт.\n";
    if ($opts !== '—') $tgText .= "⚙️ *Дополнительно:* {$opts}\n";
    if ($comment !== '—') $tgText .= "💬 *Комментарий:* {$comment}\n";
    $tgText .= "\n🕒 _{$date}_";

    $tgUrl = "https://api.telegram.org/bot{$CONFIG['tg_token']}/sendMessage";
    $tgData = [
        'chat_id'    => $CONFIG['tg_chat_id'],
        'text'       => $tgText,
        'parse_mode' => 'Markdown',
    ];

    if (function_exists('curl_init')) {
        $ch = curl_init($tgUrl);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tgData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $res = curl_exec($ch);
        curl_close($ch);
        $tgSuccess = !empty($res);
    } else {
        $context = stream_context_create([
            'http' => [
                'method'  => 'POST',
                'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
                'content' => http_build_query($tgData),
                'timeout' => 5,
            ]
        ]);
        $res = @file_get_contents($tgUrl, false, $context);
        $tgSuccess = !empty($res);
    }
}

echo json_encode([
    'ok'       => true,
    'mail'     => $mailSuccess,
    'telegram' => $tgSuccess,
]);
