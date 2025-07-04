<?php
header('Content-Type: application/json; charset=utf-8');

// Desabilita a saída de erros para manter JSON limpo
error_reporting(0);
ini_set('display_errors', 0);

// Ativa relatórios de erro no estilo de exceções para o MySQLi
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Inicia a sessão para acessar dados do usuário logado
session_start();

require_once("conexao.php");
require_once("time.php");
require_once("simple_crypto.php");

// Verifica se o usuário está autenticado
if (!isset($_SESSION['id_perfil'])) {
    // Se não estiver logado, retorna resposta com status falso
    echo json_encode(["logado" => false]);
    exit;
}

// Recupera o ID do perfil da sessão
$id_perfil = $_SESSION['id_perfil'];

// Capturar dados de entrada
$input_data = file_get_contents("php://input");
$json = json_decode($input_data, true);

// Debug temporário
error_log("ENTRAR PARTY DEBUG - Input raw: " . $input_data);
error_log("ENTRAR PARTY DEBUG - JSON decoded: " . json_encode($json));

// Verifica se há dados criptografados
if (isset($json['encrypted_data'])) {
    error_log("ENTRAR PARTY DEBUG - Encrypted data found");
    // Descriptografar dados
    try {
        $crypto = new SimpleCrypto();
        $decrypted_data = $crypto->decrypt($json['encrypted_data']);
        error_log("ENTRAR PARTY DEBUG - Decrypted data: " . json_encode($decrypted_data));
        
        if (!$decrypted_data) {
            throw new Exception("Dados inválidos após descriptografia");
        }
        
        $codigo = $decrypted_data['codigo'] ?? null;
        $senha = $decrypted_data['senha'] ?? null;
        error_log("ENTRAR PARTY DEBUG - Codigo: '$codigo', Senha: '$senha'");
        
    } catch (Exception $e) {
        error_log("ENTRAR PARTY DEBUG - Decrypt error: " . $e->getMessage());
        echo json_encode(["sucesso" => false, "erro" => "Erro na descriptografia: " . $e->getMessage()]);
        exit;
    }
} else {
    error_log("ENTRAR PARTY DEBUG - No encrypted data, using fallback");
    // Fallback: dados não criptografados
    $codigo = $json['codigo'] ?? null;
    $senha = $json['senha'] ?? null;
    error_log("ENTRAR PARTY DEBUG - Fallback - Codigo: '$codigo', Senha: '$senha'");
}

// Validação básica dos campos obrigatórios
if (!$codigo || !$senha) {
    echo json_encode(["sucesso" => false, "erro" => "Dados incompletos."]);
    exit;
}

try {
    // Consulta o tipo do perfil atual (jogador ou mestre)
    $stmt = $conexao->prepare("SELECT tipo FROM perfil WHERE id_perfil = ?");
    $stmt->bind_param("i", $id_perfil);
    $stmt->execute();
    $res = $stmt->get_result();
    $perfil = $res->fetch_assoc();

    // Se o perfil não for encontrado, retorna erro
    if (!$perfil) {
        echo json_encode(["sucesso" => false, "erro" => "Perfil não encontrado."]);
        exit;
    }

    $tipo = $perfil['tipo']; // Armazena o tipo de perfil

    // Consulta se existe uma party com esse código e senha
    $stmt = $conexao->prepare("SELECT * FROM party WHERE codigo = ? AND senha = ?");
    $stmt->bind_param("ss", $codigo, $senha);
    $stmt->execute();
    $res = $stmt->get_result();

    // Se não encontrar nenhuma, retorna erro de código/senha inválido
    if ($res->num_rows === 0) {
        echo json_encode(["sucesso" => false, "erro" => "Código ou senha inválidos."]);
        exit;
    }

    $party = $res->fetch_assoc(); 
    $id_party = $party['id'];     

    // Se o usuário for mestre, ele só pode acessar a própria party
    if ($tipo === 'mestre') {
        if ((int)$party['id_mestre'] !== (int)$id_perfil) {
            echo json_encode([
                "sucesso" => false,
                "erro" => "Mestres só podem acessar a party que criaram."
            ]);
            exit;
        }

        // Mestre autorizado a acessar sua própria party
        echo json_encode([
            "sucesso" => true,
            "mensagem" => "Party do mestre confirmada.",
            "id_party" => $id_party
        ]);
        exit;
    }

    // Caso o usuário seja jogador: verifica se já está na party
    $stmt = $conexao->prepare("SELECT * FROM party_membros WHERE id_party = ? AND id_perfil = ?");
    $stmt->bind_param("ii", $id_party, $id_perfil);
    $stmt->execute();
    $res = $stmt->get_result();

    // Se não for membro ainda, adiciona com status "ativo"
    if ($res->num_rows === 0) {
        $stmt = $conexao->prepare("INSERT INTO party_membros (id_party, id_perfil, status) VALUES (?, ?, 'ativo')");
        $stmt->bind_param("ii", $id_party, $id_perfil);
        $stmt->execute();
    }

    // Retorna sucesso para jogador 
    echo json_encode([
        "sucesso" => true,
        "mensagem" => "Entrou na party com sucesso.",
        "id_party" => $id_party
    ]);

} catch (Exception $e) {
    // Em caso de exceção, retorna mensagem de erro do servidor
    echo json_encode([
        "sucesso" => false,
        "erro" => "Erro no servidor: " . $e->getMessage()
    ]);
}
