<?php
// Define o tipo de conteúdo como JSON com charset UTF-8
header("Content-Type: application/json; charset=utf-8");

// Ativa modo estrito para exibir exceções de erros no MySQLi
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Inicia a sessão para acessar dados do usuário logado
session_start();

// Inclui arquivos de conexão com o banco e controle de tempo
require_once("conexao.php");
require_once("time.php");

// Verifica se o usuário está logado
if (!isset($_SESSION['id_perfil'])) {
    // Se não estiver logado, retorna JSON com logado: false
    echo json_encode(["logado" => false]);
    exit;
}

// Recupera o id_perfil da sessão
$id_perfil = $_SESSION['id_perfil'];

// Captura os dados enviados via POST
$nome = $_POST["nome"] ?? null;
$senha = $_POST["senha"] ?? null;
$limite = $_POST["limite"] ?? 5; // valor padrão: 5 jogadores

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
        "senha" => $senha
    ]);

} catch (Exception $e) {
    // Em caso de erro, retorna mensagem de falha
    echo json_encode(["sucesso" => false, "erro" => "Erro ao criar party: " . $e->getMessage()]);
}
