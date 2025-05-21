<?php
// Define o tipo de retorno como JSON
header('Content-Type: application/json');

// Inicia a sessão e inclui os arquivos necessários
require_once("conexao.php");
require_once("time.php"); // Protege com expiração de sessão

session_start();

// Obtém o ID do perfil salvo na sessão
$id_perfil = $_SESSION['id_perfil'] ?? null;

// Verifica se está autenticado
if (!$id_perfil) {
    echo json_encode(["status" => "erro", "mensagem" => "Perfil não autenticado."]);
    exit;
}

// Ação recebida via GET
$action = $_GET["action"] ?? "";


// === Carregar projetos e notas ===
if ($action === "carregarProjetos") {
    $sql = "SELECT p.id, p.nome, n.id AS id_nota, n.titulo, n.atualizado_em
            FROM projetos p
            LEFT JOIN notas n ON p.id = n.id_projeto
            WHERE p.id_perfil = ?
            ORDER BY p.nome, n.atualizado_em DESC";

    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $id_perfil);
    $stmt->execute();
    $res = $stmt->get_result();

    $dados = [];

    while ($row = $res->fetch_assoc()) {
        $projeto = $row["nome"];
        if (!isset($dados[$projeto])) {
            $dados[$projeto] = [];
        }

        if ($row["id_nota"]) {
            $dados[$projeto][] = ["titulo" => $row["titulo"]];
        }
    }

    echo json_encode($dados);
    exit;
}

// === Criar novo projeto ===
if ($action === "criarProjeto") {
    $json = json_decode(file_get_contents("php://input"), true);
    $nome = $json["nome"];

    $sql = "INSERT INTO projetos (id_perfil, nome) VALUES (?, ?)";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("is", $id_perfil, $nome);

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["erro" => $stmt->error]);
        exit;
    }

    echo json_encode(["sucesso" => true]);
    exit;
}


// === Criar nova anotação ===
if ($action === "criarAnotacao") {
    $json = json_decode(file_get_contents("php://input"), true);
    $projeto = $json["projeto"];
    $titulo = $json["titulo"];

    // Verifica se o projeto existe
    $sql = "SELECT id FROM projetos WHERE nome = ? AND id_perfil = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("si", $projeto, $id_perfil);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();

    if (!$row) {
        http_response_code(400);
        echo json_encode(["erro" => "Projeto não encontrado"]);
        exit;
    }

    $id_projeto = $row["id"];

    // Cria anotação vazia
    $sql = "INSERT INTO notas (id_projeto, titulo, conteudo) VALUES (?, ?, '')";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("is", $id_projeto, $titulo);
    $stmt->execute();

    echo json_encode(["sucesso" => true]);
    exit;
}

// === Carregar conteúdo de uma anotação ===
if ($action === "carregarConteudo") {
    $projeto = $_GET["projeto"];
    $titulo = $_GET["titulo"];

    $sql = "SELECT n.conteudo 
            FROM notas n 
            JOIN projetos p ON n.id_projeto = p.id 
            WHERE p.nome = ? AND p.id_perfil = ? AND n.titulo = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("sis", $projeto, $id_perfil, $titulo);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();

    echo json_encode(["conteudo" => $row["conteudo"] ?? ""]);
    exit;
}


// === Salvar conteúdo de uma anotação ===
if ($action === "salvarConteudo") {
    $json = json_decode(file_get_contents("php://input"), true);
    $projeto = $json["projeto"];
    $titulo = $json["titulo"];
    $conteudo = $json["conteudo"];

    // Encontra a anotação correspondente
    $sql = "SELECT n.id 
            FROM notas n 
            JOIN projetos p ON n.id_projeto = p.id 
            WHERE p.nome = ? AND p.id_perfil = ? AND n.titulo = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("sis", $projeto, $id_perfil, $titulo);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();

    if (!$row) {
        http_response_code(400);
        echo json_encode(["erro" => "Nota não encontrada"]);
        exit;
    }

    $id_nota = $row["id"];

    // Atualiza conteúdo e data
    $sql = "UPDATE notas SET conteudo = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("si", $conteudo, $id_nota);
    $stmt->execute();

    echo json_encode(["sucesso" => true]);
    exit;
}