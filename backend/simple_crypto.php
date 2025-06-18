<?php
/**
 * Handler de Criptografia Simplificada para Oblivion RPG
 * Usa apenas AES-256-GCM para simplicidade e compatibilidade
 */

class SimpleCryptoHandler {
    private $secretKey;
    
    public function __construct() {
        $this->initializeKey();
    }
      /**
     * Inicializa a chave secreta
     */
    private function initializeKey() {
        // Usar chave fixa para compatibilidade (em produção, usar chave segura)
        $this->secretKey = 'MySecretKey12345MySecretKey12345'; // 32 caracteres = 256 bits
        error_log('Chave fixa inicializada para desenvolvimento');
    }
      /**
     * Criptografa dados usando AES-256-CBC (compatível com CryptoJS)
     */
    public function encrypt($data) {
        try {
            $plaintext = json_encode($data);
            $method = 'AES-256-CBC';
            $iv = random_bytes(16); // 128 bits para CBC
            
            $ciphertext = openssl_encrypt(
                $plaintext, 
                $method, 
                $this->secretKey, 
                OPENSSL_RAW_DATA, 
                $iv
            );
            
            if ($ciphertext === false) {
                throw new Exception('Erro na criptografia: ' . openssl_error_string());
            }
            
            // Combinar IV + dados criptografados
            $encrypted = base64_encode($iv . $ciphertext);
            
            return $encrypted;
            
        } catch (Exception $e) {
            error_log('Erro na criptografia: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Descriptografa dados usando AES-256-CBC
     */
    public function decrypt($encryptedData) {
        try {
            $data = base64_decode($encryptedData);
            
            if (!$data) {
                throw new Exception('Dados inválidos para descriptografia');
            }
            
            $method = 'AES-256-CBC';
            $ivLength = 16; // 128 bits
            
            if (strlen($data) < $ivLength) {
                throw new Exception('Dados criptografados incompletos');
            }
            
            // Extrair componentes
            $iv = substr($data, 0, $ivLength);
            $ciphertext = substr($data, $ivLength);
            
            $plaintext = openssl_decrypt(
                $ciphertext, 
                $method, 
                $this->secretKey, 
                OPENSSL_RAW_DATA, 
                $iv
            );
            
            if ($plaintext === false) {
                throw new Exception('Erro na descriptografia: ' . openssl_error_string());
            }
            
            $decodedData = json_decode($plaintext, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Erro ao decodificar JSON: ' . json_last_error_msg());
            }
            
            return $decodedData;
            
        } catch (Exception $e) {
            error_log('Erro na descriptografia: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Valida timestamp para prevenir replay attacks
     */
    public function validateTimestamp($timestamp, $maxAge = 300) { // 5 minutos
        $now = time() * 1000; // Converter para milissegundos
        $age = ($now - $timestamp) / 1000; // Converter para segundos
        
        return $age <= $maxAge;
    }
    
    /**
     * Gera uma chave para o cliente (para compatibilidade com o frontend)
     */
    public function getClientKey() {
        // Retorna uma chave derivada para o cliente usar
        return base64_encode(hash_hmac('sha256', 'client_key', $this->secretKey, true));
    }
}

// Processar requisições apenas se for chamado diretamente
if (basename($_SERVER['PHP_SELF']) === 'simple_crypto.php') {
    header('Content-Type: application/json');

    try {
        $cryptoHandler = new SimpleCryptoHandler();
        
        // Verificar ação
        $action = $_GET['action'] ?? $_POST['action'] ?? '';
        
        if ($action === 'getClientKey') {
            // Retornar chave do cliente
            echo json_encode([
                'success' => true,
                'clientKey' => $cryptoHandler->getClientKey()
            ]);
            exit;
        }
        
        if ($action === 'decrypt') {
            // Descriptografar dados
            $encryptedData = $_POST['encrypted_data'] ?? '';
            
            if (!$encryptedData) {
                throw new Exception('Dados criptografados não fornecidos');
            }
            
            $decryptedData = $cryptoHandler->decrypt($encryptedData);
            
            // Validar timestamp
            if (isset($decryptedData['timestamp'])) {
                if (!$cryptoHandler->validateTimestamp($decryptedData['timestamp'])) {
                    throw new Exception('Timestamp inválido - possível replay attack');
                }
            }
            
            // Retornar dados descriptografados
            echo json_encode([
                'success' => true,
                'data' => $decryptedData
            ]);
            exit;
        }
        
        // Ação não reconhecida
        throw new Exception('Ação não reconhecida');
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
        exit;
    }
}
?>
