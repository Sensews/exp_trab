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
        case 'salvarConteudo':
            $projeto = $dados['projeto'] ?? '';
            $titulo = $dados['titulo'] ?? '';
            $conteudo = $dados['conteudo'] ?? '';
            
            if (empty($projeto) || empty($titulo)) {
                $endpoint->sendData([
                    "success" => false,
                    "error" => "Projeto e título são obrigatórios"
                ]);
                exit;
            }

            // Verifica se a anotação já existe
            $sqlVerifica = "SELECT id FROM anotacoes WHERE id_perfil = ? AND projeto = ? AND titulo = ?";
            $stmt = $conexao->prepare($sqlVerifica);
            $stmt->bind_param("iss", $id_perfil, $projeto, $titulo);
            $stmt->execute();
            $resultado = $stmt->get_result();

            if ($resultado->num_rows > 0) {
                // Atualiza anotação existente
                $sqlUpdate = "UPDATE anotacoes SET conteudo = ?, atualizado_em = NOW() WHERE id_perfil = ? AND projeto = ? AND titulo = ?";
                $stmt = $conexao->prepare($sqlUpdate);
                $stmt->bind_param("siss", $conteudo, $id_perfil, $projeto, $titulo);
            } else {
                // Cria nova anotação
                $sqlInsert = "INSERT INTO anotacoes (id_perfil, projeto, titulo, conteudo, criado_em, atualizado_em) VALUES (?, ?, ?, ?, NOW(), NOW())";
                $stmt = $conexao->prepare($sqlInsert);
                $stmt->bind_param("isss", $id_perfil, $projeto, $titulo, $conteudo);
            }

            if ($stmt->execute()) {
                $endpoint->sendData([
                    "success" => true,
                    "message" => "Anotação salva com sucesso"
                ]);
            } else {
                $endpoint->sendData([
                    "success" => false,
                    "error" => "Erro ao salvar anotação"
                ]);
            }
            break;

        case 'carregarProjetos':
            $sql = "SELECT DISTINCT projeto FROM anotacoes WHERE id_perfil = ? ORDER BY projeto";
            $stmt = $conexao->prepare($sql);
            $stmt->bind_param("i", $id_perfil);
            $stmt->execute();
            $resultado = $stmt->get_result();
            
            $projetos = [];
            while ($row = $resultado->fetch_assoc()) {
                $projetos[] = $row['projeto'];
            }
            
            $endpoint->sendData([
                "success" => true,
                "projetos" => $projetos
            ]);
            break;

        case 'carregarAnotacoes':
            $projeto = $dados['projeto'] ?? '';
            
            if (empty($projeto)) {
                $endpoint->sendData([
                    "success" => false,
                    "error" => "Projeto é obrigatório"
                ]);
                exit;
            }

            $sql = "SELECT titulo, conteudo, atualizado_em FROM anotacoes WHERE id_perfil = ? AND projeto = ? ORDER BY titulo";
            $stmt = $conexao->prepare($sql);
            $stmt->bind_param("is", $id_perfil, $projeto);
            $stmt->execute();
            $resultado = $stmt->get_result();
            
            $anotacoes = [];
            while ($row = $resultado->fetch_assoc()) {
                $anotacoes[] = [
                    'titulo' => $row['titulo'],
                    'conteudo' => $row['conteudo'],
                    'atualizado_em' => $row['atualizado_em']
                ];
            }
            
            $endpoint->sendData([
                "success" => true,
                "anotacoes" => $anotacoes
            ]);
            break;

        case 'excluirAnotacao':
            $projeto = $dados['projeto'] ?? '';
            $titulo = $dados['titulo'] ?? '';
            
            if (empty($projeto) || empty($titulo)) {
                $endpoint->sendData([
                    "success" => false,
                    "error" => "Projeto e título são obrigatórios"
                ]);
                exit;
            }

            $sql = "DELETE FROM anotacoes WHERE id_perfil = ? AND projeto = ? AND titulo = ?";
            $stmt = $conexao->prepare($sql);
            $stmt->bind_param("iss", $id_perfil, $projeto, $titulo);
            
            if ($stmt->execute()) {
                $endpoint->sendData([
                    "success" => true,
                    "message" => "Anotação excluída com sucesso"
                ]);
            } else {
                $endpoint->sendData([
                    "success" => false,
                    "error" => "Erro ao excluir anotação"
                ]);
            }
            break;

        default:
            $endpoint->sendData([
                "success" => false,
                "error" => "Ação inválida"
            ]);
    }

} catch (Exception $e) {
    error_log("Erro no anotacoes-seguras: " . $e->getMessage());
    $endpoint->sendData([
        "success" => false,
        "error" => "Erro interno do servidor"
    ]);
}
