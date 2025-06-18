<?php
// Inicia a sessão para acessar dados do usuário
session_start();

// Define o tipo da resposta como JSON
header("Content-Type: application/json");

// Desabilita a saída de erros para manter JSON limpo
error_reporting(0);
ini_set('display_errors', 0);

// Importa a conexão com banco e controle de tempo/sessão
require_once("conexao.php");
require_once("time.php");
require_once("simple_crypto.php");

// ✅ Verifica se o usuário está logado
if (!isset($_SESSION['id_perfil'])) {
    echo json_encode(["logado" => false]);
    exit;
}

// Pega o ID do perfil logado e a ação recebida via GET
$id_perfil = $_SESSION['id_perfil'];
$action = $_GET["action"] ?? "";
$party_id = $_GET["id"] ?? null;

// === Carregar dados da party e membros ===
if ($action === "carregar") {    // Se foi passado um ID específico de party, usar ele
    if ($party_id) {
        // Verificar se o usuário tem acesso a esta party específica
        $sql = "
            SELECT p.*, pf.tipo AS tipo_usuario, pf.arroba AS nome_usuario
            FROM party p
            JOIN perfil pf ON pf.id_perfil = ?
            WHERE p.id = ? AND (
                EXISTS (SELECT 1 FROM party_membros pm WHERE pm.id_party = p.id AND pm.id_perfil = ?)
                OR p.id_mestre = ?
            )
        ";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("iiii", $id_perfil, $party_id, $id_perfil, $id_perfil);
    } else {
        // Busca a party única que o usuário participa ou criou
        $sql = "
            SELECT p.*, pf.tipo AS tipo_usuario, pf.arroba AS nome_usuario
            FROM party p
            JOIN perfil pf ON pf.id_perfil = ?
            WHERE (
                EXISTS (SELECT 1 FROM party_membros pm WHERE pm.id_party = p.id AND pm.id_perfil = ?)
                OR p.id_mestre = ?
            )
            ORDER BY p.criado_em DESC
            LIMIT 1
        ";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("iii", $id_perfil, $id_perfil, $id_perfil);
    }
    $stmt->execute();
    $res = $stmt->get_result();

    // Se o usuário não estiver em nenhuma party
    if ($res->num_rows === 0) {
        echo json_encode(["success" => false, "erro" => "Você não está em nenhuma party."]);
        exit;
    }

    // Armazena dados da party
    $party = $res->fetch_assoc();
    $id_party = $party["id"];

    // Busca todos os membros da party (mestre + jogadores)
    $sql = "
        SELECT pf.arroba, pf.avatar, pf.id_perfil
        FROM perfil pf
        WHERE pf.id_perfil = ? -- mestre
        UNION
        SELECT pf2.arroba, pf2.avatar, pf2.id_perfil
        FROM party_membros pm
        JOIN perfil pf2 ON pf2.id_perfil = pm.id_perfil
        WHERE pm.id_party = ?
        ORDER BY arroba
    ";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("ii", $party["id_mestre"], $id_party);
    $stmt->execute();
    $membros = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Retorna dados da party + lista de membros
    echo json_encode([
        "success" => true,
        "party" => [
            "id" => $party["id"],
            "nome" => $party["nome"],
            "tipo_usuario" => $party["tipo_usuario"],
            "nome_usuario" => $party["nome_usuario"]
        ],
        "membros" => $membros
    ]);
    exit;
}

