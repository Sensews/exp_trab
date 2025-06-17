<?php
// Inicia a sessão para acessar dados do usuário
session_start();

// Define o tipo da resposta como JSON
header("Content-Type: application/json");

// Importa a conexão com banco e controle de tempo/sessão
require_once("conexao.php");
require_once("time.php");

// ✅ Verifica se o usuário está logado
if (!isset($_SESSION['id_perfil'])) {
    echo json_encode(["logado" => false]);
    exit;
}

// Pega o ID do perfil logado e a ação recebida via GET
$id_perfil = $_SESSION['id_perfil'];
$action = $_GET["action"] ?? "";

// === Carregar dados da party e membros ===
if ($action === "carregar") {
    // Busca os dados da party que o usuário participa ou criou
    $sql = "
        SELECT p.*, pf.tipo AS tipo_usuario, pf.arroba AS nome_usuario
        FROM party p
        JOIN perfil pf ON pf.id_perfil = ?
        WHERE p.id IN (
            SELECT pm.id_party FROM party_membros pm WHERE pm.id_perfil = ?
            UNION
            SELECT p2.id FROM party p2 WHERE p2.id_mestre = ?
        )
        LIMIT 1
    ";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("iii", $id_perfil, $id_perfil, $id_perfil);
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
    // Busca a party em que o usuário participa ou criou
    $sql = "
        SELECT p.id 
        FROM party p
        WHERE p.id IN (
            SELECT pm.id_party FROM party_membros pm WHERE pm.id_perfil = ?
            UNION
            SELECT p2.id FROM party p2 WHERE p2.id_mestre = ?
        )
        LIMIT 1
    ";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("ii", $id_perfil, $id_perfil);
    $stmt->execute();
    $res = $stmt->get_result();

    // Se o usuário não estiver em party
    if ($res->num_rows === 0) {
        echo json_encode([]);
        exit;
    }

    $id_party = $res->fetch_assoc()["id"];

    // Busca todas as mensagens do chat da party
    $sql = "
        SELECT pf.arroba, pc.mensagem, pc.criado_em
        FROM party_chat pc
        JOIN perfil pf ON pf.id_perfil = pc.id_perfil
        WHERE pc.id_party = ?
        ORDER BY pc.criado_em ASC
    ";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $id_party);
    $stmt->execute();
    $mensagens = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Retorna mensagens ordenadas por data
    echo json_encode($mensagens);
    exit;
}

// === Enviar nova mensagem para o chat da party ===
if ($action === "enviar") {
    $json = json_decode(file_get_contents("php://input"), true);
    $mensagem = trim($json["mensagem"] ?? "");

    // Valida mensagem vazia
    if ($mensagem === "") {
        echo json_encode(["success" => false, "erro" => "Mensagem vazia."]);
        exit;
    }

    // Busca party do usuário (como membro ou mestre)
    $sql = "
        SELECT p.id 
        FROM party p
        WHERE p.id IN (
            SELECT pm.id_party FROM party_membros pm WHERE pm.id_perfil = ?
            UNION
            SELECT p2.id FROM party p2 WHERE p2.id_mestre = ?
        )
        LIMIT 1
    ";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("ii", $id_perfil, $id_perfil);
    $stmt->execute();
    $res = $stmt->get_result();

    // Se não estiver em nenhuma party
    if ($res->num_rows === 0) {
        echo json_encode(["success" => false, "erro" => "Você não está em nenhuma party."]);
        exit;
    }

    $id_party = $res->fetch_assoc()["id"];

    // Insere a nova mensagem no chat
    $sql = "INSERT INTO party_chat (id_party, id_perfil, mensagem) VALUES (?, ?, ?)";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("iis", $id_party, $id_perfil, $mensagem);
    $stmt->execute();

    // Retorna sucesso
    echo json_encode(["success" => true]);
    exit;
}

// === Remover membro da party (somente mestre) ===
if ($action === "remover") {
    $json = json_decode(file_get_contents("php://input"), true);
    $arroba = trim($json["arroba"] ?? "");

    // Arroba obrigatória
    if ($arroba === "") {
        echo json_encode(["success" => false, "erro" => "Arroba inválida."]);
        exit;
    }

    // Verifica se o usuário atual é mestre de alguma party
    $sql = "SELECT id FROM party WHERE id_mestre = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $id_perfil);
    $stmt->execute();
    $res = $stmt->get_result();

    // Se não for mestre de nenhuma party
    if ($res->num_rows === 0) {
        echo json_encode(["success" => false, "erro" => "Você não é mestre de nenhuma party."]);
        exit;
    }

    $id_party = $res->fetch_assoc()["id"];

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

    $id_remover = $res->fetch_assoc()["id_perfil"];

    // Remove o membro da tabela party_membros
    $sql = "DELETE FROM party_membros WHERE id_party = ? AND id_perfil = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("ii", $id_party, $id_remover);
    $stmt->execute();

    // Retorna sucesso
    echo json_encode(["success" => true]);
    exit;
}

// === Se nenhuma das ações acima for reconhecida
echo json_encode(["success" => false, "erro" => "Ação inválida."]);
