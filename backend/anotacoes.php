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