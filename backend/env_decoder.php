<?php
/**
 * Descodificador de valores do .env
 * 
 * Este arquivo contém funções para decodificar valores ofuscados do arquivo .env
 * Ele usa uma chave simples para ofuscar/desofuscar os valores
 */

// Chave de ofuscação - NÃO ALTERE DEPOIS DE CONFIGURAR!
define('ENV_KEY', 'oblivion2025');

/**
 * Função para obter o valor real de uma variável do .env
 * 
 * @param string $nome Nome da variável de ambiente
 * @return string|null Valor decodificado ou null se não existir
 */
function obter_env($nome) {
    // Pega o valor ofuscado do .env
    $valor_ofuscado = getenv($nome);
    
    if ($valor_ofuscado === false) {
        return null;
    }
    
    // Decodifica o valor
    return decodificar_env($valor_ofuscado);
}

/**
 * Decodifica um valor ofuscado
 * 
 * @param string $valor_ofuscado Valor ofuscado
 * @return string Valor original
 */
function decodificar_env($valor_ofuscado) {
    // Remove prefixo "ENC:"
    if (strpos($valor_ofuscado, 'ENC:') === 0) {
        $valor_ofuscado = substr($valor_ofuscado, 4);
    } else {
        // Se não tem o prefixo, retorna o valor como está (não foi ofuscado)
        return $valor_ofuscado;
    }
    
    // Converte de base64
    $valor_codificado = base64_decode($valor_ofuscado);
    
    // Usa a chave para decodificar o valor (XOR simples)
    $chave = ENV_KEY;
    $valor_real = '';
    $chave_len = strlen($chave);
    
    for ($i = 0, $len = strlen($valor_codificado); $i < $len; $i++) {
        $valor_real .= $valor_codificado[$i] ^ $chave[$i % $chave_len];
    }
    
    return $valor_real;
}

/**
 * Função utilitária para codificar valores (use para gerar valores ofuscados)
 * 
 * @param string $valor_real Valor original
 * @return string Valor ofuscado
 */
function codificar_env($valor_real) {
    $chave = ENV_KEY;
    $valor_codificado = '';
    $chave_len = strlen($chave);
    
    for ($i = 0, $len = strlen($valor_real); $i < $len; $i++) {
        $valor_codificado .= $valor_real[$i] ^ $chave[$i % $chave_len];
    }
    
    return 'ENC:' . base64_encode($valor_codificado);
}

// Para carregar as variáveis de ambiente no PHP se estiver usando .env diretamente
if (file_exists(__DIR__ . '/.env')) {
    $linhas = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($linhas as $linha) {
        if (strpos($linha, '//') === 0) continue; // Pula comentários
        
        list($nome, $valor) = explode('=', $linha, 2);
        $nome = trim($nome);
        $valor = trim($valor);
        
        putenv("$nome=$valor");
        $_ENV[$nome] = $valor;
    }
}
?>