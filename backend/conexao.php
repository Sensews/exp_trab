<?php
// Configurações de conexão
$host = "localhost";
$usuario = "root";
$senha = "";
$banco = "oblivion";

// Criar conexão
$conexao = new mysqli($host, $usuario, $senha, $banco);

// Verificar conexão
if ($conexao->connect_error) {
    die("Erro de conexão: " . $conexao->connect_error);
}

// Configurar charset
$conexao->set_charset("utf8mb4");
?>
