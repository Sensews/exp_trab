<?php
require_once __DIR__ . '/HybridCrypto.php';

class SecureDatabase {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    // Inserir usuário com dados criptografados
    public function insertSecureUser($nome, $email, $telefone, $senha) {
        try {
            // Dados sensíveis para criptografar
            $sensitiveData = [
                'email' => $email,
                'telefone' => $telefone
            ];
            
            $encrypted = HybridCrypto::encryptData($sensitiveData);
            
            $stmt = $this->pdo->prepare("
                INSERT INTO usuarios (nome, email, telefone, senha, encrypted_data, aes_key, iv_data) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            return $stmt->execute([
                $nome,
                hash('sha256', $email), // Hash para busca
                hash('sha256', $telefone), // Hash para busca
                password_hash($senha, PASSWORD_DEFAULT),
                $encrypted['encryptedData'],
                $encrypted['encryptedAesKey'],
                $encrypted['iv']
            ]);
            
        } catch (Exception $e) {
            throw new Exception("Erro ao inserir usuário: " . $e->getMessage());
        }
    }
    
    // Buscar usuário e descriptografar dados
    public function getUserByEmailHash($email) {
        $emailHash = hash('sha256', $email);
        
        $stmt = $this->pdo->prepare("
            SELECT *, encrypted_data, aes_key, iv_data 
            FROM usuarios 
            WHERE email = ?
        ");
        $stmt->execute([$emailHash]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && !empty($user['encrypted_data'])) {
            try {
                $decryptedData = HybridCrypto::decryptData(
                    $user['encrypted_data'],
                    $user['aes_key'],
                    $user['iv_data']
                );
                
                $user['real_email'] = $decryptedData['email'];
                $user['real_telefone'] = $decryptedData['telefone'];
            } catch (Exception $e) {
                error_log("Erro ao descriptografar dados do usuário: " . $e->getMessage());
            }
        }
        
        return $user;
    }
    
    // Inserir personagem com dados criptografados
    public function insertSecureCharacter($id_perfil, $nome, $classe, $nivel, $raca, $dados_json) {
        try {
            $encrypted = HybridCrypto::encryptData($dados_json);
            
            $stmt = $this->pdo->prepare("
                INSERT INTO personagens (id_perfil, nome, classe, nivel, raca, dados_json, encrypted_json, aes_key, iv_data) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            return $stmt->execute([
                $id_perfil,
                $nome,
                $classe,
                $nivel,
                $raca,
                json_encode(['encrypted' => true]), // Placeholder
                $encrypted['encryptedData'],
                $encrypted['encryptedAesKey'],
                $encrypted['iv']
            ]);
            
        } catch (Exception $e) {
            throw new Exception("Erro ao inserir personagem: " . $e->getMessage());
        }
    }
    
    // Buscar personagem e descriptografar dados
    public function getCharacterById($id) {
        $stmt = $this->pdo->prepare("
            SELECT *, encrypted_json, aes_key, iv_data 
            FROM personagens 
            WHERE id = ?
        ");
        $stmt->execute([$id]);
        $character = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($character && !empty($character['encrypted_json'])) {
            try {
                $decryptedData = HybridCrypto::decryptData(
                    $character['encrypted_json'],
                    $character['aes_key'],
                    $character['iv_data']
                );
                
                $character['real_dados_json'] = $decryptedData;
            } catch (Exception $e) {
                error_log("Erro ao descriptografar dados do personagem: " . $e->getMessage());
            }
        }
        
        return $character;
    }
    
    // Inserir mensagem de chat criptografada
    public function insertSecureMessage($id_party, $id_perfil, $mensagem, $autor) {
        try {
            $sensitiveData = [
                'mensagem' => $mensagem,
                'autor' => $autor
            ];
            
            $encrypted = HybridCrypto::encryptData($sensitiveData);
            
            $stmt = $this->pdo->prepare("
                INSERT INTO party_chat (id_party, id_perfil, mensagem, autor, encrypted_message, aes_key, iv_data, enviado_em) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            return $stmt->execute([
                $id_party,
                $id_perfil,
                hash('sha256', $mensagem), // Hash para busca
                hash('sha256', $autor), // Hash para busca
                $encrypted['encryptedData'],
                $encrypted['encryptedAesKey'],
                $encrypted['iv']
            ]);
            
        } catch (Exception $e) {
            throw new Exception("Erro ao inserir mensagem: " . $e->getMessage());
        }
    }
    
    // Buscar mensagens de chat e descriptografar
    public function getSecureMessages($id_party) {
        $stmt = $this->pdo->prepare("
            SELECT *, encrypted_message, aes_key, iv_data 
            FROM party_chat 
            WHERE id_party = ? 
            ORDER BY enviado_em ASC
        ");
        $stmt->execute([$id_party]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($messages as &$message) {
            if (!empty($message['encrypted_message'])) {
                try {
                    $decryptedData = HybridCrypto::decryptData(
                        $message['encrypted_message'],
                        $message['aes_key'],
                        $message['iv_data']
                    );
                    
                    $message['real_mensagem'] = $decryptedData['mensagem'];
                    $message['real_autor'] = $decryptedData['autor'];
                } catch (Exception $e) {
                    error_log("Erro ao descriptografar mensagem: " . $e->getMessage());
                    $message['real_mensagem'] = '[Mensagem criptografada - erro ao descriptografar]';
                    $message['real_autor'] = '[Autor desconhecido]';
                }
            }
        }
        
        return $messages;
    }
}
?>
