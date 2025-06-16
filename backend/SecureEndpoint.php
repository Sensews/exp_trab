<?php
require_once 'CriptografiaHibrida.php';

class SecureEndpoint {
    private $crypto;
    private $clientId;

    public function __construct() {
        session_start();
        $this->clientId = session_id();
        
        if (!isset($_SESSION['crypto'])) {
            $_SESSION['crypto'] = new CriptografiaHibrida();
        }
        
        $this->crypto = $_SESSION['crypto'];
    }

    // Verifica se a requisição está criptografada
    public function isEncryptedRequest() {
        return isset($_SERVER['HTTP_X_ENCRYPTED']) && $_SERVER['HTTP_X_ENCRYPTED'] === 'true';
    }

    // Recebe e descriptografa dados
    public function receiveData() {
        if (!$this->isEncryptedRequest()) {
            // Fallback para dados não criptografados
            $input = file_get_contents('php://input');
            return json_decode($input, true) ?: $_POST;
        }

        try {
            $input = file_get_contents('php://input');
            $pacote = json_decode($input, true);
            
            if (!$pacote) {
                throw new Exception('Dados inválidos recebidos');
            }

            return $this->crypto->descriptografarHibrido($pacote);

        } catch (Exception $e) {
            error_log('Erro ao descriptografar dados: ' . $e->getMessage());
            throw new Exception('Erro na descriptografia dos dados');
        }
    }

    // Envia dados criptografados
    public function sendData($dados) {
        try {
            $pacoteCriptografado = $this->crypto->criptografarHibrido($dados, $this->clientId);
            
            header('Content-Type: application/json');
            header('X-Encrypted: true');
            
            echo json_encode($pacoteCriptografado);

        } catch (Exception $e) {
            error_log('Erro ao criptografar resposta: ' . $e->getMessage());
            
            // Fallback para resposta não criptografada
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error' => 'Erro na criptografia da resposta'
            ]);
        }
    }

    // Envia resposta não criptografada (quando necessário)
    public function sendPlainData($dados) {
        header('Content-Type: application/json');
        echo json_encode($dados);
    }
}