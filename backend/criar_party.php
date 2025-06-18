<?php
// Define o tipo de conteúdo como JSON com charset UTF-8
header("Content-Type: application/json; charset=utf-8");

// Desabilita a saída de erros para manter JSON limpo
error_reporting(0);
ini_set('display_errors', 0);

// Ativa modo estrito para exibir exceções de erros no MySQLi
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Inicia a sessão para acessar dados do usuário logado
session_start();

// Inclui arquivos de conexão com o banco e controle de tempo
require_once("conexao.php");
require_once("time.php");
require_once("simple_crypto.php");

// Verifica se o usuário está logado
if (!isset($_SESSION['id_perfil'])) {
    // Se não estiver logado, retorna JSON com logado: false
    echo json_encode(["logado" => false]);
    exit;
}

// Recupera o id_perfil da sessão
$id_perfil = $_SESSION['id_perfil'];

// Verifica se há dados criptografados
$encrypted_data = $_POST['encrypted_data'] ?? null;

if ($encrypted_data) {
    // Descriptografar dados
    try {
        $crypto = new SimpleCrypto();
        $decrypted_json = $crypto->decrypt($encrypted_data);
        $data = json_decode($decrypted_json, true);
        
        if (!$data) {
            throw new Exception("Dados inválidos após descriptografia");
        }
        
        $nome = $data["nome"] ?? null;
        $senha = $data["senha"] ?? null;
        $limite = $data["limite"] ?? 5;
        
    } catch (Exception $e) {
        echo json_encode(["sucesso" => false, "erro" => "Erro na descriptografia: " . $e->getMessage()]);
        exit;
    }
} else {
    // Fallback: captura dados não criptografados
    $nome = $_POST["nome"] ?? null;
    $senha = $_POST["senha"] ?? null;
    $limite = $_POST["limite"] ?? 5; // valor padrão: 5 jogadores
}

// Verifica se os campos obrigatórios foram preenchidos
if (!$nome || !$senha) {
    echo json_encode(["sucesso" => false, "erro" => "Preencha todos os campos obrigatórios."]);
    exit;
}

// Função para gerar um código de party único (ex: A1B2C3)
function gerarCodigoUnico($conexao) {
    do {
        // Gera um código hexadecimal aleatório, converte para maiúsculo
        $codigo = strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));

        // Verifica se o código já existe no banco
        $stmt = $conexao->prepare("SELECT 1 FROM party WHERE codigo = ?");
        $stmt->bind_param("s", $codigo);
        $stmt->execute();
        $existe = $stmt->get_result()->num_rows > 0;

    } while ($existe); // repete até gerar um código único

    return $codigo;
}

try {
    // === Deletar parties anteriores do mesmo mestre ===
    // Buscar todas as parties criadas por este mestre
    $stmt = $conexao->prepare("SELECT id FROM party WHERE id_mestre = ?");
    $stmt->bind_param("i", $id_perfil);
    $stmt->execute();
    $parties_antigas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Para cada party antiga, deletar dados relacionados
    foreach ($parties_antigas as $party_antiga) {
        $id_party_antiga = $party_antiga['id'];
        
        // Deletar mensagens do chat
        $stmt = $conexao->prepare("DELETE FROM party_chat WHERE id_party = ?");
        $stmt->bind_param("i", $id_party_antiga);
        $stmt->execute();
        
        // Deletar membros da party
        $stmt = $conexao->prepare("DELETE FROM party_membros WHERE id_party = ?");
        $stmt->bind_param("i", $id_party_antiga);
        $stmt->execute();
        
        // Deletar a party
        $stmt = $conexao->prepare("DELETE FROM party WHERE id = ?");
        $stmt->bind_param("i", $id_party_antiga);
        $stmt->execute();
    }
    
    // === Criar nova party ===
    // Gera o código exclusivo para a nova party
    $codigo = gerarCodigoUnico($conexao);

    // Insere a nova party no banco de dados
    $stmt = $conexao->prepare("INSERT INTO party (nome, senha, codigo, id_mestre, limite_jogadores) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssii", $nome, $senha, $codigo, $id_perfil, $limite);
    $stmt->execute();
    $id_party = $conexao->insert_id; // recupera o ID gerado da party

    // Adiciona o mestre como membro da própria party (status: ativo)
    $stmtMembro = $conexao->prepare("INSERT INTO party_membros (id_party, id_perfil, status) VALUES (?, ?, 'ativo')");
    $stmtMembro->bind_param("ii", $id_party, $id_perfil);
    $stmtMembro->execute();

    // Retorna sucesso com os dados da party criada
    echo json_encode([
        "sucesso" => true,
        "id_party" => $id_party,
        "codigo" => $codigo,
        "senha" => $senha,
        "mensagem" => "Party criada com sucesso! Parties anteriores foram removidas."
    ]);

} catch (Exception $e) {
    // Em caso de erro, retorna mensagem de falha
    echo json_encode(["sucesso" => false, "erro" => "Erro ao criar party: " . $e->getMessage()]);
}
