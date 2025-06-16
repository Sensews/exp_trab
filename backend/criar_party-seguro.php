<?php
require_once 'SecureEndpoint.php';
require_once("conexao.php");
include_once 'time.php';

$endpoint = new SecureEndpoint();

try {
    // Recebe dados criptografados
    $dados = $endpoint->receiveData();
    
    $id_perfil = $_SESSION['id_perfil'] ?? null;
    
    if (!$id_perfil) {
        $endpoint->sendData([
            "sucesso" => false,
            "erro" => "Usuário não autenticado"
        ]);
        exit;
    }

    $nome = trim($dados['nome'] ?? '');
    $senha = trim($dados['senha'] ?? '');
    $id_mapa = $dados['mapaId'] ?? null;
    $limite = $dados['limite'] ?? 5;

    if (!$nome || !$senha || !$id_mapa) {
        $endpoint->sendData([
            "sucesso" => false,
            "erro" => "Dados incompletos"
        ]);
        exit;
    }

    // Gera código único para a party (6 dígitos)
    do {
        $codigo = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $stmt = $conexao->prepare("SELECT COUNT(*) FROM parties WHERE codigo = ?");
        $stmt->bind_param("s", $codigo);
        $stmt->execute();
        $result = $stmt->get_result();
        $exists = $result->fetch_row()[0] > 0;
    } while ($exists);

    // Hash da senha para segurança
    $senha_hash = password_hash($senha, PASSWORD_DEFAULT);

    // Insere a party no banco
    $sql = "INSERT INTO parties (codigo, nome, senha, id_mestre, id_mapa, limite_jogadores, criado_em) VALUES (?, ?, ?, ?, ?, ?, NOW())";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("sssiii", $codigo, $nome, $senha_hash, $id_perfil, $id_mapa, $limite);

    if ($stmt->execute()) {
        $party_id = $conexao->insert_id;
        
        // Adiciona o mestre como participante
        $sqlMestre = "INSERT INTO party_jogadores (id_party, id_perfil, tipo, entrou_em) VALUES (?, ?, 'mestre', NOW())";
        $stmtMestre = $conexao->prepare($sqlMestre);
        $stmtMestre->bind_param("ii", $party_id, $id_perfil);
        $stmtMestre->execute();
        
        $endpoint->sendData([
            "sucesso" => true,
            "mensagem" => "Party criada com sucesso!",
            "codigo" => $codigo,
            "id_party" => $party_id
        ]);
    } else {
        $endpoint->sendData([
            "sucesso" => false,
            "erro" => "Erro ao criar party: " . $stmt->error
        ]);
    }

} catch (Exception $e) {
    error_log("Erro no criar_party-seguro: " . $e->getMessage());
    $endpoint->sendData([
        "sucesso" => false,
        "erro" => "Erro interno do servidor"
    ]);
}
