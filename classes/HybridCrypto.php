<?php
require_once __DIR__ . '/../config/crypto_config.php';

class HybridCrypto {
    
    public static function encryptData($data) {
        // Gerar chave AES aleatória
        $aesKey = random_bytes(32); // 256 bits
        $iv = random_bytes(16); // 128 bits
        
        // Criptografar dados com AES
        $encryptedData = openssl_encrypt(
            json_encode($data),
            'aes-256-cbc',
            $aesKey,
            OPENSSL_RAW_DATA,
            $iv
        );
        
        if ($encryptedData === false) {
            throw new Exception("Erro ao criptografar dados com AES");
        }
        
        // Criptografar chave AES com RSA
        $publicKey = CryptoConfig::getPublicKey();
        $encryptedAesKey = '';
        
        if (!openssl_public_encrypt(base64_encode($aesKey), $encryptedAesKey, $publicKey, OPENSSL_PKCS1_PADDING)) {
            throw new Exception("Erro ao criptografar chave AES com RSA");
        }
        
        return [
            'encryptedData' => base64_encode($encryptedData),
            'encryptedAesKey' => base64_encode($encryptedAesKey),
            'iv' => bin2hex($iv)
        ];
    }
    
    public static function decryptData($encryptedData, $encryptedAesKey, $iv) {
        // Descriptografar chave AES com RSA
        $privateKey = CryptoConfig::getPrivateKey();
        $decryptedAesKey = '';
        
        if (!openssl_private_decrypt(base64_decode($encryptedAesKey), $decryptedAesKey, $privateKey, OPENSSL_PKCS1_PADDING)) {
            throw new Exception("Erro ao descriptografar chave AES: " . openssl_error_string());
        }
        
        // Converter chave AES de volta para binário
        $aesKeyBinary = base64_decode($decryptedAesKey);
        
        // Descriptografar dados com AES
        $decryptedData = openssl_decrypt(
            base64_decode($encryptedData),
            'aes-256-cbc',
            $aesKeyBinary,
            OPENSSL_RAW_DATA,
            hex2bin($iv)
        );
        
        if ($decryptedData === false) {
            throw new Exception("Erro ao descriptografar dados com AES");
        }
        
        return json_decode($decryptedData, true);
    }
}
?>
