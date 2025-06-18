/**
 * OBLIVION RPG - CRYPTO INIT
 * Inicializador Unificado do Sistema de Criptografia
 * 
 * Este arquivo deve ser incluído em todas as páginas que precisam de criptografia
 * 
 * @version 1.0
 * @author Oblivion Security Team
 */

class CryptoInit {
    static initialized = false;
    static initPromise = null;
    
    /**
     * Inicializa todo o sistema de criptografia
     * @param {Object} options - Opções de configuração personalizadas
     * @returns {Promise<boolean>} - True se inicializado com sucesso
     */
    static async initialize(options = {}) {
        // Evita múltiplas inicializações simultâneas
        if (this.initPromise) {
            return this.initPromise;
        }
        
        if (this.initialized) {
            return true;
        }
        
        this.initPromise = this.performInitialization(options);
        return this.initPromise;
    }
    
    /**
     * Executa a inicialização completa
     * @param {Object} options - Opções de configuração
     * @returns {Promise<boolean>} - True se bem-sucedido
     */
    static async performInitialization(options) {
        try {
            console.log('🔐 Iniciando sistema de criptografia Oblivion...');
            
            // Verifica dependências
            if (!this.checkDependencies()) {
                throw new Error('Dependências de criptografia não encontradas');
            }
            
            // Carrega configurações
            const config = this.loadConfiguration(options);
            
            // Inicializa componentes na ordem correta
            await this.initializeComponents(config);
            
            // Configura listeners de eventos
            this.setupEventListeners();
            
            // Configura limpeza automática
            this.setupCleanup();
            
            this.initialized = true;
            console.log('✅ Sistema de criptografia inicializado com sucesso');
            
            // Dispara evento de inicialização
            this.dispatchEvent('crypto:initialized', { config });
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao inicializar criptografia:', error);
            this.dispatchEvent('crypto:init:error', { error });
            return false;
        } finally {
            this.initPromise = null;
        }
    }
    
    /**
     * Verifica se todas as dependências estão disponíveis
     * @returns {boolean} - True se todas as dependências estão OK
     */
    static checkDependencies() {
        const required = [
            'window.crypto',
            'window.crypto.subtle',
            'window.CryptoClient',
            'window.KeyExchange',
            'window.SecureRequest',
            'window.CryptoConfig'
        ];
        
        const missing = [];
        
        for (const dep of required) {
            if (!this.checkNestedProperty(window, dep.replace('window.', ''))) {
                missing.push(dep);
            }
        }
        
        if (missing.length > 0) {
            console.error('Dependências de criptografia não encontradas:', missing);
            return false;
        }
        
        return true;
    }
    
    /**
     * Verifica propriedade aninhada
     * @param {Object} obj - Objeto base
     * @param {string} path - Caminho da propriedade (ex: 'crypto.subtle')
     * @returns {boolean} - True se existe
     */
    static checkNestedProperty(obj, path) {
        return path.split('.').reduce((current, prop) => {
            return current && current[prop];
        }, obj);
    }
    
    /**
     * Carrega configuração mesclando padrões com opções personalizadas
     * @param {Object} options - Opções personalizadas
     * @returns {Object} - Configuração final
     */
    static loadConfiguration(options) {
        const defaultConfig = CryptoConfig.getFullConfig();
        
        // Mescla configurações
        const config = this.deepMerge(defaultConfig, options);
        
        if (config.debug) {
            console.log('📋 Configuração de criptografia:', config);
        }
        
        return config;
    }
    
    /**
     * Inicializa todos os componentes
     * @param {Object} config - Configuração completa
     */
    static async initializeComponents(config) {
        console.log('🔧 Inicializando componentes...');
        
        // 1. Inicializa CryptoClient
        console.log('  📱 Inicializando CryptoClient...');
        const cryptoSuccess = await CryptoClient.initialize(config.cryptoClient);
        if (!cryptoSuccess) {
            throw new Error('Falha ao inicializar CryptoClient');
        }
        
        // 2. Inicializa KeyExchange
        console.log('  🔑 Inicializando KeyExchange...');
        KeyExchange.initialize(config.keyExchange);
        
        // 3. Inicializa SecureRequest
        console.log('  🌐 Inicializando SecureRequest...');
        SecureRequest.initialize(config.secureRequest);
        
        console.log('✅ Todos os componentes inicializados');
    }
    
    /**
     * Configura listeners de eventos do sistema
     */
    static setupEventListeners() {
        // Listener para sucesso de handshake
        KeyExchange.addEventListener(KeyExchange.events.handshakeSuccess, (event) => {
            console.log('🤝 Handshake bem-sucedido');
            this.dispatchEvent('crypto:handshake:success', event.detail);
        });
        
        // Listener para erro de handshake
        KeyExchange.addEventListener(KeyExchange.events.handshakeError, (event) => {
            console.warn('⚠️  Erro no handshake:', event.detail);
            this.dispatchEvent('crypto:handshake:error', event.detail);
        });
        
        // Listener para rotação de chaves
        KeyExchange.addEventListener(KeyExchange.events.keyRotation, (event) => {
            console.log('🔄 Rotação de chaves:', event.detail.phase);
            this.dispatchEvent('crypto:key:rotation', event.detail);
        });
        
        // Listener para alertas de segurança
        KeyExchange.addEventListener(KeyExchange.events.securityAlert, (event) => {
            console.error('🚨 Alerta de segurança:', event.detail);
            this.dispatchEvent('crypto:security:alert', event.detail);
        });
        
        // Listener para erros de página
        window.addEventListener('error', (event) => {
            if (event.message && event.message.includes('crypto')) {
                console.error('💥 Erro relacionado à criptografia:', event);
                this.dispatchEvent('crypto:error', { 
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno
                });
            }
        });
        
        // Listener para antes de sair da página
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }
    
