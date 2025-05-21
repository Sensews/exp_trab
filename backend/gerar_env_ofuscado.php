<?php
/**
 * Gerador de .env ofuscado
 * 
 * Este script lê o .env atual e gera uma versão ofuscada
 * Execute apenas uma vez para criar o novo arquivo
 */

require_once 'env_decoder.php';

// Lê o arquivo .env atual
$linhas = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$novo_conteudo = "// filepath: c:\\xampp\\htdocs\\exp_trab\\backend\\.env\n";
$novo_conteudo .= "// Arquivo .env protegido com esteganografia\n";
$novo_conteudo .= "// NÃO EDITE MANUALMENTE - Use o script gerar_env_ofuscado.php\n\n";

foreach ($linhas as $linha) {
    // Mantém comentários como estão
    if (strpos($linha, '//') === 0) {
        $novo_conteudo .= $linha . "\n";
        continue;
    }
    
    // Pula linhas vazias
    if (empty(trim($linha))) {
        $novo_conteudo .= "\n";
        continue;
    }
    
    // Processa variáveis
    list($nome, $valor) = explode('=', $linha, 2);
    $nome = trim($nome);
    $valor = trim($valor);
    
    // Ofusca o valor
    $valor_ofuscado = codificar_env($valor);
    
    $novo_conteudo .= "$nome=$valor_ofuscado\n";
}

// Salva o novo arquivo .env
file_put_contents(__DIR__ . '/.env.ofuscado', $novo_conteudo);
echo "Arquivo .env ofuscado gerado com sucesso!\n";

// Exibe instruções
echo "\nAgora você pode:\n";
echo "1. Renomear .env.ofuscado para .env\n";
echo "2. Usar obter_env('NOME_VARIAVEL') para acessar os valores\n";

// Exibe a listagem de variáveis para referência
echo "\nVariáveis ofuscadas:\n";
foreach ($linhas as $linha) {
    if (strpos($linha, '//') === 0 || empty(trim($linha))) continue;
    
    list($nome, $valor) = explode('=', $linha, 2);
    $nome = trim($nome);
    $valor_ofuscado = codificar_env(trim($valor));
    
    echo "$nome=$valor_ofuscado\n";
}
?>