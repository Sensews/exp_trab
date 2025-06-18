<?php
// Script para configurar o MySQL para suportar imagens maiores

require_once 'conexao.php';

try {
    // Aumentar max_allowed_packet para 16MB (suficiente para imagens)
    $query = "SET GLOBAL max_allowed_packet = 16777216"; // 16MB
    $result = $conexao->query($query);
    
    if ($result) {
        echo "✓ max_allowed_packet configurado para 16MB\n";
    } else {
        echo "✗ Erro ao configurar max_allowed_packet: " . $conexao->error . "\n";
    }
    
    // Verificar a configuração
    $result = $conexao->query("SHOW VARIABLES LIKE 'max_allowed_packet'");
    if ($result) {
        $row = $result->fetch_assoc();
        $size_mb = round($row['Value'] / 1024 / 1024, 2);
        echo "✓ Configuração atual: {$size_mb} MB\n";
    }
    
    echo "\nNOTA: Para tornar esta configuração permanente, adicione no my.ini:\n";
    echo "[mysqld]\n";
    echo "max_allowed_packet = 16M\n";
    
} catch (Exception $e) {
    echo "Erro ao configurar MySQL: " . $e->getMessage() . "\n";
}

$conexao->close();
?>
