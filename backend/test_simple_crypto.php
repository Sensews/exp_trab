<?php
/**
 * Teste do sistema de criptografia simplificado
 */
require_once 'simple_crypto.php';

try {
    echo "=== TESTE DE CRIPTOGRAFIA SIMPLIFICADA ===\n";
    
    $cryptoHandler = new SimpleCryptoHandler();
    echo "✓ SimpleCryptoHandler inicializado\n";
    
    // Dados de teste
    $testData = [
        'nome' => 'João Silva',
        'email' => 'joao@exemplo.com',
        'telefone' => '(11) 99999-9999',
        'senha' => 'MinhaSenh@123',
        'timestamp' => time() * 1000
    ];
    
    echo "✓ Dados de teste preparados\n";
    
    // Criptografar
    $encrypted = $cryptoHandler->encrypt($testData);
    echo "✓ Dados criptografados\n";
    
    // Descriptografar
    $decrypted = $cryptoHandler->decrypt($encrypted);
    echo "✓ Dados descriptografados\n";
    
    // Verificar se os dados estão corretos
    if ($decrypted['nome'] === $testData['nome'] && 
        $decrypted['email'] === $testData['email']) {
        
        echo "✓ Teste PASSOU - dados corretos!\n";
        echo "  Nome: " . $decrypted['nome'] . "\n";
        echo "  Email: " . $decrypted['email'] . "\n";
        echo "  Telefone: " . $decrypted['telefone'] . "\n";
        
        // Testar timestamp
        if ($cryptoHandler->validateTimestamp($decrypted['timestamp'])) {
            echo "✓ Timestamp válido\n";
        } else {
            echo "✗ Timestamp inválido\n";
        }
        
        // Testar chave do cliente
        $clientKey = $cryptoHandler->getClientKey();
        echo "✓ Chave do cliente: " . substr($clientKey, 0, 20) . "...\n";
        
    } else {
        echo "✗ Teste FALHOU - dados não conferem\n";
        echo "Original: " . json_encode($testData) . "\n";
        echo "Descriptografado: " . json_encode($decrypted) . "\n";
    }
    
    echo "\n=== TESTE CONCLUÍDO ===\n";
    
} catch (Exception $e) {
    echo "✗ ERRO: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>
