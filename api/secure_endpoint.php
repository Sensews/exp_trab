<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../classes/HybridCrypto.php';
require_once __DIR__ . '/../classes/SecureDatabase.php';
require_once __DIR__ . '/../backend/conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['action'])) {
        throw new Exception('Ação não especificada');
    }
    
    $secureDB = new SecureDatabase($conexao);
    
    switch ($input['action']) {
        case 'decrypt_message':
            if (!isset($input['encryptedMessage']) || !isset($input['encryptedAesKey']) || !isset($input['aesIv'])) {
                throw new Exception('Dados de criptografia incompletos');
            }
            
            $decryptedData = HybridCrypto::decryptData(
                $input['encryptedMessage'],
                $input['encryptedAesKey'],
                $input['aesIv']
            );
            
            echo json_encode([
                'success' => true,
                'data' => $decryptedData,
                'message' => 'Dados descriptografados com sucesso'
            ]);
            break;
            
        case 'save_encrypted_user':
            $decryptedData = HybridCrypto::decryptData(
                $input['encryptedMessage'],
                $input['encryptedAesKey'],
                $input['aesIv']
            );
            
            $result = $secureDB->insertSecureUser(
                $decryptedData['nome'],
                $decryptedData['email'],
                $decryptedData['telefone'],
                $decryptedData['senha']
            );
            
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Usuário salvo com segurança' : 'Erro ao salvar usuário'
            ]);
            break;
            
        case 'get_user':
            $decryptedData = HybridCrypto::decryptData(
                $input['encryptedMessage'],
                $input['encryptedAesKey'],
                $input['aesIv']
            );
            
            $user = $secureDB->getUserByEmailHash($decryptedData['email']);
            
            if ($user) {
                // Re-criptografar dados para envio
                $encrypted = HybridCrypto::encryptData([
                    'id' => $user['id'],
                    'nome' => $user['nome'],
                    'email' => $user['real_email'] ?? 'N/A',
                    'telefone' => $user['real_telefone'] ?? 'N/A'
                ]);
                
                echo json_encode([
                    'success' => true,
                    'encryptedData' => $encrypted['encryptedData'],
                    'encryptedAesKey' => $encrypted['encryptedAesKey'],
                    'iv' => $encrypted['iv']
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Usuário não encontrado']);
            }
            break;
            
        case 'save_encrypted_character':
            $decryptedData = HybridCrypto::decryptData(
                $input['encryptedMessage'],
                $input['encryptedAesKey'],
                $input['aesIv']
            );
            
            $result = $secureDB->insertSecureCharacter(
                $decryptedData['id_perfil'],
                $decryptedData['nome'],
                $decryptedData['classe'],
                $decryptedData['nivel'],
                $decryptedData['raca'],
                $decryptedData['dados_json']
            );
            
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Personagem salvo com segurança' : 'Erro ao salvar personagem'
            ]);
            break;
            
        case 'save_encrypted_message':
            $decryptedData = HybridCrypto::decryptData(
                $input['encryptedMessage'],
                $input['encryptedAesKey'],
                $input['aesIv']
            );
            
            $result = $secureDB->insertSecureMessage(
                $decryptedData['id_party'],
                $decryptedData['id_perfil'],
                $decryptedData['mensagem'],
                $decryptedData['autor']
            );
            
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Mensagem salva com segurança' : 'Erro ao salvar mensagem'
            ]);
            break;
            
        case 'get_encrypted_messages':
            $decryptedData = HybridCrypto::decryptData(
                $input['encryptedMessage'],
                $input['encryptedAesKey'],
                $input['aesIv']
            );
            
            $messages = $secureDB->getSecureMessages($decryptedData['id_party']);
            
            // Re-criptografar mensagens para envio
            $encrypted = HybridCrypto::encryptData($messages);
            
            echo json_encode([
                'success' => true,
                'encryptedData' => $encrypted['encryptedData'],
                'encryptedAesKey' => $encrypted['encryptedAesKey'],
                'iv' => $encrypted['iv']
            ]);
            break;
            
        default:
            throw new Exception('Ação não reconhecida');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
