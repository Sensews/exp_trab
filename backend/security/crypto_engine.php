<?php
/**
 * OBLIVION RPG - CRYPTO ENGINE
 * Motor Principal de Criptografia Híbrida Ponta-a-Ponta
 * 
 * Implementa criptografia híbrida com:
 * - RSA-4096 para troca de chaves
 * - AES-256-GCM para dados
 * - IV aleatório por mensagem
 * - HMAC-SHA256 para integridade
 * 
 * @version 1.0
 * @author Oblivion Security Team
 */

class CryptoEngine 
{
    // Configurações de criptografia
    const RSA_KEY_SIZE = 4096;
    const AES_KEY_SIZE = 32;        // 256 bits
    const IV_SIZE = 16;             // 128 bits para GCM
    const TAG_SIZE = 16;            // 128 bits para autenticação GCM
    const CIPHER_METHOD = 'aes-256-gcm';
    const HASH_ALGO = 'sha256';
    
    // Chaves estáticas para esta sessão
    private static $rsaPublicKey = null;
    private static $rsaPrivateKey = null;
    private static $sessionKeys = [];
    
    /**
     * Inicializa o motor de criptografia
     * Gera par de chaves RSA se necessário
     */
    public static function initialize()
    {
        try {
            // Verifica se as chaves RSA já existem
            if (self::$rsaPublicKey === null || self::$rsaPrivateKey === null) {
                self::generateOrLoadRSAKeys();
            }
            
            return true;
        } catch (Exception $e) {
            error_log("CryptoEngine::initialize() - " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Gera ou carrega par de chaves RSA
     */
    private static function generateOrLoadRSAKeys()
    {
        $keyPath = __DIR__ . '/keys/';
        $publicKeyFile = $keyPath . 'public.pem';
        $privateKeyFile = $keyPath . 'private.pem';
        
        // Cria diretório se não existir
        if (!is_dir($keyPath)) {
            mkdir($keyPath, 0700, true);
        }
        
        // Verifica se as chaves já existem
        if (file_exists($publicKeyFile) && file_exists($privateKeyFile)) {
            self::$rsaPublicKey = file_get_contents($publicKeyFile);
            self::$rsaPrivateKey = file_get_contents($privateKeyFile);
            return;
        }
        
        // Gera novo par de chaves RSA-4096
        $config = [
            "digest_alg" => "sha256",
            "private_key_bits" => self::RSA_KEY_SIZE,
            "private_key_type" => OPENSSL_KEYTYPE_RSA,
        ];
        
        $res = openssl_pkey_new($config);
        if (!$res) {
            throw new Exception("Falha ao gerar chaves RSA: " . openssl_error_string());
        }
        
        // Extrai chave privada
        openssl_pkey_export($res, $privateKey);
        
        // Extrai chave pública
        $publicKeyDetails = openssl_pkey_get_details($res);
        $publicKey = $publicKeyDetails["key"];
        
        // Salva as chaves em arquivos
        file_put_contents($privateKeyFile, $privateKey);
        file_put_contents($publicKeyFile, $publicKey);
        
        // Define permissões restritas
        chmod($privateKeyFile, 0600);
        chmod($publicKeyFile, 0644);
        
        self::$rsaPrivateKey = $privateKey;
        self::$rsaPublicKey = $publicKey;
    }
    
    /**
     * Retorna a chave pública RSA para o cliente
     */
    public static function getPublicKey()
    {
        if (self::$rsaPublicKey === null) {
            self::initialize();
        }
        
        return base64_encode(self::$rsaPublicKey);
    }
    
    /**
     * Descriptografa uma chave simétrica enviada pelo cliente
     * @param string $encryptedKey Chave AES criptografada com RSA (base64)
     * @return string|false Chave AES descriptografada ou false em caso de erro
     */
    public static function decryptSymmetricKey($encryptedKey)
    {
        try {
            $encryptedKeyBinary = base64_decode($encryptedKey);
            
            $success = openssl_private_decrypt(
                $encryptedKeyBinary,
                $decryptedKey,
                self::$rsaPrivateKey,
                OPENSSL_PKCS1_OAEP_PADDING
            );
            
            if (!$success) {
                throw new Exception("Falha ao descriptografar chave simétrica: " . openssl_error_string());
            }
            
            return $decryptedKey;
        } catch (Exception $e) {
            error_log("CryptoEngine::decryptSymmetricKey() - " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Gera uma chave simétrica aleatória
     * @return string Chave AES-256 de 32 bytes
     */
    public static function generateSymmetricKey()
    {
        return random_bytes(self::AES_KEY_SIZE);
    }
    
    /**
     * Gera um IV (Initialization Vector) aleatório
     * @return string IV de 16 bytes
     */
    public static function generateIV()
    {
        return random_bytes(self::IV_SIZE);
    }
    
    /**
     * Criptografa dados usando AES-256-GCM
     * @param string $data Dados a serem criptografados
     * @param string $key Chave AES-256
     * @return array|false Array com dados criptografados ou false em caso de erro
     */
    public static function encryptAES($data, $key)
    {
        try {
            $iv = self::generateIV();
            $tag = '';
            
            $encrypted = openssl_encrypt(
                $data,
                self::CIPHER_METHOD,
                $key,
                OPENSSL_RAW_DATA,
                $iv,
                $tag
            );
            
            if ($encrypted === false) {
                throw new Exception("Falha na criptografia AES: " . openssl_error_string());
            }
            
            return [
                'data' => base64_encode($encrypted),
                'iv' => base64_encode($iv),
                'tag' => base64_encode($tag),
                'method' => self::CIPHER_METHOD
            ];
        } catch (Exception $e) {
            error_log("CryptoEngine::encryptAES() - " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Descriptografa dados usando AES-256-GCM
     * @param array $encryptedData Array com dados criptografados
     * @param string $key Chave AES-256
     * @return string|false Dados descriptografados ou false em caso de erro
     */
    public static function decryptAES($encryptedData, $key)
    {
        try {
            if (!isset($encryptedData['data'], $encryptedData['iv'], $encryptedData['tag'])) {
                throw new Exception("Dados criptografados incompletos");
            }
            
            $data = base64_decode($encryptedData['data']);
            $iv = base64_decode($encryptedData['iv']);
            $tag = base64_decode($encryptedData['tag']);
            
            $decrypted = openssl_decrypt(
                $data,
                self::CIPHER_METHOD,
                $key,
                OPENSSL_RAW_DATA,
                $iv,
                $tag
            );
            
            if ($decrypted === false) {
                throw new Exception("Falha na descriptografia AES: " . openssl_error_string());
            }
            
            return $decrypted;
        } catch (Exception $e) {
            error_log("CryptoEngine::decryptAES() - " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Gera HMAC para validação de integridade
     * @param string $data Dados para gerar HMAC
     * @param string $key Chave para HMAC
     * @return string HMAC em base64
     */
    public static function generateHMAC($data, $key)
    {
        return base64_encode(hash_hmac(self::HASH_ALGO, $data, $key, true));
    }
    
    /**
     * Verifica HMAC para validação de integridade
     * @param string $data Dados originais
     * @param string $hmac HMAC a ser verificado (base64)
     * @param string $key Chave para HMAC
     * @return bool True se válido, false caso contrário
     */
    public static function verifyHMAC($data, $hmac, $key)
    {
        $expectedHmac = self::generateHMAC($data, $key);
        return hash_equals($expectedHmac, $hmac);
    }
    
    /**
     * Criptografa dados completos (dados + HMAC)
     * @param mixed $data Dados a serem criptografados (será serializado se não for string)
     * @param string $symmetricKey Chave simétrica
     * @return array|false Dados criptografados ou false em caso de erro
     */
    public static function encryptData($data, $symmetricKey)
    {
        try {
            // Serializa dados se necessário
            if (!is_string($data)) {
                $data = json_encode($data);
            }
            
            // Gera timestamp para prevenir replay attacks
            $timestamp = time();
            $payload = json_encode([
                'data' => $data,
                'timestamp' => $timestamp
            ]);
            
            // Gera HMAC para integridade
            $hmac = self::generateHMAC($payload, $symmetricKey);
            
            // Adiciona HMAC ao payload
            $finalPayload = json_encode([
                'payload' => $payload,
                'hmac' => $hmac
            ]);
            
            // Criptografa o payload final
            return self::encryptAES($finalPayload, $symmetricKey);
            
        } catch (Exception $e) {
            error_log("CryptoEngine::encryptData() - " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Descriptografa e valida dados completos
     * @param array $encryptedData Dados criptografados
     * @param string $symmetricKey Chave simétrica
     * @param int $maxAge Idade máxima em segundos (padrão: 300s = 5min)
     * @return mixed|false Dados descriptografados ou false em caso de erro
     */
    public static function decryptData($encryptedData, $symmetricKey, $maxAge = 300)
    {
        try {
            // Descriptografa dados
            $decryptedPayload = self::decryptAES($encryptedData, $symmetricKey);
            if ($decryptedPayload === false) {
                throw new Exception("Falha na descriptografia dos dados");
            }
            
            // Decodifica payload
            $payloadData = json_decode($decryptedPayload, true);
            if (!isset($payloadData['payload'], $payloadData['hmac'])) {
                throw new Exception("Estrutura de payload inválida");
            }
            
            // Verifica HMAC
            if (!self::verifyHMAC($payloadData['payload'], $payloadData['hmac'], $symmetricKey)) {
                throw new Exception("HMAC inválido - dados podem ter sido alterados");
            }
            
            // Decodifica dados internos
            $innerData = json_decode($payloadData['payload'], true);
            if (!isset($innerData['data'], $innerData['timestamp'])) {
                throw new Exception("Estrutura de dados interna inválida");
            }
            
            // Verifica timestamp para prevenir replay attacks
            $age = time() - $innerData['timestamp'];
            if ($age > $maxAge) {
                throw new Exception("Dados expirados (idade: {$age}s, máx: {$maxAge}s)");
            }
            
            // Retorna dados decodificados
            $finalData = $innerData['data'];
            $decoded = json_decode($finalData, true);
            
            // Retorna dados decodificados se for JSON válido, senão retorna string
            return (json_last_error() === JSON_ERROR_NONE) ? $decoded : $finalData;
            
        } catch (Exception $e) {
            error_log("CryptoEngine::decryptData() - " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Limpa chaves da memória (chamado no final da requisição)
     */
    public static function cleanup()
    {
        self::$sessionKeys = [];
    }
    
    /**
     * Gera uma resposta de erro padronizada
     * @param string $message Mensagem de erro
     * @return array Resposta de erro
     */
    public static function errorResponse($message = "Erro de criptografia")
    {
        return [
            'status' => 'crypto_error',
            'message' => $message,
            'timestamp' => time()
        ];
    }
    
    /**
     * Gera uma resposta de sucesso padronizada
     * @param mixed $data Dados da resposta
     * @return array Resposta de sucesso
     */
    public static function successResponse($data)
    {
        return [
            'status' => 'success',
            'data' => $data,
            'timestamp' => time()
        ];
    }
}

// Inicializa automaticamente quando incluído
CryptoEngine::initialize();
