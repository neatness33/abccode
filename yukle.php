<?php
// API Ayarları
$api_url = 'https://hemengmailal.com/apps/sbox_api.php';
$api_token = '6932369629';

function getAPIRequest($dataUrl){
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_POST, 1);
    curl_setopt($curl, CURLOPT_URL, $dataUrl);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 30); 
    curl_setopt($curl, CURLOPT_TIMEOUT, 30);
    $result = curl_exec($curl);
    curl_close($curl);
    return $result;
}

function parseM3U($m3u_link) {
    // M3U linkinden sunucu, kullanıcı adı ve şifreyi ayıkla
    $parsed = [];
    if (preg_match('/(http[s]?:\/\/[^\/]+)(?:\:\d+)?\/get\.php\?username=([^&]+)&password=([^&]+)/', $m3u_link, $matches)) {
        $parsed['server'] = $matches[1];
        $parsed['username'] = $matches[2];
        $parsed['password'] = $matches[3];
    }
    return $parsed;
}

$result = null;
$error = null;

// reCAPTCHA doğrulama fonksiyonu
function verifyRecaptcha($recaptcha_response) {
    $secret = '6Lcz_3crAAAAAFUaZA1dxlzR0Z5GvO3VLjIiFc8I';
    $url = 'https://www.google.com/recaptcha/api/siteverify';
    $data = [
        'secret' => $secret,
        'response' => $recaptcha_response
    ];
    $options = [
        'http' => [
            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
            'method'  => 'POST',
            'content' => http_build_query($data),
        ],
    ];
    $context  = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    if ($result === FALSE) {
        return false;
    }
    $resultData = json_decode($result, true);
    return $resultData['success'] ?? false;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $recaptcha_response = $_POST['g-recaptcha-response'] ?? '';
    if (!$recaptcha_response || !verifyRecaptcha($recaptcha_response)) {
        $error = 'Lütfen reCAPTCHA doğrulamasını tamamlayın.';
    } else {
        $method = $_POST['method'] ?? '';
        $action_type = $_POST['action_type'] ?? '';
        $server = '';
        $username = '';
        $password = '';
        $device_id = $_POST['device_id'] ?? '';
        
        if ($method === 'xtream') {
            $server = trim($_POST['server'] ?? '');
            $username = trim($_POST['username'] ?? '');
            $password = trim($_POST['password'] ?? '');
        } elseif ($method === 'm3u') {
            $m3u = trim($_POST['m3u'] ?? '');
            $parsed = parseM3U($m3u);
            if ($parsed) {
                $server = $parsed['server'];
                $username = $parsed['username'];
                $password = $parsed['password'];
            } else {
                $error = 'Invalid m3u link!';
            }
        }

        if (!$error && $server && $username && $password) {
            $dns = $server;
            $base = "$api_url?token=$api_token&action=create";
            if ($action_type === 'activation') {
                $create_type = 'activation_xtream';
                $dataUrl = "$base&create_type=$create_type&username=$username&password=$password&dns=$dns";
            } elseif ($action_type === 'device_id') {
                if (!$device_id) {
                    $error = 'Device ID gerekli!';
                } else {
                    $create_type = 'device_id_xtream';
                    $dataUrl = "$base&create_type=$create_type&username=$username&password=$password&dns=$dns&device_id=$device_id";
                }
            }
            if (!$error) {
                $get_data = getAPIRequest($dataUrl);
                $response = json_decode($get_data, true);
                $result = $response;
            }
        } elseif (!$error) {
            $error = 'Tüm alanları doldurun!';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>abciptvplayer</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: #393939; }
        .main-box {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.10);
            max-width: 600px;
            margin: 40px auto 0 auto;
            padding: 32px 24px 24px 24px;
        }
        .main-title {
            color: #c8005a;
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 12px;
        }
        .desc-list {
            color: #222;
            font-size: 1rem;
            margin-bottom: 18px;
        }
        .form-label { font-weight: 500; }
        .form-section {
            background: #f7f7f7;
            border-radius: 10px;
            padding: 18px 16px 10px 16px;
            margin-bottom: 18px;
        }
        .result-box {
            background: #f1f8e9;
            border: 1px solid #b2dfdb;
            border-radius: 10px;
            padding: 18px 12px;
            margin-top: 18px;
            text-align: center;
        }
        .result-code {
            font-size: 2.2rem;
            font-weight: bold;
            color: #388e3c;
            letter-spacing: 2px;
            margin-bottom: 8px;
        }
        .btn-copy {
            border-radius: 6px;
            font-size: 0.95rem;
            padding: 2px 12px;
            margin-bottom: 8px;
        }
        .alert-danger { margin-top: 18px; }
        @media (max-width: 600px) {
            .main-box { padding: 16px 4px; }
        }
    </style>
</head>
<body>
<div class="main-box">
    
		
    </ul>
    <form method="post" id="iptvForm">
        <div class="form-section">
            <div class="mb-3">
                <label class="form-label">Choose Method</label>
                <div>
                    <input class="form-check-input" type="radio" name="method" id="m3u" value="m3u" checked onclick="toggleMethod()">
                    <label class="form-check-label me-3" for="m3u">M3U Link</label>
                    <input class="form-check-input" type="radio" name="method" id="xtream" value="xtream" onclick="toggleMethod()">
                    <label class="form-check-label" for="xtream">Xtream Codes</label>
                </div>
            </div>
            <div id="m3uField">
                <div class="mb-3">
                    <label class="form-label">M3U Link</label>
                    <input type="text" class="form-control" name="m3u" placeholder="http://.../get.php?username=...&password=...">
                </div>
            </div>
            <div id="xtreamFields" style="display:none;">
                <div class="mb-3">
                    <label class="form-label">Server URL</label>
                    <input type="text" class="form-control" name="server" placeholder="Örn: http://vamus.live:8080">
                </div>
                <div class="mb-3">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-control" name="username" placeholder="Kullanıcı adı">
                </div>
                <div class="mb-3">
                    <label class="form-label">Password</label>
                    <input type="text" class="form-control" name="password" placeholder="Şifre">
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Choose Method</label>
                <select class="form-select" name="action_type" id="actionType" onchange="toggleDeviceID()">
                    <option value="activation">Get Activation Code</option>
                    <option value="device_id">Add Your Device ID</option>
                </select>
            </div>
            <div class="mb-3" id="deviceIdField" style="display:none;">
                <label class="form-label">DEVICE ID</label>
                <input type="text" class="form-control" name="device_id" placeholder="example: 8dd078fda0843117">
            </div>
            <div class="mb-3">
                <div class="g-recaptcha" data-sitekey="6Lcz_3crAAAAAOiKh5v2R5CF7gktGujKRrN9yKNW"></div>
            </div>
            <button type="submit" class="btn btn-primary w-100">Gönder</button>
        </div>
    </form>
    <?php if ($error): ?>
        <div class="alert alert-danger text-center"><?php echo $error; ?></div>
    <?php endif; ?>
    <?php if ($result): ?>
        <?php if (isset($result['status']) && $result['status'] === 'success'): ?>
            <div class="result-box">
                <?php if (isset($result['activation_code'])): ?>
                    <div class="mb-2">Your Activation Code:</div>
                    <div class="result-code" id="copyTarget"><?php echo htmlspecialchars($result['activation_code']); ?></div>
                    <button class="btn btn-outline-secondary btn-copy" onclick="copyToClipboard('copyTarget')">Copy</button>
                <?php elseif (isset($result['device_id'])): ?>
                    <div class="mb-2">Your Device ID:</div>
                    <div class="result-code" id="copyTarget"><?php echo htmlspecialchars($result['device_id']); ?></div>
                    <button class="btn btn-outline-secondary btn-copy" onclick="copyToClipboard('copyTarget')">Copy</button>
                <?php endif; ?>
                <?php
                // Eğer device_id ekleme işlemi ise ve mesaj 'Created successfully.' ise Türkçeye çevir
                $isDeviceId = isset($_POST['action_type']) && $_POST['action_type'] === 'device_id';
                $msg = $result['message'] ?? '';
                if ($isDeviceId && $msg === 'Created successfully.') {
                    $msg = 'Succesfully Added.';
                }
                ?>
                <?php if (!empty($msg)): ?>
                    <div class="text-success mt-2"><?php echo htmlspecialchars($msg); ?></div>
                <?php endif; ?>
            </div>
        <?php else: ?>
            <div class="alert alert-danger text-center mt-3">
                <strong>Error:</strong> <?php echo isset($result['message']) ? htmlspecialchars($result['message']) : 'Unknown happened error.'; ?>
            </div>
        <?php endif; ?>
    <?php endif; ?>
    <div class="text-center mt-3">
       
    </div>
</div>
<script>
function toggleMethod() {
    var m3u = document.getElementById('m3u').checked;
    document.getElementById('m3uField').style.display = m3u ? '' : 'none';
    document.getElementById('xtreamFields').style.display = m3u ? 'none' : '';
}
function toggleDeviceID() {
    var actionType = document.getElementById('actionType').value;
    document.getElementById('deviceIdField').style.display = (actionType === 'device_id') ? '' : 'none';
}
function copyToClipboard(elementId) {
    var el = document.getElementById(elementId);
    if (!el) return;
    var text = el.innerText || el.textContent;
    navigator.clipboard.writeText(text);
}
document.addEventListener('DOMContentLoaded', function() {
    toggleMethod();
    toggleDeviceID();
});
</script>
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
</body>
</html>
