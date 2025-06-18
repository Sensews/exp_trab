<?php
/**
 * Endpoint para fornecer chave pública RSA ao frontend
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    require_once __DIR__ . '/CryptoManager.php';
    
    $crypto = CryptoManager::getInstance();
    $publicKey = $crypto->getPublicKey();
    
    echo json_encode([
        'success' => true,
        'publicKey' => $publicKey
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erro ao obter chave pública'
    ]);
}
?>
