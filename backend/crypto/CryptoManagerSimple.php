<?php
/**
 * CryptoManagerSimple PHP - Compatível com a versão JavaScript
 */

class CryptoManagerSimple {
    private static $instance = null;
    private $secretKey;
    
    private function __construct() {
        // Gerar a mesma chave derivada que o JavaScript
        $this->secretKey = $this->generateSharedKey();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function generateSharedKey() {
        // Usar a mesma chave base que o JavaScript
        return hash_pbkdf2('sha256', 'oblivion-rpg-secret-key-2025', 'oblivion-salt', 100000, 32, true);
    }
    
    public function decryptRequest($encryptedData) {
        try {
            if (!isset($encryptedData['encryptedMessage']) || 
                !isset($encryptedData['iv']) || 
                !isset($encryptedData['algorithm'])) {
                throw new Exception("Dados criptografados incompletos");
            }
            
            if ($encryptedData['algorithm'] !== 'AES-GCM') {
                throw new Exception("Algoritmo não suportado");
            }
            
            $encryptedMessage = base64_decode($encryptedData['encryptedMessage']);
            $iv = hex2bin($encryptedData['iv']);
            
            // Separar dados e tag (AES-GCM)
            $tag = substr($encryptedMessage, -16); // Últimos 16 bytes são a tag
            $ciphertext = substr($encryptedMessage, 0, -16);
            
            // Descriptografar
            $decrypted = openssl_decrypt(
                $ciphertext,
                'aes-256-gcm',
                $this->secretKey,
                OPENSSL_RAW_DATA,
                $iv,
                $tag
            );
            
            if ($decrypted === false) {
                throw new Exception("Falha na descriptografia");
            }
            
            // Tentar decodificar JSON
            $jsonData = json_decode($decrypted, true);
            return $jsonData !== null ? $jsonData : $decrypted;
            
        } catch (Exception $e) {
            error_log("CryptoManagerSimple decryptRequest: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function encryptResponse($data) {
        try {
            $message = is_string($data) ? $data : json_encode($data);
            $iv = random_bytes(12); // 96 bits para GCM
            
            // Criptografar com AES-GCM
            $tag = '';
            $encrypted = openssl_encrypt(
                $message,
                'aes-256-gcm',
                $this->secretKey,
                OPENSSL_RAW_DATA,
                $iv,
                $tag
            );
            
            if ($encrypted === false) {
                throw new Exception("Falha na criptografia");
            }
            
            // Concatenar dados criptografados com tag
            $encryptedWithTag = $encrypted . $tag;
            
            return [
                'encryptedMessage' => base64_encode($encryptedWithTag),
                'iv' => bin2hex($iv),
                'algorithm' => 'AES-GCM'
            ];
            
        } catch (Exception $e) {
            error_log("CryptoManagerSimple encryptResponse: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function isEncryptedRequest($data) {
        return isset($data['encryptedMessage']) && 
               isset($data['iv']) && 
               isset($data['algorithm']) &&
               $data['algorithm'] === 'AES-GCM';
    }
    
    public function processRequest($data = null) {
        if ($data === null) {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true) ?: $_POST;
        }
        
        if ($this->isEncryptedRequest($data)) {
            return $this->decryptRequest($data);
        }
        
        return $data;
    }
    
    public function processResponse($data, $forceEncrypt = true) {
        if ($forceEncrypt) {
            return $this->encryptResponse($data);
        }
        return $data;
    }
}
?>
