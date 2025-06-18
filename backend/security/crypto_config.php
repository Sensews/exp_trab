<?php
/**
 * OBLIVION RPG - CRYPTO CONFIG
 * Configurações de Criptografia
 * 
 * @version 1.0
 * @author Oblivion Security Team
 */

class CryptoConfig
{
    // Configurações de criptografia
    const ENCRYPTION_ENABLED = true;
    const REQUIRE_ENCRYPTION = false;
    const AUTO_HANDSHAKE = true;
    
    // Configurações de chaves
    const RSA_KEY_SIZE = 4096;
    const AES_KEY_SIZE = 32;
    const KEY_ROTATION_INTERVAL = 3600; // 1 hora
    const KEY_EXPIRY_TIME = 3600; // 1 hora
    
    // Configurações de segurança
    const MAX_RETRY_ATTEMPTS = 3;
    const HANDSHAKE_TIMEOUT = 10;
    const MAX_AGE_SECONDS = 300; // 5 minutos
    
    // URLs que requerem criptografia obrigatória
    const CRITICAL_ENDPOINTS = [
        'login.php',
        'cadastro.php',
        'chat_party.php',
        'perfil.php'
    ];
    
    // URLs que devem ser ignoradas
    const IGNORED_ENDPOINTS = [
        'verificar_sessao.php',
        'logout.php'
    ];
    
    /**
     * Retorna configuração completa
     */
    public static function getConfig()
    {
        return [
            'encryption_enabled' => self::ENCRYPTION_ENABLED,
            'require_encryption' => self::REQUIRE_ENCRYPTION,
            'auto_handshake' => self::AUTO_HANDSHAKE,
            'rsa_key_size' => self::RSA_KEY_SIZE,
            'aes_key_size' => self::AES_KEY_SIZE,
            'key_rotation_interval' => self::KEY_ROTATION_INTERVAL,
            'key_expiry_time' => self::KEY_EXPIRY_TIME,
            'max_retry_attempts' => self::MAX_RETRY_ATTEMPTS,
            'handshake_timeout' => self::HANDSHAKE_TIMEOUT,
            'max_age_seconds' => self::MAX_AGE_SECONDS,
            'critical_endpoints' => self::CRITICAL_ENDPOINTS,
            'ignored_endpoints' => self::IGNORED_ENDPOINTS
        ];
    }
    
    /**
     * Verifica se endpoint requer criptografia
     */
    public static function requiresEncryption($endpoint)
    {
        if (!self::ENCRYPTION_ENABLED) {
            return false;
        }
        
        $filename = basename($endpoint);
        
        // Verifica se está na lista de ignorados
        if (in_array($filename, self::IGNORED_ENDPOINTS)) {
            return false;
        }
        
        // Verifica se é crítico
        if (in_array($filename, self::CRITICAL_ENDPOINTS)) {
            return true;
        }
        
        return self::REQUIRE_ENCRYPTION;
    }
}
