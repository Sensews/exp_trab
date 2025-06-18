<?php
/**
 * Teste da Criptografia Híbrida
 */
require_once 'crypto_handler.php';

try {
    echo "=== TESTE DE CRIPTOGRAFIA HÍBRIDA ===\n";
    
    $cryptoHandler = new CryptoHandler();
    echo "✓ CryptoHandler inicializado com sucesso\n";
    
    // Testar obtenção da chave pública
    $publicKey = $cryptoHandler->getPublicKey();
    echo "✓ Chave pública obtida: " . substr($publicKey, 0, 50) . "...\n";
    
    // Dados de teste
    $testData = [
        'nome' => 'João Silva',
        'email' => 'joao@exemplo.com',
        'telefone' => '(11) 99999-9999',
        'senha' => 'MinhaSenh@123',
        'timestamp' => time() * 1000
    ];
    
    // Simular criptografia AES (como seria feita no frontend)
    $aesKey = bin2hex(random_bytes(32)); // 256 bits
    $jsonData = json_encode($testData);
    
    // Criptografar dados com AES-256-CBC
    $method = 'AES-256-CBC';
    $ivLength = 16;
    $iv = random_bytes($ivLength);
    $key = hex2bin($aesKey);
    
    $encryptedData = openssl_encrypt($jsonData, $method, $key, OPENSSL_RAW_DATA, $iv);
    $combined = base64_encode($iv . $encryptedData);
    
    echo "✓ Dados criptografados com AES\n";
    
    // Criptografar chave AES com RSA
    $publicKeyResource = openssl_pkey_get_public($publicKey);
    $encryptedKey = '';
    if (openssl_public_encrypt($aesKey, $encryptedKey, $publicKeyResource)) {
        $encryptedKey = base64_encode($encryptedKey);
        echo "✓ Chave AES criptografada com RSA\n";
    } else {
        throw new Exception('Erro ao criptografar chave AES: ' . openssl_error_string());
    }
    
    // Testar descriptografia
    $decryptedData = $cryptoHandler->hybridDecrypt($combined, $encryptedKey);
    echo "✓ Dados descriptografados com sucesso\n";
    
    // Verificar se os dados estão corretos
    if ($decryptedData['nome'] === $testData['nome'] && 
        $decryptedData['email'] === $testData['email']) {
        echo "✓ Dados descriptografados estão corretos\n";
        echo "  Nome: " . $decryptedData['nome'] . "\n";
        echo "  Email: " . $decryptedData['email'] . "\n";
    } else {
        throw new Exception('Dados descriptografados não conferem');
    }
    
    // Testar validação de timestamp
    if ($cryptoHandler->validateTimestamp($decryptedData['timestamp'])) {
        echo "✓ Timestamp válido\n";
    } else {
        echo "✗ Timestamp inválido\n";
    }
    
    echo "\n=== TESTE CONCLUÍDO COM SUCESSO! ===\n";
    
} catch (Exception $e) {
    echo "✗ ERRO: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>
