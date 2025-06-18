<?php
// Inicia a sessão para acessar variáveis como id_perfil
session_start();

// Define o tipo de retorno como JSON
header('Content-Type: application/json');

// Inclui arquivos de conexão e controle de tempo
require_once("conexao.php");
require_once("time.php");
require_once("simple_crypto.php");

// Verifica se o usuário está logado
if (!isset($_SESSION['id_perfil'])) {
    // Se não estiver logado, retorna status "logado: false"
    echo json_encode(["logado" => false]);
    exit;
}

// Pega o id do perfil da sessão
$id_perfil = $_SESSION['id_perfil'];

// Captura a ação enviada via GET (ex: ?action=carregarProjetos)
$action = $_GET["action"] ?? "";

// === Carregar projetos e notas ===
if ($action === "carregarProjetos") {
    // Consulta que busca todos os projetos e notas associadas ao perfil
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

    // Organiza os dados em formato de projeto → lista de notas
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
    // Recebe o JSON enviado no corpo da requisição
    $json = json_decode(file_get_contents("php://input"), true);
    $nome = $json["nome"];

    // Insere o novo projeto na tabela 'projetos'
    $sql = "INSERT INTO projetos (id_perfil, nome) VALUES (?, ?)";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("is", $id_perfil, $nome);

    // Em caso de erro, retorna erro HTTP 500 com mensagem
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

    // Busca o ID do projeto com base no nome e perfil
    $sql = "SELECT id FROM projetos WHERE nome = ? AND id_perfil = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("si", $projeto, $id_perfil);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();

    // Se o projeto não existir, retorna erro 400
    if (!$row) {
        http_response_code(400);
        echo json_encode(["erro" => "Projeto não encontrado"]);
        exit;
    }

    $id_projeto = $row["id"];

    // Insere nova nota com título e conteúdo vazio
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

    // Busca o conteúdo da nota com base no nome do projeto, título da nota e id_perfil
    $sql = "SELECT n.conteudo 
            FROM notas n 
            JOIN projetos p ON n.id_projeto = p.id 
            WHERE p.nome = ? AND p.id_perfil = ? AND n.titulo = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("sis", $projeto, $id_perfil, $titulo);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();

    // Retorna o conteúdo da nota (ou vazio se não houver)
    echo json_encode(["conteudo" => $row["conteudo"] ?? ""]);
    exit;
}

// === Salvar conteúdo de uma anotação ===
if ($action === "salvarConteudo") {
    $json = json_decode(file_get_contents("php://input"), true);
    $projeto = $json["projeto"];
    $titulo = $json["titulo"];
    $conteudo = $json["conteudo"];

    // Busca o ID da nota
    $sql = "SELECT n.id 
            FROM notas n 
            JOIN projetos p ON n.id_projeto = p.id 
            WHERE p.nome = ? AND p.id_perfil = ? AND n.titulo = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("sis", $projeto, $id_perfil, $titulo);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();

    // Se a nota não existir, retorna erro
    if (!$row) {
        http_response_code(400);
        echo json_encode(["erro" => "Nota não encontrada"]);
        exit;
    }

    $id_nota = $row["id"];

    // Atualiza o conteúdo e marca a data de atualização
    $sql = "UPDATE notas SET conteudo = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("si", $conteudo, $id_nota);
    $stmt->execute();

    echo json_encode(["sucesso" => true]);
    exit;
}

// === Excluir anotação ===
if ($action === "excluirAnotacao") {
    $json = json_decode(file_get_contents("php://input"), true);
    $projeto = $json["projeto"];
    $titulo = $json["titulo"];

    // Exclui nota com base no título, nome do projeto e id_perfil
    $sql = "DELETE n 
            FROM notas n
            JOIN projetos p ON n.id_projeto = p.id
            WHERE n.titulo = ? AND p.nome = ? AND p.id_perfil = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("ssi", $titulo, $projeto, $id_perfil);
    $stmt->execute();

    echo json_encode(["sucesso" => true]);
    exit;
}

// === Excluir projeto ===
if ($action === "excluirProjeto") {
    $json = json_decode(file_get_contents("php://input"), true);
    $projeto = $json["projeto"];

    // Exclui projeto com base no nome e perfil
    $sql = "DELETE FROM projetos WHERE nome = ? AND id_perfil = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("si", $projeto, $id_perfil);
    $stmt->execute();

    echo json_encode(["sucesso" => true]);
    exit;
}
?>