// === Carregar mensagens do chat ===
if ($action === "mensagens") {
    $id_party_atual = null;
    
    // Se foi passado um ID específico de party, usar ele
    if ($party_id) {        // Verificar se o usuário tem acesso a esta party específica
        $sql = "
            SELECT p.id 
            FROM party p
            WHERE p.id = ? AND (
                EXISTS (SELECT 1 FROM party_membros pm WHERE pm.id_party = p.id AND pm.id_perfil = ?)
                OR p.id_mestre = ?
            )
        ";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("iii", $party_id, $id_perfil, $id_perfil);
        $stmt->execute();
        $res = $stmt->get_result();
        
        if ($res->num_rows > 0) {
            $id_party_atual = $party_id;
        }
    } else {
        // Busca a party única que o usuário participa ou criou
        $sql = "
            SELECT p.id 
            FROM party p
            WHERE (
                EXISTS (SELECT 1 FROM party_membros pm WHERE pm.id_party = p.id AND pm.id_perfil = ?)
                OR p.id_mestre = ?
            )
            ORDER BY p.criado_em DESC
            LIMIT 1
        ";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("ii", $id_perfil, $id_perfil);
        $stmt->execute();
        $res = $stmt->get_result();
        
        if ($res->num_rows > 0) {
            $id_party_atual = $res->fetch_assoc()["id"];
        }
    }

    // Se o usuário não estiver em party
    if (!$id_party_atual) {
        echo json_encode([]);
        exit;
    }    // Busca todas as mensagens do chat da party
    $sql = "
        SELECT pf.arroba, pc.mensagem, pc.criado_em
        FROM party_chat pc
        JOIN perfil pf ON pf.id_perfil = pc.id_perfil
        WHERE pc.id_party = ?
        ORDER BY pc.criado_em ASC
    ";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $id_party_atual);
    $stmt->execute();
    $mensagens_raw = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Descriptografar mensagens
    $crypto = new SimpleCrypto();
    $mensagens = [];
    
    foreach ($mensagens_raw as $msg) {
        try {
            // Tentar descriptografar a mensagem
            $mensagem_descriptografada = $crypto->decrypt($msg['mensagem']);
            
            $mensagens[] = [
                'arroba' => $msg['arroba'],
                'mensagem' => $mensagem_descriptografada,
                'criado_em' => $msg['criado_em']
            ];
        } catch (Exception $e) {
            // Se não conseguir descriptografar, pode ser uma mensagem legado
            $mensagens[] = [
                'arroba' => $msg['arroba'],
                'mensagem' => $msg['mensagem'], // Mantém a mensagem original
                'criado_em' => $msg['criado_em']
            ];
        }
    }

    // Retorna mensagens ordenadas por data
    echo json_encode($mensagens);
    exit;
}

// === Enviar nova mensagem para o chat da party ===
if ($action === "enviar") {    $input_data = file_get_contents("php://input");
    $json = json_decode($input_data, true);
    
    $mensagem = null;
    
    // Verificar se há dados criptografados
    if (isset($json['encrypted_data'])) {
        try {
            $crypto = new SimpleCrypto();
            $decrypted_data = $crypto->decrypt($json['encrypted_data']);
            
            if (!$decrypted_data) {
                throw new Exception("Dados inválidos após descriptografia");
            }
            
            $mensagem = trim($decrypted_data["mensagem"] ?? "");
            
        } catch (Exception $e) {
            echo json_encode(["success" => false, "erro" => "Erro na descriptografia: " . $e->getMessage()]);
            exit;
        }
    } else {
        // Fallback: dados não criptografados
        $mensagem = trim($json["mensagem"] ?? "");
    }

    // Valida mensagem vazia
    if ($mensagem === "") {
        echo json_encode(["success" => false, "erro" => "Mensagem vazia."]);
        exit;
    }    // Determinar a party para enviar a mensagem
    $id_party_envio = null;
    
    // Se foi passado um ID específico de party, usar ele
    if ($party_id) {
        // Verificar se o usuário tem acesso a esta party específica
        $sql = "
            SELECT p.id 
            FROM party p
            WHERE p.id = ? AND (
                p.id IN (
                    SELECT pm.id_party FROM party_membros pm WHERE pm.id_perfil = ?
                ) OR p.id_mestre = ?
            )
        ";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("iii", $party_id, $id_perfil, $id_perfil);
        $stmt->execute();
        $res = $stmt->get_result();
        
        if ($res->num_rows > 0) {
            $id_party_envio = $party_id;
        }
    } else {
        // Busca qualquer party que o usuário participa ou criou
        $sql = "
            SELECT p.id 
            FROM party p
            WHERE p.id IN (
                SELECT pm.id_party FROM party_membros pm WHERE pm.id_perfil = ?
                UNION
                SELECT p2.id FROM party p2 WHERE p2.id_mestre = ?
            )
            ORDER BY p.criado_em DESC
            LIMIT 1
        ";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("ii", $id_perfil, $id_perfil);
        $stmt->execute();
        $res = $stmt->get_result();
        
        if ($res->num_rows > 0) {
            $id_party_envio = $res->fetch_assoc()["id"];
        }
    }    // Se não conseguiu determinar a party
    if (!$id_party_envio) {
        echo json_encode(["success" => false, "erro" => "Você não tem acesso a esta party."]);
        exit;
    }

    // Criptografar a mensagem antes de salvar no banco
    try {
        $crypto = new SimpleCrypto();
        $mensagem_criptografada = $crypto->encrypt($mensagem);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "erro" => "Erro ao criptografar mensagem: " . $e->getMessage()]);
        exit;
    }

    // Insere a nova mensagem criptografada no chat
    $sql = "INSERT INTO party_chat (id_party, id_perfil, mensagem) VALUES (?, ?, ?)";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("iis", $id_party_envio, $id_perfil, $mensagem_criptografada);
    $stmt->execute();

    // Retorna sucesso
    echo json_encode(["success" => true]);
    exit;
}

