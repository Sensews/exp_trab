<?php
require_once 'SecureEndpoint.php';
require_once("conexao.php");
include_once 'time.php';

$endpoint = new SecureEndpoint();

try {
    // Recebe dados criptografados
    $dados = $endpoint->receiveData();
    
    $id_perfil = $_SESSION['id_perfil'] ?? null;
    $action = $dados['action'] ?? '';
    
    if (!$id_perfil) {
        $endpoint->sendData([
            "success" => false,
            "error" => "Usuário não autenticado"
        ]);
        exit;
    }

    switch ($action) {
        case 'enviarMensagem':
            $mensagem = trim($dados['mensagem'] ?? '');
            $party_id = $dados['party_id'] ?? null;
            
            if (empty($mensagem) || !$party_id) {
                $endpoint->sendData([
                    "success" => false,
                    "error" => "Dados incompletos"
                ]);
                exit;
            }

            // Verifica se o usuário está na party
            $sqlVerifica = "SELECT pj.tipo, p.nome as perfil_nome 
                           FROM party_jogadores pj 
                           JOIN perfil p ON pj.id_perfil = p.id_perfil 
                           WHERE pj.id_party = ? AND pj.id_perfil = ?";
            $stmt = $conexao->prepare($sqlVerifica);
            $stmt->bind_param("ii", $party_id, $id_perfil);
            $stmt->execute();
            $resultado = $stmt->get_result();

            if ($resultado->num_rows === 0) {
                $endpoint->sendData([
                    "success" => false,
                    "error" => "Você não está nesta party"
                ]);
                exit;
            }

            $participante = $resultado->fetch_assoc();

            // Insere a mensagem no chat
            $sqlInsert = "INSERT INTO party_chat (id_party, id_perfil, mensagem, enviado_em) VALUES (?, ?, ?, NOW())";
            $stmtInsert = $conexao->prepare($sqlInsert);
            $stmtInsert->bind_param("iis", $party_id, $id_perfil, $mensagem);

            if ($stmtInsert->execute()) {
                $endpoint->sendData([
                    "success" => true,
                    "mensagem" => [
                        "autor" => $participante['perfil_nome'],
                        "texto" => $mensagem,
                        "hora" => date('H:i:s')
                    ]
                ]);
            } else {
                $endpoint->sendData([
                    "success" => false,
                    "error" => "Erro ao enviar mensagem"
                ]);
            }
            break;

        case 'carregarMensagens':
            $party_id = $dados['party_id'] ?? null;
            
            if (!$party_id) {
                $endpoint->sendData([
                    "success" => false,
                    "error" => "ID da party não fornecido"
                ]);
                exit;
            }

            // Verifica se o usuário está na party
            $sqlVerifica = "SELECT id FROM party_jogadores WHERE id_party = ? AND id_perfil = ?";
            $stmt = $conexao->prepare($sqlVerifica);
            $stmt->bind_param("ii", $party_id, $id_perfil);
            $stmt->execute();
            $resultado = $stmt->get_result();

            if ($resultado->num_rows === 0) {
                $endpoint->sendData([
                    "success" => false,
                    "error" => "Você não está nesta party"
                ]);
                exit;
            }

            // Carrega as últimas 50 mensagens
            $sqlMensagens = "SELECT pc.mensagem, pc.enviado_em, p.nome as autor 
                            FROM party_chat pc 
                            JOIN perfil p ON pc.id_perfil = p.id_perfil 
                            WHERE pc.id_party = ? 
                            ORDER BY pc.enviado_em DESC 
                            LIMIT 50";
            $stmtMensagens = $conexao->prepare($sqlMensagens);
            $stmtMensagens->bind_param("i", $party_id);
            $stmtMensagens->execute();
            $resultadoMensagens = $stmtMensagens->get_result();

            $mensagens = [];
            while ($row = $resultadoMensagens->fetch_assoc()) {
                $mensagens[] = [
                    "autor" => $row['autor'],
                    "texto" => $row['mensagem'],
                    "hora" => date('H:i:s', strtotime($row['enviado_em']))
                ];
            }

            // Inverte para mostrar em ordem cronológica
            $mensagens = array_reverse($mensagens);

            $endpoint->sendData([
                "success" => true,
                "mensagens" => $mensagens
            ]);
            break;

        default:
            $endpoint->sendData([
                "success" => false,
                "error" => "Ação inválida"
            ]);
    }

} catch (Exception $e) {
    error_log("Erro no party-chat-seguro: " . $e->getMessage());
    $endpoint->sendData([
        "success" => false,
        "error" => "Erro interno do servidor"
    ]);
}
