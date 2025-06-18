<?php
//arquivo que serve a chave publica para o javascript
require_once __DIR__ . '/../config/crypto_config.php';

header('Content-Type: text/plain');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $publicKey = CryptoConfig::getPublicKey();
    echo $publicKey;
} catch (Exception $e) {
    http_response_code(404);
    echo "Chave pública não encontrada: " . $e->getMessage();
}
?>