// === Remover membro da party (somente mestre) ===
if ($action === "remover") {
    $input_data = file_get_contents("php://input");
    $json = json_decode($input_data, true);
    
    $arroba = null;
    
    // Verificar se há dados criptografados
    if (isset($json['encrypted_data'])) {
        try {
            $crypto = new SimpleCrypto();
            $decrypted_json = $crypto->decrypt($json['encrypted_data']);
            $decrypted_data = json_decode($decrypted_json, true);
            
            if (!$decrypted_data) {
                throw new Exception("Dados inválidos após descriptografia");
            }
            
            $arroba = trim($decrypted_data["arroba"] ?? "");
            
        } catch (Exception $e) {
            echo json_encode(["success" => false, "erro" => "Erro na descriptografia: " . $e->getMessage()]);
            exit;
        }
    } else {
        // Fallback: dados não criptografados
        $arroba = trim($json["arroba"] ?? "");
    }

    // Arroba obrigatória
    if ($arroba === "") {
        echo json_encode(["success" => false, "erro" => "Arroba inválida."]);
        exit;
    }    // Determinar a party para remoção
    $id_party_remocao = null;
    
    // Se foi passado um ID específico de party, usar ele
    if ($party_id) {
        // Verificar se o usuário é mestre desta party específica
        $sql = "SELECT id FROM party WHERE id = ? AND id_mestre = ?";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("ii", $party_id, $id_perfil);
        $stmt->execute();
        $res = $stmt->get_result();
        
        if ($res->num_rows > 0) {
            $id_party_remocao = $party_id;
        }
    } else {
        // Busca qualquer party que o usuário seja mestre
        $sql = "SELECT id FROM party WHERE id_mestre = ? ORDER BY criado_em DESC LIMIT 1";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("i", $id_perfil);
        $stmt->execute();
        $res = $stmt->get_result();
        
        if ($res->num_rows > 0) {
            $id_party_remocao = $res->fetch_assoc()["id"];
        }
    }

    // Se não conseguiu determinar a party ou não é mestre
    if (!$id_party_remocao) {
        echo json_encode(["success" => false, "erro" => "Você não é mestre desta party."]);
        exit;
    }

    // Busca o id_perfil do usuário a ser removido
    $sql = "SELECT id_perfil FROM perfil WHERE arroba = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("s", $arroba);
    $stmt->execute();
    $res = $stmt->get_result();

    // Arroba não encontrada
    if ($res->num_rows === 0) {
        echo json_encode(["success" => false, "erro" => "Usuário não encontrado."]);
        exit;
    }

    $id_remover = $res->fetch_assoc()["id_perfil"];    // Remove o membro da tabela party_membros
    $sql = "DELETE FROM party_membros WHERE id_party = ? AND id_perfil = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("ii", $id_party_remocao, $id_remover);
    $stmt->execute();

    // Retorna sucesso
    echo json_encode(["success" => true]);
    exit;
}

// === Se nenhuma das ações acima for reconhecida
echo json_encode(["success" => false, "erro" => "Ação inválida."]);
