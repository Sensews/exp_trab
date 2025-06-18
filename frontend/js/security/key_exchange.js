/**
 * OBLIVION RPG - KEY EXCHANGE
 * Gerenciador de Troca de Chaves
 * 
 * Funcionalidades:
 * - Handshake inicial de chaves
 * - Protocolo de estabelecimento seguro
 * - Renovação automática de chaves
 * - Detecção de ataques man-in-the-middle
 * 
 * @version 1.0
 * @author Oblivion Security Team
 */

class KeyExchange {
    // Configurações
    static HANDSHAKE_TIMEOUT = 10000; // 10 segundos
    static MAX_RETRY_ATTEMPTS = 3;
    static KEY_ROTATION_INTERVAL = 3600000; // 1 hora em ms
    
    // Estado interno
    static handshakeInProgress = false;
    static lastHandshakeTime = 0;
    static rotationTimer = null;
    static retryAttempts = 0;
    
    // Eventos personalizados
    static events = {
        handshakeStart: 'keyexchange:handshake:start',
        handshakeSuccess: 'keyexchange:handshake:success', 
        handshakeError: 'keyexchange:handshake:error',
        keyRotation: 'keyexchange:key:rotation',
        securityAlert: 'keyexchange:security:alert'
    };
    
    /**
     * Inicializa o gerenciador de troca de chaves
     * @param {Object} options - Opções de configuração
     */
    static initialize(options = {}) {
        const config = {
            autoRotation: true,
            securityChecks: true,
            ...options
        };
        
        // Configura rotação automática
        if (config.autoRotation) {
            this.startAutoRotation();
        }
        
        // Configura verificações de segurança
        if (config.securityChecks) {
            this.enableSecurityChecks();
        }
        
        console.log('KeyExchange inicializado');
    }
    
    /**
     * Executa handshake com retry automático
     * @param {Object} options - Opções do handshake
     * @returns {Promise<boolean>} - True se bem-sucedido
     */
    static async performSecureHandshake(options = {}) {
        if (this.handshakeInProgress) {
            console.warn('Handshake já em progresso');
            return false;
        }
        
        this.handshakeInProgress = true;
        this.retryAttempts = 0;
        
        this.dispatchEvent(this.events.handshakeStart);
        
        try {
            const result = await this.attemptHandshakeWithRetry(options);
            
            if (result) {
                this.lastHandshakeTime = Date.now();
                this.dispatchEvent(this.events.handshakeSuccess);
                console.log('Handshake seguro concluído com sucesso');
            } else {
                this.dispatchEvent(this.events.handshakeError, { 
                    reason: 'Falha após múltiplas tentativas' 
                });
            }
            
            return result;
            
        } finally {
            this.handshakeInProgress = false;
        }
    }
    
    /**
     * Tenta handshake com retry automático
     * @param {Object} options - Opções do handshake
     * @returns {Promise<boolean>} - True se bem-sucedido
     */
    static async attemptHandshakeWithRetry(options) {
        const maxAttempts = options.maxRetries || this.MAX_RETRY_ATTEMPTS;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`Tentativa de handshake ${attempt}/${maxAttempts}`);
                
