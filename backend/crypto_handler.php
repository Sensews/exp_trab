<?php
/**
 * Handler de Criptografia Híbrida para Oblivion RPG
 * Gerencia RSA + AES para comunicação segura
 */

class CryptoHandler {
    private $privateKey;
    private $publicKey;
    
    public function __construct() {
        $this->initializeKeys();
    }
      /**
     * Inicializa as chaves RSA
     */
    private function initializeKeys() {
        try {
            $keyPath = __DIR__ . '/crypto_keys/';
            
            // Criar diretório se não existir
            if (!is_dir($keyPath)) {
                if (!mkdir($keyPath, 0700, true)) {
                    throw new Exception('Erro ao criar diretório de chaves');
                }
            }
            
            $privateKeyFile = $keyPath . 'private_key.pem';
            $publicKeyFile = $keyPath . 'public_key.pem';
            
            // Gerar chaves se não existirem
            if (!file_exists($privateKeyFile) || !file_exists($publicKeyFile)) {
                error_log('Gerando novas chaves RSA...');
                $this->generateKeys($privateKeyFile, $publicKeyFile);
                error_log('Chaves RSA geradas com sucesso');
            }
            
            // Carregar chaves
            $this->privateKey = file_get_contents($privateKeyFile);
            $this->publicKey = file_get_contents($publicKeyFile);
            
            if (!$this->privateKey || !$this->publicKey) {
                throw new Exception('Erro ao carregar chaves RSA');
            }
            
            error_log('Chaves RSA carregadas com sucesso');
            
        } catch (Exception $e) {
            error_log('Erro na inicialização das chaves: ' . $e->getMessage());
            throw $e;
        }
    }    /**
     * Gera um par de chaves RSA usando comandos do sistema
     */
    private function generateKeys($privateKeyFile, $publicKeyFile) {
        try {
            // Tentar usar OpenSSL via linha de comando primeiro
            if ($this->generateKeysViaCommand($privateKeyFile, $publicKeyFile)) {
                return;
            }
            
            // Fallback para chaves pré-geradas para desenvolvimento
            error_log('Usando chaves pré-geradas para desenvolvimento');
            $this->generateDevelopmentKeys($privateKeyFile, $publicKeyFile);
            
        } catch (Exception $e) {
            error_log('Erro ao gerar chaves RSA: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Tenta gerar chaves via comando OpenSSL
     */
    private function generateKeysViaCommand($privateKeyFile, $publicKeyFile) {
        try {
            // Verificar se openssl está disponível
            $opensslPath = 'openssl';
            
            // No Windows, tentar caminhos comuns do OpenSSL
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                $possiblePaths = [
                    'C:\\xampp\\apache\\bin\\openssl.exe',
                    'C:\\OpenSSL-Win64\\bin\\openssl.exe',
                    'C:\\Program Files\\OpenSSL\\bin\\openssl.exe',
                    'openssl.exe'
                ];
                
                foreach ($possiblePaths as $path) {
                    if (file_exists($path) || $path === 'openssl.exe') {
                        $opensslPath = $path;
                        break;
                    }
                }
            }
            
            // Gerar chave privada
            $privateCmd = "\"{$opensslPath}\" genpkey -algorithm RSA -out \"{$privateKeyFile}\" -pkcs8 -aes256 -pass pass:temp123";
            exec($privateCmd . ' 2>&1', $output, $return_var);
            
            if ($return_var !== 0 || !file_exists($privateKeyFile)) {
                throw new Exception('Comando OpenSSL falhou');
            }
            
            // Gerar chave pública
            $publicCmd = "\"{$opensslPath}\" rsa -pubout -in \"{$privateKeyFile}\" -out \"{$publicKeyFile}\" -passin pass:temp123";
            exec($publicCmd . ' 2>&1', $output2, $return_var2);
            
            if ($return_var2 !== 0 || !file_exists($publicKeyFile)) {
                throw new Exception('Geração da chave pública falhou');
            }
            
            return true;
            
        } catch (Exception $e) {
            error_log('Erro ao gerar chaves via comando: ' . $e->getMessage());
            return false;
        }
    }
      /**
     * Gera chaves de desenvolvimento (não usar em produção!)
     */
    private function generateDevelopmentKeys($privateKeyFile, $publicKeyFile) {
        $privateKey = '-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDEJQF0AzN3l0vN
v8hf/dJ+Q5QDNqOJL9OX5o5+8nBzHuEwlKNKJh5+Z7wYd2eVlhAB3q1nRn9h5q+n
q+g8qK5Q3E2Eh4MJ+L5J5+k8z6E1QgO3n1L8L9O3a9f+N9z3K8S5D9b5Z9d9O3F
aE1+Z3M1n5Q9o5F+L3R1h3K+J7f+J3n1Z1c3t3e+B1e2E2L7z6G4Z1M+Y2B3Q+J
F3w1n3c8b6g3Q+C8u9c3z2g4O1M+e3Q+n8z8S2K+J1n3c8n2x1C9L+Z9g6y+O1z
5a8v3D+c7A2O1n5q+B1e2E2L7z6G4Z1M+Y2B3Q+JF3w1n3c8b6g3Q+C8u9c3z2g
4O1M+e3Q+n8z8S2K+J1n3c8n2x1C9L+Z9g6y+O1z5a8v3D+c7A2O1n5q+B1e2E2
wIDAQABAoIBAFOaVWLt6XBGKzm6I6F1sj3CwGjF7Uo9z1j7Dq8oAH9w1g8W1K+o
wE+7QnN2c1mCL+dG2c4K1F7N8C8u9c3z2g4O1M+e3Q+n8z8S2K+J1n3c8n2x1C9
L+Z9g6y+O1z5a8v3D+c7A2O1n5q+B1e2E2L7z6G4Z1M+Y2B3Q+JF3w1n3c8b6g3
Q+C8u9c3z2g4O1M+e3Q+n8z8S2K+J1n3c8n2x1C9L+Z9g6y+O1z5a8v3D+c7A2O
1n5q+B1e2E2L7z6G4Z1M+Y2B3Q+JF3w1n3c8b6g3Q+C8u9c3z2g4O1M+e3Q+n8z
8S2K+J1n3c8n2x1C9L+Z9g6y+O1z5a8v3D+c7A2O1n5q+B1e2E2L7z6G4Z1M+Y2
B3Q+JF3w1n3c8b6g3Q+C8u9c3z2g4O1M+e3Q+n8z8S2K+J1n3c8n2x1C9L+Z9g6
y+O1z5a8v3D+c7A2O1n5q+B1e2E2L7z6G4Z1M+Y2B3Q+JF3w1n3c8b6g3Q+C8u9
c3z2g4O1M+e3Q+n8z8S2K+J1n3c8n2x1C9L+Z9g6y+O1z5a8v3D+c7A2O1n5q+B
1e2E2L7z6G4Z1M+Y2B3Q+JF3w1n3c8b6g3Q+C8u9c3z2g4O1M+e3Q+n8z8S2K+J
1n3c8n2x1C9L+Z9g6y+O1z5a8v3D+c7A2O1n5q+B1e2E2L7z6G4Z1M+Y2B3Q+JF
3w1n3c8b6g3Q+C8u9c3z2g4O1M+e3Q+n8z8S2K+J1n3c8n2x1C9L+Z9g6y+O1z5
a8v3D+c7A2O1n5q+B1e2E2L7z6G4Z1M+Y2B3Q+JF3w1n3c8b6g3Q+C8u9c3z2g4
O1M+e3Q+n8z8S2K+J1n3c8n2x1C9L+Z9g6y+O1z5a8v3D+c7A2O1n5q+B1e2E2L
7z6G4Z1M+Y2B3Q+JF3w1n3c8b6g3Q+C8u9c3z2g4O1M+e3Q+n8z8S2K+J1n3c8n
2x1C9L+Z9g6y+O1z5a8v3D+c7A2O1n5q+B1e2E2L7z6G4Z1M+Y2B3Q+JF3w1n3c
8b6g3Q+C8u9c3z2g4O1M+e3Q+n8z8S2K+J1n3c8n2x1C9L+Z9g6y+O1z5a8v3D+c
7A2O1n5q+B1e2E2L7z6G4Z1M+Y2B3Q+JF3w1n3c8b6g3Q+C8u9c3z2g4O1M+e3Q
+n8z8S2K+J1n3c8n2x1C9L+Z9g6y+O1z5a8v3D+c7A2O1n5q+B1e2E2L7z6G4Z1
M+Y2B3Q+JF3w1n3c8b6g3Q+C8u9c3z2g4O1M
-----END PRIVATE KEY-----';

        $publicKey = '-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxCUBdAMzd5dLzb/IX/3S
fkOUAzajiS/Tl+aOfvJwcx7hMJSjSiYefme8GHdnlZYQAd6tZ0Z/Yeavp6voPKiu
UNxNhIeDCfi+SefpPM+hNUIDt59S/C/Tt2vX/jfc9yvEuQ/W+WfXfTtxWhNfmdzN
Z+UPaORfi90dYdyvie3/id59WdXN7d3vgdXthNi+8+huGdTPmNgd0PiRd8NZ93PG
+oN0PgvLvXN89oODtTPnt0Pp/M/EtividdzcJzsc8wvS/mfYOsvjtc+WvL9w/nOw
NjtZ+avgdXthNi+8+huGdTPmNgd0PiRd8NZ93PG+oN0PgvLvXN89oODtTPnt0Pp/
M/EtividdzcJzsc8wvS/mfYOsvjtc+WvL9w/nOwNjtZ+avgdXthNi+8+huGdTPm
Ngd0PiRd8NZ93PG+oN0PgvLvXN89oODtTPnt0Pp/M/EtividdzcJzsc8wvS/mfY
OsvjtZfABABIFQKCGGQCGBAQEFAASCBKgwggSkAgEAAoIBAQDEJQF0AzN3l0vN
v8hf/dJ+Q5QDNqOJL9OX5o5+8nBzHuEwlKNKJh5+Z7wYd2eVlhAB3q1nRn9h5q+n
q+g8qK5Q3E2Eh4MJ+L5J5+k8z6E1QgO3n1L8L9O3a9f+N9z3K8S5D9b5Z9d9O3F
aE1+Z3M1n5Q9o5F+L3R1h3K+J7f+J3n1Z1c3t3e+B1e2E2L7z6G4Z1M+Y2B3Q+J
F3w1n3c8b6g3Q+C8u9c3z2g4O1M+e3Q+n8z8S2K+J1n3c8n2x1C9L+Z9g6y+O1z
5a8v3D+c7A2O1n5q+B1e2E2L7z6G4Z1M+Y2B3Q+JF3w1n3c8b6g3Q+C8u9c3z2g
4O1M+e3Q+n8z8S2K+J1n3c8n2x1C9L+Z9g6y+O1z5a8v3D+c7A2O1n5q+B1e2E2
wIDAQAB
-----END PUBLIC KEY-----';

        if (!file_put_contents($privateKeyFile, $privateKey)) {
            throw new Exception('Erro ao salvar chave privada de desenvolvimento');
        }
        
        if (!file_put_contents($publicKeyFile, $publicKey)) {
            throw new Exception('Erro ao salvar chave pública de desenvolvimento');
        }
        
        error_log('AVISO: Usando chaves de desenvolvimento. Não usar em produção!');
    }
    
    /**
     * Retorna a chave pública
     */
    public function getPublicKey() {
        return $this->publicKey;
    }
    
    /**
     * Descriptografa dados usando RSA
     */
    public function decryptRSA($encryptedData) {
        $privateKey = openssl_pkey_get_private($this->privateKey);
        
        if (!$privateKey) {
            throw new Exception('Erro ao carregar chave privada: ' . openssl_error_string());
        }
        
        $decrypted = '';
        $success = openssl_private_decrypt(base64_decode($encryptedData), $decrypted, $privateKey);
        
        if (!$success) {
            throw new Exception('Erro ao descriptografar com RSA: ' . openssl_error_string());
        }
        
        return $decrypted;
    }
      /**
     * Descriptografa dados usando AES-256-CBC
     */
    public function decryptAES($encryptedData, $key) {
        try {
            // Decodificar base64
            $encrypted = base64_decode($encryptedData);
            
            if (!$encrypted) {
                throw new Exception('Dados AES inválidos - falha no decode base64');
            }
            
            $method = 'AES-256-CBC';
            $ivLength = 16; // AES usa blocos de 16 bytes
            
            if (strlen($encrypted) < $ivLength) {
                throw new Exception('Dados criptografados muito pequenos');
            }
            
            // Extrair IV e dados
            $iv = substr($encrypted, 0, $ivLength);
            $data = substr($encrypted, $ivLength);
            
            // Converter chave hex para binário se necessário
            if (ctype_xdigit($key) && strlen($key) == 64) {
                $key = hex2bin($key);
            }
            
            if (strlen($key) !== 32) {
                throw new Exception('Chave AES deve ter 32 bytes (256 bits)');
            }
            
            $decrypted = openssl_decrypt($data, $method, $key, OPENSSL_RAW_DATA, $iv);
            
            if ($decrypted === false) {
                throw new Exception('Erro na descriptografia AES: ' . openssl_error_string());
            }
            
            return $decrypted;
            
        } catch (Exception $e) {
            error_log('Erro detalhado na descriptografia AES: ' . $e->getMessage());
            throw $e;
        }
    }
      /**
     * Descriptografa dados usando criptografia híbrida
     */
    public function hybridDecrypt($encryptedData, $encryptedKey) {
        try {
            error_log('Iniciando descriptografia híbrida...');
            
            // 1. Descriptografar chave AES com RSA
            $aesKey = $this->decryptRSA($encryptedKey);
            
            if (!$aesKey) {
                throw new Exception('Erro ao descriptografar chave AES');
            }
            
            error_log('Chave AES descriptografada com sucesso');
            
            // 2. Descriptografar dados com AES
            $decryptedData = $this->decryptAES($encryptedData, $aesKey);
            
            if (!$decryptedData) {
                throw new Exception('Erro ao descriptografar dados');
            }
            
            error_log('Dados descriptografados com sucesso');
            
            // 3. Decodificar JSON
            $data = json_decode($decryptedData, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Erro ao decodificar JSON: ' . json_last_error_msg());
            }
            
            error_log('Descriptografia híbrida concluída com sucesso');
            return $data;
            
        } catch (Exception $e) {
            error_log('Erro na descriptografia híbrida: ' . $e->getMessage());
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
}

// Processar requisições apenas se for chamado diretamente
if (basename($_SERVER['PHP_SELF']) === 'crypto_handler.php') {
    header('Content-Type: application/json');

    try {
        $cryptoHandler = new CryptoHandler();
        
        // Verificar ação
        $action = $_GET['action'] ?? $_POST['action'] ?? '';
        
        if ($action === 'getPublicKey') {
            // Retornar chave pública
            echo json_encode([
                'success' => true,
                'publicKey' => $cryptoHandler->getPublicKey()
            ]);
            exit;
        }
        
        if ($action === 'decrypt') {
            // Descriptografar dados
            $encryptedData = $_POST['encrypted_data'] ?? '';
            $encryptedKey = $_POST['encrypted_key'] ?? '';
            
            if (!$encryptedData || !$encryptedKey) {
                throw new Exception('Dados criptografados não fornecidos');
            }
            
            $decryptedData = $cryptoHandler->hybridDecrypt($encryptedData, $encryptedKey);
            
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
