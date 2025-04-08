<?php
$conn = new mysqli("localhost", "root", "", "oblivion");

if ($conn->connect_error) {
    error_log("Erro na conexão com o banco de dados: " . $conn->connect_error);
    return;
}

$limite = date('Y-m-d H:i:s', strtotime('-2 hours'));

$stmt = $conn->prepare("DELETE FROM usuarios WHERE confirmado = 0 AND criado_em < ?");
$stmt->bind_param("s", $limite);

if (!$stmt->execute()) {
    error_log("Erro ao executar a exclusão de pendentes: " . $stmt->error);
}

$conn->close();
