<?php
/**
 * CryptoIntegrator - Integração automática de criptografia
 * 
 * Inclua este arquivo no início de qualquer script PHP para
 * ter acesso automático à criptografia híbrida
 */

class CryptoIntegrator {
    private static $crypto = null;
    private static $initialized = false;
    
    public static function initialize() {
        if (self::$initialized) return self::$crypto;
        
        try {
            require_once __DIR__ . '/CryptoManager.php';
            self::$crypto = CryptoManager::getInstance();
            self::$initialized = true;
            
            return self::$crypto;
        } catch (Exception $e) {
            error_log("CryptoIntegrator erro: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Processa request automaticamente (criptografado ou não)
     */
    public static function processRequest() {
        $crypto = self::initialize();
        
        $input = file_get_contents('php://input');
        
        if (!empty($input)) {
            $jsonData = json_decode($input, true);
            if ($jsonData && $crypto->isEncryptedRequest($jsonData)) {
                return $crypto->decryptRequest($jsonData);
            } else {
                return $jsonData ?: $_POST;
            }
        }
        
        return $_POST;
    }
    
    /**
     * Responde com criptografia automática
     */
    public static function respond($data, $encrypt = true) {
        $crypto = self::initialize();
        
        try {
            if ($encrypt) {
                $response = $crypto->encryptResponse($data);
            } else {
                $response = $data;
            }
            
            header('Content-Type: application/json');
            echo json_encode($response);
        } catch (Exception $e) {
            error_log("Erro ao responder: " . $e->getMessage());
            header('Content-Type: application/json');
            echo json_encode(["error" => "Erro na resposta segura"]);
        }
    }
    
    /**
     * Verifica se request está criptografado
     */
    public static function isEncryptedRequest($data = null) {
        $crypto = self::initialize();
        
        if ($data === null) {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
        }
        
        return $crypto->isEncryptedRequest($data);
    }
}
?>
