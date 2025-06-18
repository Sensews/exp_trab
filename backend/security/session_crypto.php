<?php
/**
 * OBLIVION RPG - SESSION CRYPTO
 * Integração de Criptografia com Sistema de Sessões
 * 
 * Funcionalidades:
 * - Middleware transparente para interceptação de requisições
 * - Integração com sistema de sessões existente
 * - Validação automática de requests criptografados
 * - Interceptação de $_POST, $_GET e php://input
 * 
 * @version 1.0
 * @author Oblivion Security Team
 */

require_once(__DIR__ . '/crypto_engine.php');
require_once(__DIR__ . '/key_manager.php');

class SessionCrypto 
{
    // Estados da criptografia
    private static $isInitialized = false;
    private static $isEnabled = false;
    private static $currentKeyId = null;
    
    // Dados originais antes da descriptografia
    private static $originalPost = [];
    private static $originalGet = [];
    private static $originalInput = '';
    
    /**
     * Inicializa a criptografia de sessão
     * @param bool $enable Habilita criptografia automaticamente
     */
    public static function initialize($enable = true)
    {
        if (self::$isInitialized) {
            return true;
        }
        
        try {
            // Inicializa componentes base
            CryptoEngine::initialize();
            KeyManager::initialize();
            
            // Armazena dados originais
            self::$originalPost = $_POST;
            self::$originalGet = $_GET;
            self::$originalInput = file_get_contents('php://input');
            
            self::$isInitialized = true;
            
            if ($enable) {
                self::enable();
            }
            
            return true;
            
        } catch (Exception $e) {
            error_log("SessionCrypto::initialize() - " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Habilita interceptação e descriptografia automática
     */
    public static function enable()
    {
        if (!self::$isInitialized) {
            self::initialize();
        }
        
        // Processa requisições criptografadas
        self::processEncryptedRequest();
        
        self::$isEnabled = true;
    }
    
    /**
     * Desabilita interceptação automática
     */
    public static function disable()
    {
        self::$isEnabled = false;
    }
    
    /**
     * Verifica se a criptografia está habilitada
     * @return bool True se habilitada
     */
    public static function isEnabled()
    {
        return self::$isEnabled;
    }
    
    /**
     * Processa requisições criptografadas
     */
    private static function processEncryptedRequest()
    {
        try {
            // Verifica se há dados criptografados em POST
            if (self::hasEncryptedData($_POST)) {
                $_POST = self::decryptRequestData($_POST);
            }
            
            // Verifica se há dados criptografados em GET
            if (self::hasEncryptedData($_GET)) {
                $_GET = self::decryptRequestData($_GET);
            }
            
            // Verifica php://input para dados JSON criptografados
            if (!empty(self::$originalInput)) {
                $inputData = json_decode(self::$originalInput, true);
                if ($inputData && self::hasEncryptedData($inputData)) {
                    $decryptedInput = self::decryptRequestData($inputData);
                    // Não podemos modificar php://input, mas podemos disponibilizar os dados
                    $GLOBALS['_DECRYPTED_INPUT'] = $decryptedInput;
                }
            }
            
        } catch (Exception $e) {
            error_log("SessionCrypto::processEncryptedRequest() - " . $e->getMessage());
        }
    }
    
    /**
     * Verifica se os dados contêm informações criptografadas
     * @param array $data Dados a serem verificados
     * @return bool True se contém dados criptografados
     */
    private static function hasEncryptedData($data)
    {
        if (!is_array($data)) {
            return false;
        }
        
        // Procura por estrutura de dados criptografados
        return isset($data['encrypted_data']) && 
               isset($data['encrypted_data']['data']) && 
               isset($data['encrypted_data']['iv']) && 
               isset($data['encrypted_data']['tag']);
    }
    
    /**
     * Descriptografa dados de requisição
     * @param array $data Dados criptografados
     * @return array Dados descriptografados
     */
    private static function decryptRequestData($data)
    {
        try {
            if (!isset($data['encrypted_data'])) {
                return $data;
            }
            
            $encryptedData = $data['encrypted_data'];
            $keyId = $data['key_id'] ?? null;
            
            // Obtém chave simétrica
            $symmetricKey = KeyManager::getSessionKey($keyId);
            if ($symmetricKey === false) {
                throw new Exception("Chave simétrica não encontrada para keyId: " . $keyId);
            }
            
            // Descriptografa dados
            $decryptedData = CryptoEngine::decryptData($encryptedData, $symmetricKey);
            if ($decryptedData === false) {
                throw new Exception("Falha ao descriptografar dados da requisição");
            }
            
            // Mescla dados descriptografados com não criptografados
            $result = $data;
            unset($result['encrypted_data']);
            unset($result['key_id']);
            
            if (is_array($decryptedData)) {
                $result = array_merge($result, $decryptedData);
            }
            
            return $result;
            
        } catch (Exception $e) {
            error_log("SessionCrypto::decryptRequestData() - " . $e->getMessage());
            return $data; // Retorna dados originais em caso de erro
        }
    }
    
    /**
     * Criptografa resposta antes de enviar ao cliente
     * @param mixed $data Dados a serem criptografados
     * @param string $keyId ID da chave (opcional)
     * @return array|false Resposta criptografada ou false em caso de erro
     */
    public static function encryptResponse($data, $keyId = null)
    {
        try {
            // Obtém chave simétrica
            $symmetricKey = KeyManager::getSessionKey($keyId);
            if ($symmetricKey === false) {
                throw new Exception("Chave simétrica não encontrada");
            }
            
            // Criptografa dados
            $encryptedData = CryptoEngine::encryptData($data, $symmetricKey);
            if ($encryptedData === false) {
                throw new Exception("Falha ao criptografar resposta");
            }
            
            return [
                'encrypted_response' => $encryptedData,
                'key_id' => $keyId,
                'timestamp' => time()
            ];
            
        } catch (Exception $e) {
            error_log("SessionCrypto::encryptResponse() - " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Função auxiliar para obter dados descriptografados do php://input
     * @return mixed|null Dados descriptografados ou null
     */
    public static function getDecryptedInput()
    {
        return $GLOBALS['_DECRYPTED_INPUT'] ?? null;
    }
    
    /**
     * Processa handshake de estabelecimento de chave
     * @return array Resposta do handshake
     */
    public static function processKeyHandshake()
    {
        try {
            header('Content-Type: application/json');
            
            $action = $_GET['action'] ?? $_POST['action'] ?? null;
            
            switch ($action) {
                case 'get_public_key':
                    // Retorna chave pública RSA
                    return [
                        'status' => 'success',
                        'public_key' => CryptoEngine::getPublicKey(),
                        'timestamp' => time()
                    ];
                
                case 'exchange_key':
                    // Processa troca de chave simétrica
                    $encryptedKey = $_POST['encrypted_key'] ?? '';
                    if (empty($encryptedKey)) {
                        throw new Exception("Chave criptografada não fornecida");
                    }
                    
                    $result = KeyManager::processKeyExchange($encryptedKey);
                    if ($result === false) {
                        throw new Exception("Falha no processo de troca de chaves");
                    }
                    
                    return $result;
                
                case 'verify_encryption':
                    // Verifica se a criptografia está funcionando
                    $testData = ['test' => 'Criptografia funcionando', 'time' => time()];
                    $encrypted = self::encryptResponse($testData);
                    
                    if ($encrypted === false) {
                        throw new Exception("Falha na verificação de criptografia");
                    }
                    
                    return $encrypted;
                
                default:
                    throw new Exception("Ação de handshake inválida: " . $action);
            }
            
        } catch (Exception $e) {
            error_log("SessionCrypto::processKeyHandshake() - " . $e->getMessage());
            return CryptoEngine::errorResponse($e->getMessage());
        }
    }
    
    /**
     * Middleware que deve ser chamado no início de cada arquivo PHP
     * @param array $options Opções de configuração
     */
    public static function middleware($options = [])
    {
        // Configurações padrão
        $defaults = [
            'auto_enable' => true,
            'handle_handshake' => true,
            'require_encryption' => false
        ];
        
        $config = array_merge($defaults, $options);
        
        try {
            // Inicializa sistema
            self::initialize($config['auto_enable']);
            
            // Verifica se é requisição de handshake
            if ($config['handle_handshake'] && self::isHandshakeRequest()) {
                $response = self::processKeyHandshake();
                echo json_encode($response);
                exit;
            }
            
            // Verifica se criptografia é obrigatória
            if ($config['require_encryption'] && !self::hasValidEncryption()) {
                http_response_code(400);
                echo json_encode(CryptoEngine::errorResponse("Criptografia obrigatória"));
                exit;
            }
            
        } catch (Exception $e) {
            error_log("SessionCrypto::middleware() - " . $e->getMessage());
            if ($config['require_encryption']) {
                http_response_code(500);
                echo json_encode(CryptoEngine::errorResponse("Erro no middleware de criptografia"));
                exit;
            }
        }
    }
    
    /**
     * Verifica se é uma requisição de handshake
     * @return bool True se for handshake
     */
    private static function isHandshakeRequest()
    {
        $action = $_GET['crypto_action'] ?? $_POST['crypto_action'] ?? null;
        return in_array($action, ['get_public_key', 'exchange_key', 'verify_encryption']);
    }
    
    /**
     * Verifica se a sessão tem criptografia válida
     * @return bool True se tem criptografia válida
     */
    private static function hasValidEncryption()
    {
        return KeyManager::hasValidKeys();
    }
    
    /**
     * Obtém estatísticas do sistema de criptografia
     * @return array Estatísticas
     */
    public static function getStats()
    {
        return [
            'is_initialized' => self::$isInitialized,
            'is_enabled' => self::$isEnabled,
            'current_key_id' => self::$currentKeyId,
            'key_manager_stats' => KeyManager::getSystemInfo(),
            'session_id' => session_id()
        ];
    }
    
    /**
     * Função de limpeza chamada no final da requisição
     */
    public static function cleanup()
    {
        CryptoEngine::cleanup();
        
        // Reset estado
        self::$currentKeyId = null;
    }
}

// Registra função de limpeza
register_shutdown_function([SessionCrypto::class, 'cleanup']);
