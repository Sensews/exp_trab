<?php
class CryptoConfig {
    private static $publicKeyPath = __DIR__ . '/../keys/public.key';
    private static $privateKeyPath = __DIR__ . '/../keys/private.key';
    
    public static function getPublicKey() {
        if (!file_exists(self::$publicKeyPath)) {
            throw new Exception("Chave pública não encontrada");
        }
        return file_get_contents(self::$publicKeyPath);
    }
    
    public static function getPrivateKey() {
        if (!file_exists(self::$privateKeyPath)) {
            throw new Exception("Chave privada não encontrada");
        }
        return file_get_contents(self::$privateKeyPath);
    }
    
    public static function generateKeyPair() {
        $config = [
            "digest_alg" => "sha256",
            "private_key_bits" => 2048,
            "private_key_type" => OPENSSL_KEYTYPE_RSA,
        ];
        
        $resource = openssl_pkey_new($config);
        openssl_pkey_export($resource, $privateKey);
        $details = openssl_pkey_get_details($resource);
        $publicKey = $details['key'];
        
        // Criar diretório se não existir
        if (!is_dir(dirname(self::$publicKeyPath))) {
            mkdir(dirname(self::$publicKeyPath), 0755, true);
        }
        
        file_put_contents(self::$publicKeyPath, $publicKey);
        file_put_contents(self::$privateKeyPath, $privateKey);
        
        return ['public' => $publicKey, 'private' => $privateKey];
    }
}
?>
