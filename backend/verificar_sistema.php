<?php
/**
 * Verificação final do sistema de criptografia
 */

echo "=== VERIFICAÇÃO FINAL DO SISTEMA ===\n\n";

// 1. Verificar se os arquivos existem
$arquivos = [
    'simple_crypto.php',
    'cadastro.php',
    '../frontend/js/simple_secure_client.js',
    '../frontend/js/cadastro.js',
    'crypto_keys/secret.key'
];

echo "1. Verificando arquivos...\n";
foreach ($arquivos as $arquivo) {
    if (file_exists($arquivo)) {
        echo "✓ {$arquivo}\n";
    } else {
        echo "✗ {$arquivo} - NÃO ENCONTRADO\n";
    }
}

// 2. Testar a criptografia
echo "\n2. Testando criptografia...\n";
try {
    require_once 'simple_crypto.php';
    $crypto = new SimpleCryptoHandler();
    
    $testData = ['teste' => 'funcionando', 'timestamp' => time() * 1000];
    $encrypted = $crypto->encrypt($testData);
    $decrypted = $crypto->decrypt($encrypted);
    
    if ($decrypted['teste'] === 'funcionando') {
        echo "✓ Criptografia funcionando\n";
    } else {
        echo "✗ Erro na criptografia\n";
    }
} catch (Exception $e) {
    echo "✗ Erro: " . $e->getMessage() . "\n";
}

// 3. Verificar API
echo "\n3. Testando API...\n";
try {
    $response = file_get_contents('http://localhost/exp_trab/backend/simple_crypto.php?action=getClientKey');
    $data = json_decode($response, true);
    
    if ($data && $data['success']) {
        echo "✓ API respondendo corretamente\n";
        echo "  Chave do cliente: " . substr($data['clientKey'], 0, 20) . "...\n";
    } else {
        echo "✗ API com problema\n";
    }
} catch (Exception $e) {
    echo "✗ Erro na API: " . $e->getMessage() . "\n";
}

// 4. Verificar banco de dados
echo "\n4. Testando conexão com banco...\n";
try {
    $conn = new mysqli("localhost", "root", "", "oblivion");
    if ($conn->connect_error) {
        echo "✗ Erro na conexão: " . $conn->connect_error . "\n";
    } else {
        echo "✓ Conexão com banco funcionando\n";
        
        // Verificar tabelas
        $result = $conn->query("SHOW TABLES LIKE 'usuarios'");
        if ($result && $result->num_rows > 0) {
            echo "✓ Tabela 'usuarios' existe\n";
        } else {
            echo "✗ Tabela 'usuarios' não encontrada\n";
        }
    }
    $conn->close();
} catch (Exception $e) {
    echo "✗ Erro no banco: " . $e->getMessage() . "\n";
}

echo "\n=== VERIFICAÇÃO CONCLUÍDA ===\n";
echo "\nPara testar o cadastro:\n";
echo "1. Acesse: http://localhost/exp_trab/frontend/cadastro.html\n";
echo "2. Preencha o formulário\n";
echo "3. Verifique o console do navegador para logs de criptografia\n";
echo "4. Verifique os logs do PHP para confirmação\n";
?>