                const success = await this.performSingleHandshake(options);
                if (success) {
                    this.retryAttempts = 0;
                    return true;
                }
                
            } catch (error) {
                console.error(`Erro na tentativa ${attempt}:`, error);
                
                // Verifica se é um erro de segurança crítico
                if (this.isCriticalSecurityError(error)) {
                    this.dispatchEvent(this.events.securityAlert, {
                        type: 'critical_handshake_error',
                        error: error.message,
                        attempt: attempt
                    });
                    break;
                }
            }
            
            // Aguarda antes da próxima tentativa (backoff exponencial)
            if (attempt < maxAttempts) {
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
                console.log(`Aguardando ${delay}ms antes da próxima tentativa`);
                await this.sleep(delay);
            }
        }
        
        this.retryAttempts = maxAttempts;
        return false;
    }
    
    /**
     * Executa um handshake individual
     * @param {Object} options - Opções do handshake
     * @returns {Promise<boolean>} - True se bem-sucedido
     */
    static async performSingleHandshake(options) {
        const timeout = options.timeout || this.HANDSHAKE_TIMEOUT;
        
        return await Promise.race([
            this.executeHandshakeSteps(options),
            this.createTimeoutPromise(timeout)
        ]);
    }
    
    /**
     * Executa as etapas do handshake
     * @param {Object} options - Opções do handshake
     * @returns {Promise<boolean>} - True se bem-sucedido
     */
    static async executeHandshakeSteps(options) {
        // Etapa 1: Verificar se CryptoClient está disponível
        if (!window.CryptoClient) {
            throw new Error('CryptoClient não disponível');
        }
        
        // Etapa 2: Limpar estado anterior se necessário
        if (options.forceReset) {
            CryptoClient.cleanup();
        }
        
        // Etapa 3: Executar handshake do CryptoClient
        const handshakeStart = performance.now();
        const success = await CryptoClient.performHandshake();
        const handshakeDuration = performance.now() - handshakeStart;
        
        // Etapa 4: Validar resultado
        if (!success) {
            throw new Error('Handshake do CryptoClient falhou');
        }
        
        // Etapa 5: Verificar integridade
        const verificationResult = await this.verifyHandshakeIntegrity();
        if (!verificationResult.valid) {
            throw new Error('Falha na verificação de integridade: ' + verificationResult.reason);
        }
        
        // Etapa 6: Log de sucesso
        console.log(`Handshake concluído em ${handshakeDuration.toFixed(2)}ms`);
        
        return true;
    }
    
    /**
     * Verifica integridade do handshake
     * @returns {Promise<Object>} - Resultado da verificação
     */
    static async verifyHandshakeIntegrity() {
        try {
            // Testa criptografia/descriptografia
            const testData = {
                test: 'integrity_check',
                timestamp: Date.now(),
                random: Math.random()
            };
            
            const encrypted = await CryptoClient.encryptData(testData);
            const decrypted = await CryptoClient.decryptData(encrypted);
            
            // Verifica se dados são idênticos
            if (JSON.stringify(testData) !== JSON.stringify(decrypted)) {
                return {
                    valid: false,
                    reason: 'Dados de teste não coincidem após criptografia/descriptografia'
                };
            }
            
            // Verifica se cliente está pronto
            if (!CryptoClient.isReady()) {
                return {
                    valid: false,
                    reason: 'CryptoClient não está em estado pronto'
                };
            }
            
            return { valid: true };
            
        } catch (error) {
            return {
                valid: false,
                reason: 'Erro durante verificação: ' + error.message
            };
        }
    }
    
    /**
     * Inicia rotação automática de chaves
     */
    static startAutoRotation() {
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
        }
        
        this.rotationTimer = setInterval(() => {
            this.performKeyRotation();
        }, this.KEY_ROTATION_INTERVAL);
        
        console.log('Rotação automática de chaves iniciada');
    }
    
    /**
     * Para rotação automática de chaves
     */
    static stopAutoRotation() {
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
            this.rotationTimer = null;
            console.log('Rotação automática de chaves parada');
        }
    }
    
    /**
     * Executa rotação de chaves
     * @returns {Promise<boolean>} - True se bem-sucedida
     */
    static async performKeyRotation() {
        try {
            console.log('Iniciando rotação de chaves...');
            
            this.dispatchEvent(this.events.keyRotation, { phase: 'start' });
            
            // Força novo handshake
            const success = await this.performSecureHandshake({ forceReset: true });
            
            if (success) {
                this.dispatchEvent(this.events.keyRotation, { phase: 'success' });
                console.log('Rotação de chaves concluída com sucesso');
            } else {
                this.dispatchEvent(this.events.keyRotation, { phase: 'error' });
                console.error('Falha na rotação de chaves');
            }
            
            return success;
            
        } catch (error) {
            console.error('Erro durante rotação de chaves:', error);
            this.dispatchEvent(this.events.keyRotation, { 
                phase: 'error', 
                error: error.message 
            });
            return false;
        }
    }
    
    /**
     * Habilita verificações de segurança
     */
    static enableSecurityChecks() {
        // Monitora tentativas de acesso suspeitas
        this.monitorSuspiciousActivity();
        
        // Verifica integridade periodicamente
        setInterval(() => {
            this.performSecurityCheck();
        }, 60000); // A cada minuto
        
        console.log('Verificações de segurança habilitadas');
    }
    
    /**
     * Monitora atividade suspeita
     */
    static monitorSuspiciousActivity() {
        // Monitora erros consecutivos
        let consecutiveErrors = 0;
        
        document.addEventListener(this.events.handshakeError, () => {
            consecutiveErrors++;
            
            if (consecutiveErrors >= 3) {
                this.dispatchEvent(this.events.securityAlert, {
                    type: 'multiple_handshake_failures',
                    count: consecutiveErrors
                });
            }
        });
        
        document.addEventListener(this.events.handshakeSuccess, () => {
            consecutiveErrors = 0;
        });
    }
    
    /**
     * Executa verificação de segurança
     */
    static async performSecurityCheck() {
        try {
            // Verifica se cliente ainda está funcional
            if (CryptoClient.isReady()) {
                const verification = await this.verifyHandshakeIntegrity();
                
                if (!verification.valid) {
                    console.warn('Verificação de integridade falhou:', verification.reason);
                    
                    // Tenta recuperar com novo handshake
                    await this.performSecureHandshake({ forceReset: true });
                }
            }
            
        } catch (error) {
            console.error('Erro na verificação de segurança:', error);
        }
    }
    
    /**
     * Verifica se é um erro de segurança crítico
     * @param {Error} error - Erro a ser verificado
     * @returns {boolean} - True se crítico
     */
    static isCriticalSecurityError(error) {
        const criticalPatterns = [
            'certificado',
            'certificate',
            'man-in-the-middle',
            'mitm',
            'tamper',
            'modificado',
            'integrity'
        ];
        
        const errorMessage = error.message.toLowerCase();
        return criticalPatterns.some(pattern => errorMessage.includes(pattern));
    }
    
    /**
     * Cria promise de timeout
     * @param {number} ms - Timeout em milissegundos
     * @returns {Promise} - Promise que rejeita após timeout
     */
    static createTimeoutPromise(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Timeout de ${ms}ms excedido`));
            }, ms);
        });
    }
    
    /**
     * Função de sleep
     * @param {number} ms - Tempo em milissegundos
     * @returns {Promise} - Promise que resolve após o tempo
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Dispara evento customizado
     * @param {string} eventName - Nome do evento
     * @param {*} detail - Dados do evento
     */
    static dispatchEvent(eventName, detail = null) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
    
    /**
     * Registra listener para eventos
     * @param {string} eventName - Nome do evento
     * @param {Function} callback - Função callback
     */
    static addEventListener(eventName, callback) {
        document.addEventListener(eventName, callback);
    }
    
    /**
     * Remove listener de eventos
     * @param {string} eventName - Nome do evento
     * @param {Function} callback - Função callback
     */
    static removeEventListener(eventName, callback) {
        document.removeEventListener(eventName, callback);
    }
    
    /**
     * Obtém estatísticas de performance
     * @returns {Object} - Estatísticas
     */
    static getPerformanceStats() {
        return {
            lastHandshakeTime: this.lastHandshakeTime,
            handshakeInProgress: this.handshakeInProgress,
            retryAttempts: this.retryAttempts,
            autoRotationActive: !!this.rotationTimer,
            timeSinceLastHandshake: Date.now() - this.lastHandshakeTime
        };
    }
    
    /**
     * Força verificação de segurança imediata
     * @returns {Promise<Object>} - Resultado da verificação
     */
    static async forceSecurityCheck() {
        console.log('Executando verificação de segurança forçada...');
        
        const checks = {
            clientReady: CryptoClient.isReady(),
            integrity: await this.verifyHandshakeIntegrity(),
            timestamp: Date.now()
        };
        
        return {
            passed: checks.clientReady && checks.integrity.valid,
            details: checks
        };
    }
    
    /**
     * Limpa recursos e para timers
     */
    static cleanup() {
        this.stopAutoRotation();
        this.handshakeInProgress = false;
        this.retryAttempts = 0;
        console.log('KeyExchange limpo');
    }
}

// Exporta para uso global
window.KeyExchange = KeyExchange;
