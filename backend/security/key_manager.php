<?php
/**
 * OBLIVION RPG - KEY MANAGER
 * Gerenciador de Chaves para Criptografia Híbrida
 * 
 * Funcionalidades:
 * - Armazenamento seguro de chaves simétricas por sessão
 * - Rotação automática de chaves
 * - Cache em memória para performance
 * - Limpeza automática de chaves expiradas
 * 
 * @version 1.0
 * @author Oblivion Security Team
 */

require_once(__DIR__ . '/crypto_engine.php');

class KeyManager 
{
    // Configurações
    const KEY_EXPIRY_TIME = 3600;    // 1 hora em segundos
    const MAX_KEYS_PER_SESSION = 10; // Máximo de chaves por sessão
    const CLEANUP_INTERVAL = 300;    // Limpeza a cada 5 minutos
    
    // Cache de chaves em memória
    private static $sessionKeys = [];
    private static $lastCleanup = 0;
    
    /**
     * Inicializa o gerenciador de chaves
     */
    public static function initialize()
    {
        // Inicia sessão se não estiver iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Executa limpeza automática se necessário
        self::autoCleanup();
        
        return true;
    }
    
    /**
     * Armazena uma chave simétrica para a sessão atual
     * @param string $symmetricKey Chave simétrica
     * @param string $keyId Identificador único da chave (opcional)
     * @return string ID da chave armazenada
     */
    public static function storeSessionKey($symmetricKey, $keyId = null)
    {
        self::initialize();
        
        $sessionId = session_id();
        if (empty($sessionId)) {
            throw new Exception("Sessão não iniciada");
        }
        
        // Gera ID único se não fornecido
        if ($keyId === null) {
            $keyId = self::generateKeyId();
        }
        
        // Inicializa array da sessão se necessário
        if (!isset(self::$sessionKeys[$sessionId])) {
            self::$sessionKeys[$sessionId] = [];
        }
        
        // Verifica limite de chaves por sessão
        if (count(self::$sessionKeys[$sessionId]) >= self::MAX_KEYS_PER_SESSION) {
            // Remove a chave mais antiga
            $oldestKey = array_keys(self::$sessionKeys[$sessionId])[0];
            unset(self::$sessionKeys[$sessionId][$oldestKey]);
        }
        
        // Armazena chave com timestamp
        self::$sessionKeys[$sessionId][$keyId] = [
            'key' => $symmetricKey,
            'created' => time(),
            'last_used' => time(),
            'usage_count' => 0
        ];
        
        return $keyId;
    }
    
    /**
     * Recupera uma chave simétrica da sessão atual
     * @param string $keyId ID da chave
     * @return string|false Chave simétrica ou false se não encontrada
     */
    public static function getSessionKey($keyId = null)
    {
        self::initialize();
        
        $sessionId = session_id();
        if (empty($sessionId)) {
            return false;
        }
        
        // Se não há ID específico, pega a chave mais recente
        if ($keyId === null) {
            if (!isset(self::$sessionKeys[$sessionId]) || empty(self::$sessionKeys[$sessionId])) {
                return false;
            }
            
            $keys = self::$sessionKeys[$sessionId];
            $latestKey = end($keys);
            $keyId = key($keys);
        }
        
        // Verifica se a chave existe
        if (!isset(self::$sessionKeys[$sessionId][$keyId])) {
            return false;
        }
        
        $keyData = self::$sessionKeys[$sessionId][$keyId];
        
        // Verifica se a chave não expirou
        if (time() - $keyData['created'] > self::KEY_EXPIRY_TIME) {
            unset(self::$sessionKeys[$sessionId][$keyId]);
            return false;
        }
        
        // Atualiza estatísticas de uso
        self::$sessionKeys[$sessionId][$keyId]['last_used'] = time();
        self::$sessionKeys[$sessionId][$keyId]['usage_count']++;
        
        return $keyData['key'];
    }
    
    /**
     * Estabelece uma nova chave simétrica para a sessão
     * @return array Array com keyId e chave gerada
     */
    public static function establishSessionKey()
    {
        // Gera nova chave simétrica
        $symmetricKey = CryptoEngine::generateSymmetricKey();
        
        // Armazena a chave
        $keyId = self::storeSessionKey($symmetricKey);
        
        return [
            'keyId' => $keyId,
            'key' => $symmetricKey
        ];
    }
    
