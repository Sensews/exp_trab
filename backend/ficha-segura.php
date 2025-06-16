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
            "success" => false,
            "error" => "Usuário não autenticado"
        ]);
        exit;
    }

    // Prepara dados da ficha
    $nome = $dados['name'] ?? '';
    $classe = $dados['class'] ?? '';
    $raca = $dados['race'] ?? '';
    $nivel = $dados['level'] ?? 1;
    $background = $dados['background'] ?? '';
    $experiencia = $dados['experience'] ?? 0;
    
    // Atributos
    $forca = $dados['strength'] ?? 10;
    $destreza = $dados['dexterity'] ?? 10;
    $constituicao = $dados['constitution'] ?? 10;
    $inteligencia = $dados['intelligence'] ?? 10;
    $sabedoria = $dados['wisdom'] ?? 10;
    $carisma = $dados['charisma'] ?? 10;
    
    // Outros dados
    $pontos_vida = $dados['hitPoints'] ?? 0;
    $pontos_vida_max = $dados['maxHitPoints'] ?? 0;
    $classe_armadura = $dados['armorClass'] ?? 10;
    $velocidade = $dados['speed'] ?? 30;
    $bonus_proficiencia = $dados['proficiencyBonus'] ?? 2;
    
    // Perícias e salvaguardas
    $pericias = json_encode($dados['skills'] ?? []);
    $salvaguardas = json_encode($dados['savingThrows'] ?? []);
    
    // Equipamentos e magias
    $equipamentos = json_encode($dados['equipment'] ?? []);
    $magias = json_encode($dados['spells'] ?? []);
    
    // Traços e características
    $tracos = json_encode($dados['traits'] ?? []);
    $ideais = json_encode($dados['ideals'] ?? []);
    $vinculos = json_encode($dados['bonds'] ?? []);
    $defeitos = json_encode($dados['flaws'] ?? []);
    
    // História do personagem
    $historia = $dados['backstory'] ?? '';
    $anotacoes = $dados['notes'] ?? '';

    // Insere a ficha no banco de dados
    $sql = "INSERT INTO fichas (
        id_perfil, nome, classe, raca, nivel, background, experiencia,
        forca, destreza, constituicao, inteligencia, sabedoria, carisma,
        pontos_vida, pontos_vida_max, classe_armadura, velocidade, bonus_proficiencia,
        pericias, salvaguardas, equipamentos, magias, tracos, ideais, vinculos, defeitos,
        historia, anotacoes, criado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

    $stmt = $conexao->prepare($sql);
    $stmt->bind_param(
        "isssisiiiiiiiiiissssssssss",
        $id_perfil, $nome, $classe, $raca, $nivel, $background, $experiencia,
        $forca, $destreza, $constituicao, $inteligencia, $sabedoria, $carisma,
        $pontos_vida, $pontos_vida_max, $classe_armadura, $velocidade, $bonus_proficiencia,
        $pericias, $salvaguardas, $equipamentos, $magias, $tracos, $ideais, $vinculos, $defeitos,
        $historia, $anotacoes
    );

    if ($stmt->execute()) {
        $ficha_id = $conexao->insert_id;
        
        $endpoint->sendData([
            "success" => true,
            "message" => "Ficha salva com sucesso!",
            "ficha_id" => $ficha_id
        ]);
    } else {
        $endpoint->sendData([
            "success" => false,
            "error" => "Erro ao salvar ficha: " . $stmt->error
        ]);
    }

} catch (Exception $e) {
    error_log("Erro no ficha-segura: " . $e->getMessage());
    $endpoint->sendData([
        "success" => false,
        "error" => "Erro interno do servidor"
    ]);
}
