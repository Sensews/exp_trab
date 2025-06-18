<?php
// Script para gerar chaves RSA válidas
try {
    // Configuração para RSA-2048
    $config = array(
        "digest_alg" => "sha256",
        "private_key_bits" => 2048,
        "private_key_type" => OPENSSL_KEYTYPE_RSA,
    );
    
    // Gerar par de chaves
    $res = openssl_pkey_new($config);
    if (!$res) {
        throw new Exception("Erro ao gerar chaves: " . openssl_error_string());
    }
    
    // Extrair chave privada
    openssl_pkey_export($res, $privateKey);
    
    // Extrair chave pública
    $publicKeyDetails = openssl_pkey_get_details($res);
    $publicKey = $publicKeyDetails["key"];
    
    // Garantir que os diretórios existem
    $keysDir = __DIR__ . '/keys';
    if (!is_dir($keysDir)) {
        mkdir($keysDir, 0755, true);
    }
    
    // Salvar chaves
    file_put_contents($keysDir . '/private.key', $privateKey);
    file_put_contents($keysDir . '/public.key', $publicKey);
    
    echo "✅ Chaves RSA geradas com sucesso!\n";
    echo "📁 Salvas em: $keysDir\n";
    echo "\n--- CHAVE PÚBLICA ---\n";
    echo $publicKey;
    echo "\n--- FIM ---\n";
    
    // Validar as chaves
    $privKey = openssl_pkey_get_private($privateKey);
    $pubKey = openssl_pkey_get_public($publicKey);
    
    if ($privKey && $pubKey) {
        echo "\n✅ Chaves validadas com sucesso!\n";
        
        // Teste básico de criptografia
        $testData = "Hello World!";
        $encrypted = '';
        $decrypted = '';
        
        if (openssl_public_encrypt($testData, $encrypted, $pubKey, OPENSSL_RAW_DATA)) {
            if (openssl_private_decrypt($encrypted, $decrypted, $privKey, OPENSSL_RAW_DATA)) {
                echo "✅ Teste de criptografia: OK\n";
                echo "Original: $testData\n";
                echo "Descriptografado: $decrypted\n";
            } else {
                echo "❌ Erro na descriptografia\n";
            }
        } else {
            echo "❌ Erro na criptografia\n";
        }
    } else {
        echo "❌ Erro na validação das chaves\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}
?>
