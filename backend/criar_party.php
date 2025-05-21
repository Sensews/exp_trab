<?php
// Define o tipo de retorno como JSON
header('Content-Type: application/json');

// Ativa exceções para erros do MySQLi
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Inclui arquivos essenciais
require_once("conexao.php");
require_once("time.php");

// Inicia a sessão e valida se o usuário está autenticado
session_start();
$id_perfil = $_SESSION['id_perfil'] ?? null;

if (!$id_perfil) {
    echo json_encode(["sucesso" => false, "erro" => "Perfil não autenticado"]);
    exit;
}

// Função para enviar resposta JSON e encerrar conexão
function responder($array) {
    global $conexao;
    echo json_encode($array);
    $conexao->close();
    exit;
}

// Função que gera um código único para a party
function gerarCodigoUnico($conexao, $tamanho = 6) {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    do {
        $codigo = '';
        for ($i = 0; $i < $tamanho; $i++) {
            $codigo .= $chars[random_int(0, strlen($chars) - 1)];
        }

        $stmt = $conexao->prepare("SELECT id FROM party WHERE codigo = ?");
        $stmt->bind_param("s", $codigo);
        $stmt->execute();
        $res = $stmt->get_result();
    } while ($res->num_rows > 0); // Garante que não gere código repetido

    return $codigo;
}

// Recebe os dados enviados via POST
$nome      = $_POST['nome']      ?? '';
$senha     = $_POST['senha']     ?? '';
$idMapa    = $_POST['mapaId']    ?? null;
$idPerfil  = $_POST['id_perfil'] ?? null;
$limite    = $_POST['limite']    ?? 5;

// Validações básicas dos dados recebidos
if (!$nome || !$senha || !$idMapa || !$idPerfil) {
    responder(['sucesso' => false, 'erro' => 'Dados incompletos.']);
}

if (!is_numeric($idMapa)) {
    responder(['sucesso' => false, 'erro' => 'ID do mapa inválido.']);
}

// Verifica se o perfil já possui uma party ativa
$stmt = $conexao->prepare("SELECT id FROM party WHERE id_mestre = ?");
$stmt->bind_param("i", $idPerfil);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows > 0) {
    responder(['sucesso' => false, 'erro' => 'Você já possui uma party ativa. Exclua a atual para criar outra.']);
}

// Verifica se o mapa pertence ao mestre
$stmt = $conexao->prepare("SELECT id FROM mapas WHERE id = ? AND id_perfil = ?");
$stmt->bind_param("ii", $idMapa, $idPerfil);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    responder(['sucesso' => false, 'erro' => 'Mapa inválido ou não pertence a você.']);
}

// Gera um código único para a nova party
$codigo = gerarCodigoUnico($conexao);

// Cria a party no banco de dados
$stmt = $conexao->prepare("
    INSERT INTO party (nome, senha, codigo, id_mestre, id_mapa, limite_jogadores)
    VALUES (?, ?, ?, ?, ?, ?)
");
$stmt->bind_param("sssiii", $nome, $senha, $codigo, $idPerfil, $idMapa, $limite);
$stmt->execute();
$idParty = $conexao->insert_id;

// Adiciona o próprio mestre como membro da party
$stmt = $conexao->prepare("
    INSERT INTO party_membros (id_party, id_perfil, status)
    VALUES (?, ?, 'ativo')
");
$stmt->bind_param("ii", $idParty, $idPerfil);
$stmt->execute();

// Resposta final de sucesso com dados da party criada
responder([
    'sucesso'  => true,
    'id_party' => $idParty,
    'codigo'   => $codigo,
    'senha'    => $senha
]);