    /**
     * Processa troca de chaves com o cliente
     * @param string $encryptedSymmetricKey Chave simétrica criptografada com RSA
     * @return array|false Resposta da troca de chaves ou false em caso de erro
     */
    public static function processKeyExchange($encryptedSymmetricKey)
    {
        try {
            // Descriptografa a chave simétrica enviada pelo cliente
            $symmetricKey = CryptoEngine::decryptSymmetricKey($encryptedSymmetricKey);
            
            if ($symmetricKey === false) {
                throw new Exception("Falha ao descriptografar chave simétrica");
            }
            
            // Armazena a chave para a sessão
            $keyId = self::storeSessionKey($symmetricKey);
            
            // Gera resposta criptografada para confirmação
            $response = CryptoEngine::encryptData([
                'status' => 'key_exchange_success',
                'keyId' => $keyId,
                'message' => 'Chave estabelecida com sucesso'
            ], $symmetricKey);
            
            if ($response === false) {
                throw new Exception("Falha ao criptografar resposta");
            }
            
            return $response;
            
        } catch (Exception $e) {
            error_log("KeyManager::processKeyExchange() - " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Rotaciona chave da sessão (gera nova chave)
     * @return array|false Nova chave ou false em caso de erro
     */
    public static function rotateSessionKey()
    {
        try {
            $sessionId = session_id();
            if (empty($sessionId)) {
                throw new Exception("Sessão não iniciada");
            }
            
            // Estabelece nova chave
            $newKeyData = self::establishSessionKey();
            
            // Log da rotação
            error_log("KeyManager: Chave rotacionada para sessão {$sessionId}");
            
            return $newKeyData;
            
        } catch (Exception $e) {
            error_log("KeyManager::rotateSessionKey() - " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Remove chave específica da sessão
     * @param string $keyId ID da chave a ser removida
     * @return bool True se removida com sucesso
     */
    public static function removeSessionKey($keyId)
    {
        $sessionId = session_id();
        if (empty($sessionId)) {
            return false;
        }
        
        if (isset(self::$sessionKeys[$sessionId][$keyId])) {
            unset(self::$sessionKeys[$sessionId][$keyId]);
            return true;
        }
        
        return false;
    }
    
    /**
     * Remove todas as chaves da sessão atual
     * @return bool True se removidas com sucesso
     */
    public static function clearSessionKeys()
    {
        $sessionId = session_id();
        if (empty($sessionId)) {
            return false;
        }
        
        if (isset(self::$sessionKeys[$sessionId])) {
            unset(self::$sessionKeys[$sessionId]);
            return true;
        }
        
        return false;
    }
    
    /**
     * Obtém estatísticas de uso das chaves
     * @return array Estatísticas de uso
     */
    public static function getKeyStats()
    {
        $sessionId = session_id();
        if (empty($sessionId) || !isset(self::$sessionKeys[$sessionId])) {
            return [];
        }
        
        $stats = [];
        foreach (self::$sessionKeys[$sessionId] as $keyId => $keyData) {
            $stats[$keyId] = [
                'created' => $keyData['created'],
                'last_used' => $keyData['last_used'],
                'usage_count' => $keyData['usage_count'],
                'age' => time() - $keyData['created']
            ];
        }
        
        return $stats;
    }
    
    /**
     * Limpeza automática de chaves expiradas
     */
    public static function autoCleanup()
    {
        $now = time();
        
        // Verifica se é hora de fazer limpeza
        if ($now - self::$lastCleanup < self::CLEANUP_INTERVAL) {
            return;
        }
        
        $removedCount = 0;
        
        // Percorre todas as sessões
        foreach (self::$sessionKeys as $sessionId => $keys) {
            // Percorre chaves da sessão
            foreach ($keys as $keyId => $keyData) {
                // Remove chaves expiradas
                if ($now - $keyData['created'] > self::KEY_EXPIRY_TIME) {
                    unset(self::$sessionKeys[$sessionId][$keyId]);
                    $removedCount++;
                }
            }
            
            // Remove sessão se não há mais chaves
            if (empty(self::$sessionKeys[$sessionId])) {
                unset(self::$sessionKeys[$sessionId]);
            }
        }
        
        self::$lastCleanup = $now;
        
        if ($removedCount > 0) {
            error_log("KeyManager: Limpeza automática removeu {$removedCount} chaves expiradas");
        }
    }
    
    /**
     * Força limpeza completa de todas as chaves
     */
    public static function forceCleanup()
    {
        $totalKeys = 0;
        foreach (self::$sessionKeys as $keys) {
            $totalKeys += count($keys);
        }
        
        self::$sessionKeys = [];
        self::$lastCleanup = time();
        
        error_log("KeyManager: Limpeza forçada removeu {$totalKeys} chaves");
    }
    
    /**
     * Gera ID único para chave
     * @return string ID único
     */
    private static function generateKeyId()
    {
        return 'key_' . bin2hex(random_bytes(8)) . '_' . time();
    }
    
    /**
     * Obtém informações gerais do gerenciador
     * @return array Informações do sistema
     */
    public static function getSystemInfo()
    {
        $totalSessions = count(self::$sessionKeys);
        $totalKeys = 0;
        
        foreach (self::$sessionKeys as $keys) {
            $totalKeys += count($keys);
        }
        
        return [
            'total_sessions' => $totalSessions,
            'total_keys' => $totalKeys,
            'last_cleanup' => self::$lastCleanup,
            'cleanup_interval' => self::CLEANUP_INTERVAL,
            'key_expiry_time' => self::KEY_EXPIRY_TIME,
            'max_keys_per_session' => self::MAX_KEYS_PER_SESSION
        ];
    }
    
    /**
     * Verifica se uma sessão possui chaves válidas
     * @param string $sessionId ID da sessão (opcional, usa atual se não fornecido)
     * @return bool True se possui chaves válidas
     */
    public static function hasValidKeys($sessionId = null)
    {
        if ($sessionId === null) {
            $sessionId = session_id();
        }
        
        if (!isset(self::$sessionKeys[$sessionId])) {
            return false;
        }
        
        $now = time();
        foreach (self::$sessionKeys[$sessionId] as $keyData) {
            if ($now - $keyData['created'] <= self::KEY_EXPIRY_TIME) {
                return true;
            }
        }
        
        return false;
    }
}

// Registra função de limpeza automática no shutdown
register_shutdown_function([KeyManager::class, 'autoCleanup']);
