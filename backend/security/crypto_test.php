<?php
/**
 * OBLIVION RPG - CRYPTO TEST
 * Arquivo de teste para validar implementação de criptografia
 * 
 * Teste completo das funcionalidades:
 * - Geração de chaves RSA
 * - Criptografia/descriptografia AES
 * - Troca de chaves
 * - Integridade de dados
 * 
 * @version 1.0
 * @author Oblivion Security Team
 */

// Inclui dependências
require_once(__DIR__ . '/crypto_engine.php');
require_once(__DIR__ . '/key_manager.php');
require_once(__DIR__ . '/session_crypto.php');

// Inicia sessão para testes
session_start();

header('Content-Type: application/json');

/**
 * Classe de testes para criptografia
 */
class CryptoTest
{
    private static $results = [];
    
    /**
     * Executa todos os testes
     */
    public static function runAllTests()
    {
        echo "=== OBLIVION CRYPTO TESTS ===\n";
        
        try {
            self::testCryptoEngine();
            self::testKeyManager();
            self::testSessionCrypto();
            self::testIntegration();
            
            self::$results['overall'] = 'PASSED';
            self::$results['message'] = 'Todos os testes passaram com sucesso!';
            
        } catch (Exception $e) {
            self::$results['overall'] = 'FAILED';
            self::$results['error'] = $e->getMessage();
        }
        
        return self::$results;
    }
    
    /**
     * Testa CryptoEngine
     */
    private static function testCryptoEngine()
    {
        echo "Testando CryptoEngine...\n";
        
        // Teste 1: Inicialização
        $initialized = CryptoEngine::initialize();
        self::assert($initialized, "CryptoEngine deve inicializar");
        
        // Teste 2: Geração de chave pública
        $publicKey = CryptoEngine::getPublicKey();
        self::assert(!empty($publicKey), "Deve gerar chave pública");
        
        // Teste 3: Geração de chave simétrica
        $symmetricKey = CryptoEngine::generateSymmetricKey();
        self::assert(strlen($symmetricKey) === 32, "Chave simétrica deve ter 32 bytes");
        
        // Teste 4: Geração de IV
        $iv = CryptoEngine::generateIV();
        self::assert(strlen($iv) === 16, "IV deve ter 16 bytes");
        
        // Teste 5: Criptografia/Descriptografia AES
        $testData = "Dados de teste para criptografia";
        $encrypted = CryptoEngine::encryptAES($testData, $symmetricKey);
        self::assert($encrypted !== false, "Deve criptografar dados");
        
        $decrypted = CryptoEngine::decryptAES($encrypted, $symmetricKey);
        self::assert($decrypted === $testData, "Deve descriptografar corretamente");
        
        // Teste 6: HMAC
        $hmac = CryptoEngine::generateHMAC($testData, $symmetricKey);
        self::assert(!empty($hmac), "Deve gerar HMAC");
        
        $hmacValid = CryptoEngine::verifyHMAC($testData, $hmac, $symmetricKey);
        self::assert($hmacValid, "HMAC deve ser válido");
        
        // Teste 7: Criptografia completa de dados
        $complexData = ['usuario' => 'teste', 'senha' => '123456', 'timestamp' => time()];
        $encryptedComplete = CryptoEngine::encryptData($complexData, $symmetricKey);
        self::assert($encryptedComplete !== false, "Deve criptografar dados completos");
        
        $decryptedComplete = CryptoEngine::decryptData($encryptedComplete, $symmetricKey);
        self::assert($decryptedComplete['usuario'] === 'teste', "Deve descriptografar dados completos");
        
        self::$results['crypto_engine'] = 'PASSED';
        echo "✅ CryptoEngine: PASSED\n";
    }
    
    /**
     * Testa KeyManager
     */
    private static function testKeyManager()
    {
        echo "Testando KeyManager...\n";
        
        // Teste 1: Inicialização
        $initialized = KeyManager::initialize();
        self::assert($initialized, "KeyManager deve inicializar");
        
        // Teste 2: Estabelecer chave de sessão
        $keyData = KeyManager::establishSessionKey();
        self::assert(isset($keyData['keyId'], $keyData['key']), "Deve estabelecer chave de sessão");
        
        // Teste 3: Recuperar chave de sessão
        $retrievedKey = KeyManager::getSessionKey($keyData['keyId']);
        self::assert($retrievedKey !== false, "Deve recuperar chave de sessão");
        
        // Teste 4: Verificar chaves válidas
        $hasValidKeys = KeyManager::hasValidKeys();
        self::assert($hasValidKeys, "Deve ter chaves válidas");
        
        // Teste 5: Estatísticas
        $stats = KeyManager::getKeyStats();
        self::assert(is_array($stats), "Deve retornar estatísticas");
        
        // Teste 6: Informações do sistema
        $systemInfo = KeyManager::getSystemInfo();
        self::assert(isset($systemInfo['total_keys']), "Deve retornar info do sistema");
        
        self::$results['key_manager'] = 'PASSED';
        echo "✅ KeyManager: PASSED\n";
    }
    
