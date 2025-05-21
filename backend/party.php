<?php
require_once("conexao.php");
include_once 'time.php';

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$id_perfil = $_SESSION['id_perfil'] ?? null;

$nome = trim($data['nome'] ?? '');
$senha = trim($data['senha'] ?? '');
$id_mapa = $data['id_mapa'] ?? null;

if (!$nome || !$senha || !$id_perfil) {
    echo json_encode(["erro" => "Dados incompletos"]);
    exit;
}
