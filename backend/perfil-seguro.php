<?php
require_once 'SecureEndpoint.php';
require_once("conexao.php");
include_once 'time.php';

ini_set('display_errors', 0);
error_reporting(E_ALL);

$endpoint = new SecureEndpoint();

try {
    $id_usuario = $_SESSION["id_usuario"] ?? null;
    $action = $_GET["action"] ?? '';

    // Log para debug
    file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - ID usuário: " . ($id_usuario ?? 'null') . " - Ação: $action\n", FILE_APPEND);

    if (!$id_usuario) {
        $endpoint->sendData([
            "status" => "erro",
            "msg" => "Usuário não autenticado"
        ]);
        exit;
    }

    if ($action === "carregar") {
        // Carrega dados do perfil
        $sqlPerfil = "SELECT * FROM perfil WHERE id_usuario = ?";
        $stmt = $conexao->prepare($sqlPerfil);
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $resultado = $stmt->get_result();
        
        if ($resultado->num_rows > 0) {
            $perfil = $resultado->fetch_assoc();
            $endpoint->sendData($perfil);
        } else {
            // Cria perfil padrão se não existir
            $sqlCriar = "INSERT INTO perfil (id_usuario, nome, arroba, bio, tipo) 
                        SELECT nome, CONCAT('@', LOWER(REPLACE(nome, ' ', ''))), 'Sua bio aqui', 'jogador' 
                        FROM usuarios WHERE id = ?";
            $stmt = $conexao->prepare($sqlCriar);
            $stmt->bind_param("i", $id_usuario);
            
            if ($stmt->execute()) {
                $endpoint->sendData([
                    "id_perfil" => $conexao->insert_id,
                    "nome" => "Usuário",
                    "arroba" => "@usuario",
                    "bio" => "Sua bio aqui",
                    "tipo" => "jogador"
                ]);
            } else {
                $endpoint->sendData([
                    "status" => "erro",
                    "msg" => "Erro ao criar perfil"
                ]);
            }
        }

    } elseif ($action === "salvar") {
        // Recebe dados criptografados do perfil
        $dados = $endpoint->receiveData();
        
        $nome = trim($dados['nome'] ?? '');
        $arroba = trim($dados['arroba'] ?? '');
        $bio = $dados['bio'] ?? '';
        $local = $dados['local'] ?? '';
        $aniversario = $dados['aniversario'] ?? null;
        $avatar = $dados['avatar'] ?? null;
        $banner = $dados['banner'] ?? null;
        $tipo = $dados['tipo'] ?? 'jogador';

        if (empty($nome) || empty($arroba)) {
            $endpoint->sendData([
                "status" => "erro",
                "msg" => "Nome e usuário são obrigatórios"
            ]);
            exit;
        }

        // Verifica se o perfil já existe
        $sqlVerifica = "SELECT id_perfil FROM perfil WHERE id_usuario = ?";
        $stmt = $conexao->prepare($sqlVerifica);
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $resultado = $stmt->get_result();

        if ($resultado->num_rows > 0) {
            // Atualiza perfil existente
            $sqlUpdate = "UPDATE perfil SET nome = ?, arroba = ?, bio = ?, local = ?, aniversario = ?, avatar = ?, banner = ?, tipo = ? WHERE id_usuario = ?";
            $stmt = $conexao->prepare($sqlUpdate);
            $stmt->bind_param("ssssssssi", $nome, $arroba, $bio, $local, $aniversario, $avatar, $banner, $tipo, $id_usuario);
        } else {
            // Cria novo perfil
            $sqlInsert = "INSERT INTO perfil (id_usuario, nome, arroba, bio, local, aniversario, avatar, banner, tipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conexao->prepare($sqlInsert);
            $stmt->bind_param("issssssss", $id_usuario, $nome, $arroba, $bio, $local, $aniversario, $avatar, $banner, $tipo);
        }

        if ($stmt->execute()) {
            // Salva na sessão também
            $_SESSION['id_perfil'] = $resultado->num_rows > 0 ? $resultado->fetch_assoc()['id_perfil'] : $conexao->insert_id;
            
            $endpoint->sendData([
                "status" => "ok",
                "msg" => "Perfil salvo com sucesso"
            ]);
        } else {
            $endpoint->sendData([
                "status" => "erro",
                "msg" => "Erro ao salvar perfil: " . $stmt->error
            ]);
        }

    } else {
        $endpoint->sendData([
            "status" => "erro",
            "msg" => "Ação inválida"
        ]);
    }

} catch (Exception $e) {
    error_log("Erro no perfil-seguro: " . $e->getMessage());
    $endpoint->sendData([
        "status" => "erro",
        "msg" => "Erro interno: " . $e->getMessage()
    ]);
}
