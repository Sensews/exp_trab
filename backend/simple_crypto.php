<?php
/**
 * Handler de Criptografia Simplificada para Oblivion RPG
 * Usa apenas AES-256-GCM para simplicidade e compatibilidade
 */

class SimpleCrypto {
    private $secretKey;
    
    public function __construct() {
        $this->initializeKey();
    }
      /**
     * Inicializa a chave secreta
     */    private function initializeKey() {
        // Usar chave fixa para compatibilidade (em produção, usar chave segura)
        $this->secretKey = 'MySecretKey12345MySecretKey12345'; // 32 caracteres = 256 bits
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
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';
        
        if ($action === 'test') {
            try {
                $crypto = new SimpleCrypto();
                
                $testData = [
                    'usuario' => 'teste@example.com',
                    'senha' => 'senha123',
                    'timestamp' => time()
                ];
                
                $encrypted = $crypto->encrypt($testData);
                $decrypted = $crypto->decrypt($encrypted);
                
                echo json_encode([
                    'status' => 'ok',
                    'message' => 'Teste de criptografia realizado com sucesso',
                    'original' => $testData,
                    'encrypted' => $encrypted,
                    'decrypted' => $decrypted
                ]);
                
            } catch (Exception $e) {
                echo json_encode([
                    'status' => 'erro',
                    'message' => 'Erro no teste: ' . $e->getMessage()
                ]);
            }
        } else {
            echo json_encode([
                'status' => 'erro',
                'message' => 'Ação não reconhecida'
            ]);
        }
    } else {
        echo json_encode([
            'status' => 'erro',
            'message' => 'Método não permitido'
        ]);
    }
    exit;
}
?>