    /**
     * Testa SessionCrypto
     */
    private static function testSessionCrypto()
    {
        echo "Testando SessionCrypto...\n";
        
        // Teste 1: Inicialização
        $initialized = SessionCrypto::initialize(false); // Não ativa automaticamente
        self::assert($initialized, "SessionCrypto deve inicializar");
        
        // Teste 2: Verificar estado
        $isEnabled = SessionCrypto::isEnabled();
        self::assert(!$isEnabled, "Deve estar desabilitado inicialmente");
        
        // Teste 3: Habilitar
        SessionCrypto::enable();
        $isEnabled = SessionCrypto::isEnabled();
        self::assert($isEnabled, "Deve estar habilitado após enable()");
        
        // Teste 4: Criptografar resposta (requer chave estabelecida)
        $keyData = KeyManager::establishSessionKey();
        $testResponse = ['status' => 'success', 'data' => 'teste'];
        $encryptedResponse = SessionCrypto::encryptResponse($testResponse, $keyData['keyId']);
        self::assert($encryptedResponse !== false, "Deve criptografar resposta");
        
        // Teste 5: Obter estatísticas
        $stats = SessionCrypto::getStats();
        self::assert(isset($stats['is_initialized']), "Deve retornar estatísticas");
        
        self::$results['session_crypto'] = 'PASSED';
        echo "✅ SessionCrypto: PASSED\n";
    }
    
    /**
     * Testa integração completa
     */
    private static function testIntegration()
    {
        echo "Testando integração completa...\n";
        
        // Simula fluxo completo de handshake
        
        // 1. Cliente solicita chave pública
        $publicKey = CryptoEngine::getPublicKey();
        self::assert(!empty($publicKey), "Deve obter chave pública");
        
        // 2. Estabelece chave de sessão
        $keyData = KeyManager::establishSessionKey();
        self::assert($keyData !== false, "Deve estabelecer chave");
        
        // 3. Criptografa dados simulando cliente
        $clientData = [
            'usuario' => 'test_user',
            'senha' => 'test_password',
            'action' => 'login'
        ];
        
        $encryptedData = CryptoEngine::encryptData($clientData, $keyData['key']);
        self::assert($encryptedData !== false, "Deve criptografar dados do cliente");
        
        // 4. Simula recebimento e descriptografia no servidor
        $decryptedData = CryptoEngine::decryptData($encryptedData, $keyData['key']);
        self::assert($decryptedData['usuario'] === 'test_user', "Deve descriptografar dados do cliente");
        
        // 5. Criptografa resposta do servidor
        $serverResponse = [
            'status' => 'success',
            'message' => 'Login realizado com sucesso',
            'user_id' => 123
        ];
        
        $encryptedResponse = SessionCrypto::encryptResponse($serverResponse, $keyData['keyId']);
        self::assert($encryptedResponse !== false, "Deve criptografar resposta do servidor");
        
        // 6. Simula descriptografia da resposta no cliente
        $decryptedResponse = CryptoEngine::decryptData(
            $encryptedResponse['encrypted_response'], 
            $keyData['key']
        );
        self::assert($decryptedResponse['status'] === 'success', "Deve descriptografar resposta do servidor");
        
        self::$results['integration'] = 'PASSED';
        echo "✅ Integração: PASSED\n";
    }
    
    /**
     * Função de assert para testes
     */
    private static function assert($condition, $message)
    {
        if (!$condition) {
            throw new Exception("TESTE FALHOU: " . $message);
        }
    }
}

// Executa testes se chamado diretamente
if (isset($_GET['run_tests']) || php_sapi_name() === 'cli') {
    try {
        $results = CryptoTest::runAllTests();
        
        if (php_sapi_name() === 'cli') {
            echo "\n=== RESULTADOS DOS TESTES ===\n";
            print_r($results);
        } else {
            echo json_encode($results, JSON_PRETTY_PRINT);
        }
        
    } catch (Exception $e) {
        $error = [
            'overall' => 'FAILED',
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ];
        
        if (php_sapi_name() === 'cli') {
            echo "ERRO: " . $e->getMessage() . "\n";
        } else {
            echo json_encode($error, JSON_PRETTY_PRINT);
        }
    }
} else {
    // Processamento normal de handshake se não for teste
    $response = SessionCrypto::processKeyHandshake();
    echo json_encode($response);
}