    /**
     * Configura limpeza automática
     */
    static setupCleanup() {
        // Registra função de limpeza
        if (typeof window.addEventListener === 'function') {
            window.addEventListener('beforeunload', () => {
                this.cleanup();
            });
        }
    }
    
    /**
     * Executa diagnóstico completo do sistema
     * @returns {Promise<Object>} - Resultado do diagnóstico
     */
    static async diagnose() {
        console.log('🔍 Executando diagnóstico de criptografia...');
        
        const diagnosis = {
            timestamp: new Date().toISOString(),
            initialized: this.initialized,
            dependencies: {},
            components: {},
            security: {},
            performance: {}
        };
        
        try {
            // Verifica dependências
            diagnosis.dependencies = {
                webCrypto: !!window.crypto && !!window.crypto.subtle,
                cryptoClient: !!window.CryptoClient,
                keyExchange: !!window.KeyExchange,
                secureRequest: !!window.SecureRequest,
                cryptoConfig: !!window.CryptoConfig
            };
            
            // Verifica componentes
            if (window.CryptoClient) {
                diagnosis.components.cryptoClient = CryptoClient.getStatus();
            }
            
            if (window.KeyExchange) {
                diagnosis.components.keyExchange = KeyExchange.getPerformanceStats();
            }
            
            if (window.SecureRequest) {
                diagnosis.components.secureRequest = SecureRequest.getQueueStats();
            }
            
            // Testa segurança
            if (window.KeyExchange && this.initialized) {
                diagnosis.security = await KeyExchange.forceSecurityCheck();
            }
            
            // Medidas de performance
            const perfStart = performance.now();
            if (window.CryptoClient && CryptoClient.isReady()) {
                const testData = { test: 'diagnostic', timestamp: Date.now() };
                await CryptoClient.encryptData(testData);
            }
            const perfEnd = performance.now();
            
            diagnosis.performance = {
                encryptionTime: perfEnd - perfStart,
                memoryUsage: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                } : null
            };
            
        } catch (error) {
            diagnosis.error = error.message;
            console.error('Erro durante diagnóstico:', error);
        }
        
        console.log('📊 Diagnóstico completo:', diagnosis);
        return diagnosis;
    }
    
    /**
     * Força reinicialização completa
     * @returns {Promise<boolean>} - True se bem-sucedido
     */
    static async reinitialize() {
        console.log('🔄 Reinicializando sistema de criptografia...');
        
        try {
            // Limpa estado atual
            this.cleanup();
            
            // Aguarda um pouco para garantir limpeza
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Reinicializa
            return await this.initialize();
            
        } catch (error) {
            console.error('Erro na reinicialização:', error);
            return false;
        }
    }
    
    /**
     * Verifica se sistema está pronto para uso
     * @returns {boolean} - True se pronto
     */
    static isReady() {
        return this.initialized && 
               window.CryptoClient && 
               CryptoClient.isReady();
    }
    
    /**
     * Obtém status completo do sistema
     * @returns {Object} - Status atual
     */
    static getSystemStatus() {
        return {
            initialized: this.initialized,
            ready: this.isReady(),
            components: {
                cryptoClient: window.CryptoClient ? CryptoClient.getStatus() : null,
                keyExchange: window.KeyExchange ? KeyExchange.getPerformanceStats() : null,
                secureRequest: window.SecureRequest ? SecureRequest.getQueueStats() : null
            },
            timestamp: Date.now()
        };
    }
    
    /**
     * Mescla objetos profundamente
     * @param {Object} target - Objeto destino
     * @param {Object} source - Objeto fonte
     * @returns {Object} - Objeto mesclado
     */
    static deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
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
     * Limpa recursos e estado
     */
    static cleanup() {
        try {
            if (window.CryptoClient) {
                CryptoClient.cleanup();
            }
            
            if (window.KeyExchange) {
                KeyExchange.cleanup();
            }
            
            if (window.SecureRequest) {
                SecureRequest.restore();
            }
            
            this.initialized = false;
            this.initPromise = null;
            
            console.log('🧹 Sistema de criptografia limpo');
            
        } catch (error) {
            console.error('Erro durante limpeza:', error);
        }
    }
}

// Exporta para uso global
window.CryptoInit = CryptoInit;

// Auto-inicialização se configurado
if (typeof window !== 'undefined' && window.CryptoConfig && window.CryptoConfig.AUTO_INIT) {
    document.addEventListener('DOMContentLoaded', () => {
        CryptoInit.initialize().catch(console.error);
    });
}
