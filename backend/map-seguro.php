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
        case 'criarMapa':
            $nome = $dados['nome'] ?? 'Novo Mapa';
            $largura = $dados['largura'] ?? 2000;
            $altura = $dados['altura'] ?? 2000;
            
            $sql = "INSERT INTO mapas (id_perfil, nome, largura, altura, criado_em) VALUES (?, ?, ?, ?, NOW())";
            $stmt = $conexao->prepare($sql);
            $stmt->bind_param("isii", $id_perfil, $nome, $largura, $altura);
            
            if ($stmt->execute()) {
                $mapa_id = $conexao->insert_id;
                $endpoint->sendData([
                    "success" => true,
                    "id" => $mapa_id,
                    "message" => "Mapa criado com sucesso"
                ]);
            } else {
                $endpoint->sendData([
                    "success" => false,
                    "error" => "Erro ao criar mapa"
                ]);
            }
            break;

        case 'carregarImagens':
            $id_mapa = $dados['id_mapa'] ?? 1;
            
            $sql = "SELECT * FROM mapa_imagens WHERE id_mapa = ? ORDER BY z_index DESC";
            $stmt = $conexao->prepare($sql);
            $stmt->bind_param("i", $id_mapa);
            $stmt->execute();
            $resultado = $stmt->get_result();
            
            $imagens = [];
            while ($row = $resultado->fetch_assoc()) {
                $imagens[] = [
                    'id' => $row['id'],
                    'url' => $row['url'],
                    'x' => $row['x'],
                    'y' => $row['y'],
                    'largura' => $row['largura'],
                    'altura' => $row['altura'],
                    'rotacao' => $row['rotacao'],
                    'z_index' => $row['z_index'],
                    'trancada' => $row['trancada'] == 1
                ];
            }
            
            $endpoint->sendData([
                "success" => true,
                "imagens" => $imagens
            ]);
            break;

        case 'salvarImagem':
            $id_mapa = $dados['id_mapa'] ?? 1;
            $url = $dados['url'] ?? '';
            $x = $dados['x'] ?? 0;
            $y = $dados['y'] ?? 0;
            $largura = $dados['largura'] ?? 300;
            $altura = $dados['altura'] ?? 300;
            $rotacao = $dados['rotacao'] ?? 0;
            $z_index = $dados['z_index'] ?? 0;
            $trancada = $dados['trancada'] ?? 0;
            
            $sql = "INSERT INTO mapa_imagens (id_mapa, url, x, y, largura, altura, rotacao, z_index, trancada, criado_em) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            $stmt = $conexao->prepare($sql);
            $stmt->bind_param("isiiiiii", $id_mapa, $url, $x, $y, $largura, $altura, $rotacao, $z_index, $trancada);
            
            if ($stmt->execute()) {
                $endpoint->sendData([
                    "success" => true,
                    "id" => $conexao->insert_id,
                    "message" => "Imagem salva com sucesso"
                ]);
            } else {
                $endpoint->sendData([
                    "success" => false,
                    "error" => "Erro ao salvar imagem"
                ]);
            }
            break;

        case 'carregarDesenhos':
            $id_mapa = $dados['id_mapa'] ?? 1;
            
            $sql = "SELECT * FROM mapa_desenhos WHERE id_mapa = ? ORDER BY criado_em";
            $stmt = $conexao->prepare($sql);
            $stmt->bind_param("i", $id_mapa);
            $stmt->execute();
            $resultado = $stmt->get_result();
            
            $desenhos = [];
            while ($row = $resultado->fetch_assoc()) {
                $desenhos[] = [
                    'id' => $row['id'],
                    'pontos' => $row['pontos'],
                    'cor' => $row['cor'],
                    'espessura' => $row['espessura'],
                    'tipo' => $row['tipo']
                ];
            }
            
            $endpoint->sendData([
                "success" => true,
                "desenhos" => $desenhos
            ]);
            break;

        case 'salvarDesenho':
            $id_mapa = $dados['id_mapa'] ?? 1;
            $pontos = $dados['pontos'] ?? '';
            $cor = $dados['cor'] ?? '#000000';
            $espessura = $dados['espessura'] ?? 2;
            $tipo = $dados['tipo'] ?? 'linha';
            
            $sql = "INSERT INTO mapa_desenhos (id_mapa, pontos, cor, espessura, tipo, criado_em) VALUES (?, ?, ?, ?, ?, NOW())";
            $stmt = $conexao->prepare($sql);
            $stmt->bind_param("issis", $id_mapa, $pontos, $cor, $espessura, $tipo);
            
            if ($stmt->execute()) {
                $endpoint->sendData([
                    "success" => true,
                    "id" => $conexao->insert_id,
                    "message" => "Desenho salvo com sucesso"
                ]);
            } else {
                $endpoint->sendData([
                    "success" => false,
                    "error" => "Erro ao salvar desenho"
                ]);
            }
            break;

        case 'carregarMapas':
            $sql = "SELECT id, nome, largura, altura, criado_em FROM mapas WHERE id_perfil = ? ORDER BY criado_em DESC";
            $stmt = $conexao->prepare($sql);
            $stmt->bind_param("i", $id_perfil);
            $stmt->execute();
            $resultado = $stmt->get_result();
            
            $mapas = [];
            while ($row = $resultado->fetch_assoc()) {
                $mapas[] = [
                    'id' => $row['id'],
                    'nome' => $row['nome'],
                    'largura' => $row['largura'],
                    'altura' => $row['altura'],
                    'criado_em' => $row['criado_em']
                ];
            }
            
            $endpoint->sendData([
                "success" => true,
                "mapas" => $mapas
            ]);
            break;

        default:
            $endpoint->sendData([
                "success" => false,
                "error" => "Ação inválida"
            ]);
    }

} catch (Exception $e) {
    error_log("Erro no map-seguro: " . $e->getMessage());
    $endpoint->sendData([
        "success" => false,
        "error" => "Erro interno do servidor"
    ]);
}
