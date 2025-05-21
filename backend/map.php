<?php
require_once("conexao.php");
require_once("time.php");
header('Content-Type: application/json');
session_start();
$id_perfil = $_SESSION['id_perfil'] ?? null;
if (!$id_perfil) {
    echo json_encode(['success' => false, 'erro' => 'Perfil não autenticado.']);
    exit;
}


function json_response($data) {
    echo json_encode($data);
    exit;
}

// 1. Criar novo mapa
if ($action === "criarMapa") {
    $nome = $_POST["nome"] ?? "Mapa Sem Nome";

    $stmt = $conexao->prepare("INSERT INTO mapas (id_perfil, nome) VALUES (?, ?)");
    $stmt->bind_param("is", $id_perfil, $nome);

    if ($stmt->execute()) {
        json_response(["success" => true, "id_mapa" => $conexao->insert_id]);
    } else {
        json_response(["success" => false, "error" => $stmt->error]);
    }
}

// 2. Carregar imagens
if ($action === "carregarImagens") {
    $id_mapa = $_GET["id_mapa"] ?? null;
    if (!$id_mapa) json_response(["success" => false, "error" => "id_mapa ausente"]);

    $stmt = $conexao->prepare("SELECT * FROM mapa_imagens WHERE id_mapa = ?");
    $stmt->bind_param("i", $id_mapa);
    $stmt->execute();
    $result = $stmt->get_result();

    $imagens = [];
    while ($row = $result->fetch_assoc()) {
        $imagens[] = $row;
    }

    json_response($imagens);
}

// 3. Salvar imagem
if ($action === "salvarImagem") {
    $dados = json_decode(file_get_contents("php://input"), true);
    if (!isset($dados["id_mapa"], $dados["url"], $dados["x"], $dados["y"], $dados["largura"], $dados["altura"], $dados["rotacao"], $dados["z_index"], $dados["trancada"])) {
        json_response(["success" => false, "error" => "Dados incompletos"]);
    }

    $stmt = $conexao->prepare("INSERT INTO mapa_imagens (id_mapa, url, posicao_x, posicao_y, largura, altura, rotacao, z_index, trancada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isddddiii",
        $dados["id_mapa"], $dados["url"], $dados["x"], $dados["y"],
        $dados["largura"], $dados["altura"], $dados["rotacao"],
        $dados["z_index"], $dados["trancada"]
    );

    if ($stmt->execute()) {
        json_response(["success" => true]);
    } else {
        json_response(["success" => false, "error" => $stmt->error]);
    }
}