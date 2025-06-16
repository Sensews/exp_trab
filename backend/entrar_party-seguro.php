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

    $codigo = trim($dados['codigo'] ?? '');
    $senha = trim($dados['senha'] ?? '');
    $id_ficha = $dados['id_ficha'] ?? null;

    if (!$codigo || !$senha || !$id_ficha) {
        $endpoint->sendData([
            "sucesso" => false,
            "erro" => "Dados incompletos"
        ]);
        exit;
    }

    // Busca a party pelo código
    $sql = "SELECT id, nome, senha, id_mestre, limite_jogadores FROM parties WHERE codigo = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("s", $codigo);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 0) {
        $endpoint->sendData([
            "sucesso" => false,
            "erro" => "Party não encontrada"
        ]);
        exit;
    }

    $party = $resultado->fetch_assoc();

    // Verifica a senha
    if (!password_verify($senha, $party['senha'])) {
        $endpoint->sendData([
            "sucesso" => false,
            "erro" => "Senha incorreta"
        ]);
        exit;
    }

    // Verifica se já está na party
    $sqlJaEsta = "SELECT id FROM party_jogadores WHERE id_party = ? AND id_perfil = ?";
    $stmtJaEsta = $conexao->prepare($sqlJaEsta);
    $stmtJaEsta->bind_param("ii", $party['id'], $id_perfil);
    $stmtJaEsta->execute();
    $jaEsta = $stmtJaEsta->get_result();

    if ($jaEsta->num_rows > 0) {
        $endpoint->sendData([
            "sucesso" => false,
            "erro" => "Você já está nesta party"
        ]);
        exit;
    }

    // Verifica limite de jogadores
    $sqlContaJogadores = "SELECT COUNT(*) as total FROM party_jogadores WHERE id_party = ? AND tipo = 'jogador'";
    $stmtConta = $conexao->prepare($sqlContaJogadores);
    $stmtConta->bind_param("i", $party['id']);
    $stmtConta->execute();
    $totalJogadores = $stmtConta->get_result()->fetch_assoc()['total'];

    if ($totalJogadores >= $party['limite_jogadores']) {
        $endpoint->sendData([
            "sucesso" => false,
            "erro" => "Party está cheia"
        ]);
        exit;
    }

    // Verifica se a ficha pertence ao jogador
    $sqlFicha = "SELECT id FROM fichas WHERE id = ? AND id_perfil = ?";
    $stmtFicha = $conexao->prepare($sqlFicha);
    $stmtFicha->bind_param("ii", $id_ficha, $id_perfil);
    $stmtFicha->execute();
    $fichaValida = $stmtFicha->get_result();

    if ($fichaValida->num_rows === 0) {
        $endpoint->sendData([
            "sucesso" => false,
            "erro" => "Ficha inválida ou não encontrada"
        ]);
        exit;
    }

    // Adiciona o jogador à party
    $sqlAdicionar = "INSERT INTO party_jogadores (id_party, id_perfil, id_ficha, tipo, entrou_em) VALUES (?, ?, ?, 'jogador', NOW())";
    $stmtAdicionar = $conexao->prepare($sqlAdicionar);
    $stmtAdicionar->bind_param("iii", $party['id'], $id_perfil, $id_ficha);

    if ($stmtAdicionar->execute()) {
        // Salva informações da party na sessão
        $_SESSION['party_atual'] = [
            'id' => $party['id'],
            'nome' => $party['nome'],
            'codigo' => $codigo,
            'tipo_usuario' => 'jogador'
        ];

        $endpoint->sendData([
            "sucesso" => true,
            "mensagem" => "Entrou na party com sucesso!",
            "party_nome" => $party['nome']
        ]);
    } else {
        $endpoint->sendData([
            "sucesso" => false,
            "erro" => "Erro ao entrar na party: " . $stmtAdicionar->error
        ]);
    }

} catch (Exception $e) {
    error_log("Erro no entrar_party-seguro: " . $e->getMessage());
    $endpoint->sendData([
        "sucesso" => false,
        "erro" => "Erro interno do servidor"
    ]);
}
