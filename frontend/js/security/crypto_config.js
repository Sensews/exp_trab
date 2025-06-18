/**
 * OBLIVION RPG - CRYPTO CONFIG (Frontend)
 * Configurações de Criptografia para o Cliente
 * 
 * @version 1.0
 * @author Oblivion Security Team
 */

const CryptoConfig = {
    // URLs base
    BASE_URL: '../backend/security/session_crypto.php',
    
    // Configurações de criptografia
    ENCRYPTION_ENABLED: true,
    AUTO_HANDSHAKE: true,
    AUTO_ROTATION: true,
    
    // Configurações de timing (em milissegundos)
    HANDSHAKE_TIMEOUT: 10000,
    KEY_ROTATION_INTERVAL: 3600000, // 1 hora
    QUEUE_TIMEOUT: 30000,
    MAX_AGE: 300000, // 5 minutos
    
    // Configurações de retry
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY_BASE: 1000, // Base para backoff exponencial
    
    // Configurações de queue
    QUEUE_ENABLED: true,
    MAX_QUEUE_SIZE: 50,
    
    // Padrões de URL para criptografia (regex strings)
    ENCRYPTION_PATTERNS: [
        '\\/backend\\/.*\\.php$',
        'login\\.php$',
        'cadastro\\.php$',
        'perfil\\.php$',
        'chat_party\\.php$',
        'anotacoes\\.php$',
        'ficha\\.php$',
        'teste_post\\.php$',
        'criar_party\\.php$',
        'entrar_party\\.php$',
        'map\\.php$'
    ],
    
    // Padrões de URL para ignorar (regex strings)
    IGNORE_PATTERNS: [
        'verificar_sessao\\.php$',
        'logout\\.php$',
        '\\.(css|js|png|jpg|jpeg|gif|svg|ico)$',
        'crypto_action='
    ],
    
    // Configurações de debug
    DEBUG_MODE: false,
    VERBOSE_LOGGING: false,
    
    // Configurações de segurança
    ENABLE_SECURITY_CHECKS: true,
    MONITOR_SUSPICIOUS_ACTIVITY: true,
    SECURITY_CHECK_INTERVAL: 60000, // 1 minuto
    
    /**
     * Converte padrões string para RegExp
     */
    getEncryptionPatterns() {
        return this.ENCRYPTION_PATTERNS.map(pattern => new RegExp(pattern));
    },
    
    /**
     * Converte padrões string para RegExp
     */
    getIgnorePatterns() {
        return this.IGNORE_PATTERNS.map(pattern => new RegExp(pattern));
    },
    
    /**
     * Configuração para CryptoClient
     */
    getCryptoClientConfig() {
        return {
            baseUrl: this.BASE_URL,
            autoHandshake: this.AUTO_HANDSHAKE,
            timeout: this.HANDSHAKE_TIMEOUT,
            maxRetries: this.MAX_RETRY_ATTEMPTS,
            debug: this.DEBUG_MODE
        };
    },
    
    /**
     * Configuração para KeyExchange
     */
    getKeyExchangeConfig() {
        return {
            autoRotation: this.AUTO_ROTATION,
            rotationInterval: this.KEY_ROTATION_INTERVAL,
            securityChecks: this.ENABLE_SECURITY_CHECKS,
            timeout: this.HANDSHAKE_TIMEOUT,
            maxRetries: this.MAX_RETRY_ATTEMPTS
        };
    },
    
    /**
     * Configuração para SecureRequest
     */
    getSecureRequestConfig() {
        return {
            autoEncrypt: this.ENCRYPTION_ENABLED,
            enableQueue: this.QUEUE_ENABLED,
            maxQueueSize: this.MAX_QUEUE_SIZE,
            queueTimeout: this.QUEUE_TIMEOUT,
            encryptionPatterns: this.getEncryptionPatterns(),
            ignoredPatterns: this.getIgnorePatterns(),
            interceptFetch: true,
            interceptXHR: true
        };
    },
    
    /**
     * Configuração completa para inicialização
     */
    getFullConfig() {
        return {
            cryptoClient: this.getCryptoClientConfig(),
            keyExchange: this.getKeyExchangeConfig(),
            secureRequest: this.getSecureRequestConfig(),
            debug: this.DEBUG_MODE,
            verbose: this.VERBOSE_LOGGING
        };
    }
};

// Adiciona log de debug se habilitado
if (CryptoConfig.DEBUG_MODE) {
    console.log('CryptoConfig carregado:', CryptoConfig.getFullConfig());
}

// Exporta para uso global
window.CryptoConfig = CryptoConfig;
