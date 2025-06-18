<?php
/**
 * CryptoManager - Gerenciador de Criptografia Híbrida
 * 
 * Implementa criptografia ponta-a-ponta usando:
 * - AES-256-CBC para dados (simétrica)
 * - RSA-2048 para chaves (assimétrica)
 * - IV aleatório para cada operação
 * - Padding PKCS#7
 */

class CryptoManager 
{
    private static $instance = null;
    private $privateKey;
    private $publicKey;
    private $keysPath;
    
    private function __construct() {
        $this->keysPath = __DIR__ . '/keys/';
        $this->loadKeys();
    }
    
    /**
     * Singleton pattern
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Carrega as chaves RSA
     */
    private function loadKeys() {
        $privateKeyPath = $this->keysPath . 'private.key';
        $publicKeyPath = $this->keysPath . 'public.key';
        
        if (!file_exists($privateKeyPath) || !file_exists($publicKeyPath)) {
            throw new Exception("Chaves RSA não encontradas. Execute generate_keys.php primeiro.");
        }
        
        $this->privateKey = file_get_contents($privateKeyPath);
        $this->publicKey = file_get_contents($publicKeyPath);
        
        if (!$this->privateKey || !$this->publicKey) {
            throw new Exception("Erro ao carregar chaves RSA.");
        }
    }
    
    /**
     * Descriptografa dados recebidos do frontend
     */
    public function decryptRequest($encryptedData) {
        try {
            // Validar estrutura dos dados
            if (!isset($encryptedData['encryptedMessage']) || 
                !isset($encryptedData['encryptedAesKey']) || 
                !isset($encryptedData['aesIv'])) {
                throw new Exception("Dados criptografados incompletos");
            }
            
            $encryptedMessage = base64_decode($encryptedData['encryptedMessage']);
            $encryptedAesKey = base64_decode($encryptedData['encryptedAesKey']);
            $aesIv = hex2bin($encryptedData['aesIv']);
            
            // 1. Descriptografar chave AES com RSA privada
            $decryptedAesKey = '';
            if (!openssl_private_decrypt($encryptedAesKey, $decryptedAesKey, $this->privateKey, OPENSSL_PKCS1_OAEP_PADDING)) {
                throw new Exception("Erro ao descriptografar chave AES: " . openssl_error_string());
            }
            
            // 2. Descriptografar mensagem com AES
            $decryptedMessage = openssl_decrypt(
                $encryptedMessage,
                'aes-256-cbc',
                base64_decode($decryptedAesKey),
                OPENSSL_RAW_DATA,
                $aesIv
            );
            
            if ($decryptedMessage === false) {
                throw new Exception("Erro ao descriptografar mensagem: " . openssl_error_string());
            }
            
            // Decodificar JSON se aplicável
            $jsonData = json_decode($decryptedMessage, true);
            return $jsonData !== null ? $jsonData : $decryptedMessage;
            
        } catch (Exception $e) {
            error_log("CryptoManager decryptRequest: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Criptografa dados para envio ao frontend
     */
    public function encryptResponse($data) {
        try {
            // Converter para JSON se necessário
            $message = is_string($data) ? $data : json_encode($data);
            
            // 1. Gerar chave AES e IV aleatórios
            $aesKey = $this->generateAESKey();
            $aesIv = $this->generateIV();
            
            // 2. Criptografar mensagem com AES
            $encryptedMessage = openssl_encrypt(
                $message,
                'aes-256-cbc',
                base64_decode($aesKey),
                OPENSSL_RAW_DATA,
                $aesIv
            );
            
            if ($encryptedMessage === false) {
                throw new Exception("Erro ao criptografar mensagem: " . openssl_error_string());
            }
            
            // 3. Criptografar chave AES com RSA pública
            $encryptedAesKey = '';
            if (!openssl_public_encrypt($aesKey, $encryptedAesKey, $this->publicKey, OPENSSL_PKCS1_OAEP_PADDING)) {
                throw new Exception("Erro ao criptografar chave AES: " . openssl_error_string());
            }
            
            // 4. Retornar dados criptografados
            return [
                'encryptedMessage' => base64_encode($encryptedMessage),
                'encryptedAesKey' => base64_encode($encryptedAesKey),
                'aesIv' => bin2hex($aesIv)
            ];
            
        } catch (Exception $e) {
            error_log("CryptoManager encryptResponse: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Gera chave AES-256 aleatória
     */
    private function generateAESKey() {
        return base64_encode(random_bytes(32)); // 256 bits
    }
    
    /**
     * Gera IV aleatório para AES
     */
    private function generateIV() {
        return random_bytes(16); // 128 bits
    }
    
    /**
     * Retorna chave pública para o frontend
     */
    public function getPublicKey() {
        return $this->publicKey;
    }
    
    /**
     * Verifica se o request contém dados criptografados
     */
    public function isEncryptedRequest($data) {
        return isset($data['encryptedMessage']) && 
               isset($data['encryptedAesKey']) && 
               isset($data['aesIv']);
    }
    
    /**
     * Processa request automaticamente (criptografado ou não)
     */
    public function processRequest($data) {
        if ($this->isEncryptedRequest($data)) {
            return $this->decryptRequest($data);
        }
        return $data;
    }
    
    /**
     * Processa response automaticamente
     */
    public function processResponse($data, $forceEncrypt = true) {
        if ($forceEncrypt) {
            return $this->encryptResponse($data);
        }
        return $data;
    }
}
?>
