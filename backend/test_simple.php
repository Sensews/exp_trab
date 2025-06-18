<?php
/**
 * Teste direto da criptografia
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'crypto_handler.php';

try {
    echo "=== TESTE DIRETO DE CRIPTOGRAFIA ===\n";
    
    $cryptoHandler = new CryptoHandler();
    echo "✓ CryptoHandler inicializado\n";
    
    $publicKey = $cryptoHandler->getPublicKey();
    echo "✓ Chave pública obtida\n";
    
    // Dados de teste
    $testData = [
        'nome' => 'João Silva',
        'email' => 'joao@exemplo.com',
        'telefone' => '(11) 99999-9999',
        'senha' => 'MinhaSenh@123',
        'timestamp' => time() * 1000
    ];
    
    // Criptografar
    $aesKey = bin2hex(random_bytes(32));
    $jsonData = json_encode($testData);
    
    $method = 'AES-256-CBC';
    $iv = random_bytes(16);
    $key = hex2bin($aesKey);
    
    $encryptedData = openssl_encrypt($jsonData, $method, $key, OPENSSL_RAW_DATA, $iv);
    $combined = base64_encode($iv . $encryptedData);
    
    echo "✓ Dados criptografados com AES\n";
    
    // RSA
    $publicKeyResource = openssl_pkey_get_public($publicKey);
    $encryptedKey = '';
    if (openssl_public_encrypt($aesKey, $encryptedKey, $publicKeyResource)) {
        $encryptedKey = base64_encode($encryptedKey);
        echo "✓ Chave criptografada com RSA\n";
    } else {
        throw new Exception('Erro RSA: ' . openssl_error_string());
    }
    
    // Descriptografar
    $decryptedData = $cryptoHandler->hybridDecrypt($combined, $encryptedKey);
    echo "✓ Dados descriptografados\n";
    
    // Verificar
    if ($decryptedData['nome'] === $testData['nome']) {
        echo "✓ Teste PASSOU - dados corretos!\n";
        print_r($decryptedData);
    } else {
        echo "✗ Teste FALHOU\n";
    }
    
} catch (Exception $e) {
    echo "✗ ERRO: " . $e->getMessage() . "\n";
}
?>
