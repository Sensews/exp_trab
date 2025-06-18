<?php
/**
 * Gerador de chaves RSA para desenvolvimento
 */

// Configuração mais simples para evitar problemas no Windows
$config = array(
    "private_key_bits" => 2048,
    "private_key_type" => OPENSSL_KEYTYPE_RSA,
);

echo "Gerando chaves RSA...\n";

// Gerar par de chaves
$res = openssl_pkey_new($config);

if (!$res) {
    die("Erro ao gerar chaves: " . openssl_error_string());
}

// Extrair chave privada
openssl_pkey_export($res, $privateKey);

// Extrair chave pública
$keyDetails = openssl_pkey_get_details($res);
$publicKey = $keyDetails["key"];

// Salvar chaves
$keyPath = __DIR__ . '/crypto_keys/';
file_put_contents($keyPath . 'private_key.pem', $privateKey);
file_put_contents($keyPath . 'public_key.pem', $publicKey);

echo "Chaves geradas com sucesso!\n";
echo "Chave privada: " . strlen($privateKey) . " bytes\n";
echo "Chave pública: " . strlen($publicKey) . " bytes\n";

// Testar as chaves
$testData = "Hello World!";
$encrypted = '';
$decrypted = '';

if (openssl_public_encrypt($testData, $encrypted, $publicKey)) {
    if (openssl_private_decrypt($encrypted, $decrypted, $privateKey)) {
        if ($decrypted === $testData) {
            echo "✓ Teste das chaves PASSOU\n";
        } else {
            echo "✗ Teste das chaves FALHOU - dados não conferem\n";
        }
    } else {
        echo "✗ Teste das chaves FALHOU - erro na descriptografia\n";
    }
} else {
    echo "✗ Teste das chaves FALHOU - erro na criptografia\n";
}
?>
