<?php
session_start();
require_once 'CriptografiaHibrida.php';

header('Content-Type: application/json');

// Inicializa sistema de criptografia
if (!isset($_SESSION['crypto'])) {
    $_SESSION['crypto'] = new CriptografiaHibrida();
}

$crypto = $_SESSION['crypto'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'getServerKey':
        // Retorna chave pública do servidor
        echo json_encode([
            'success' => true,
            'publicKey' => $crypto->getChavePublica()
        ]);
        break;

    case 'setClientKey':
        // Recebe e armazena chave pública do cliente
        $clientId = session_id();
        $clientKey = $_POST['publicKey'] ?? '';
        
        if (!$clientKey) {
            echo json_encode(['success' => false, 'error' => 'Chave não fornecida']);
            exit;
        }

        try {
            $crypto->armazenarChaveCliente($clientId, $clientKey);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Ação inválida']);
}