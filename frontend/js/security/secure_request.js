/**
 * OBLIVION RPG - SECURE REQUEST
 * Interceptador de Requisições para Criptografia Automática
 * 
 * Funcionalidades:
 * - Interceptação de fetch() e XMLHttpRequest
 * - Criptografia automática de FormData
 * - Descriptografia transparente de respostas
 * - Queue de requisições durante key exchange
 * 
 * @version 1.0
 * @author Oblivion Security Team
 */

class SecureRequest {
    // Configurações
    static AUTO_ENCRYPT_ENABLED = true;
    static QUEUE_ENABLED = true;
    static MAX_QUEUE_SIZE = 50;
    static QUEUE_TIMEOUT = 30000; // 30 segundos
    
    // Estado interno
    static initialized = false;
    static requestQueue = [];
    static queueProcessing = false;
    static originalFetch = null;
    static originalXHROpen = null;
    static originalXHRSend = null;
    
    // URLs que devem ser criptografadas
    static encryptionPatterns = [
        /\/backend\/.*\.php$/,
        /login\.php$/,
        /cadastro\.php$/,
        /perfil\.php$/,
        /chat_party\.php$/,
        /anotacoes\.php$/,
        /ficha\.php$/,
        /teste_post\.php$/
    ];
    
    // URLs que devem ser ignoradas
    static ignoredPatterns = [
        /verificar_sessao\.php$/,
        /logout\.php$/,
        /\.(css|js|png|jpg|jpeg|gif|svg|ico)$/,
        /crypto_action=/
    ];
    
    /**
     * Inicializa o interceptador de requisições
     * @param {Object} options - Opções de configuração
     */
    static initialize(options = {}) {
        if (this.initialized) {
            console.warn('SecureRequest já inicializado');
            return;
        }
        
        const config = {
            autoEncrypt: true,
            enableQueue: true,
            interceptFetch: true,
            interceptXHR: true,
            ...options
        };
        
        // Configura padrões personalizados se fornecidos
        if (config.encryptionPatterns) {
            this.encryptionPatterns = config.encryptionPatterns;
        }
        
        if (config.ignoredPatterns) {
            this.ignoredPatterns = config.ignoredPatterns;
        }
        
        // Intercepta fetch se habilitado
        if (config.interceptFetch) {
            this.interceptFetch();
        }
        
        // Intercepta XMLHttpRequest se habilitado
        if (config.interceptXHR) {
            this.interceptXMLHttpRequest();
        }
        
        // Configura processamento de queue
        if (config.enableQueue) {
            this.startQueueProcessor();
        }
        
        this.AUTO_ENCRYPT_ENABLED = config.autoEncrypt;
        this.initialized = true;
        
        console.log('SecureRequest inicializado com sucesso');
    }
    
    /**
     * Intercepta a função fetch nativa
     */
    static interceptFetch() {
        if (this.originalFetch) {
            return; // Já interceptado
        }
        
        this.originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            try {
                return await this.processSecureFetch(url, options);
            } catch (error) {
                console.error('Erro no fetch seguro:', error);
                // Fallback para fetch original
                return this.originalFetch(url, options);
            }
        };
        
        console.log('Fetch interceptado com sucesso');
    }
    
    /**
     * Intercepta XMLHttpRequest
     */
    static interceptXMLHttpRequest() {
        if (this.originalXHROpen) {
            return; // Já interceptado
        }
        
        const self = this;
        
        this.originalXHROpen = XMLHttpRequest.prototype.open;
        this.originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._secureRequest = {
                method: method,
                url: url,
                shouldEncrypt: self.shouldEncryptUrl(url)
            };
            
            return self.originalXHROpen.call(this, method, url, ...args);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            if (this._secureRequest && this._secureRequest.shouldEncrypt && data) {
                // Processa dados para criptografia
                this._secureRequest.originalData = data;
                
                // Se CryptoClient não está pronto, adiciona à queue
                if (!window.CryptoClient || !CryptoClient.isReady()) {
                    console.log('Adicionando XHR à queue (CryptoClient não pronto)');
                    self.addToQueue({
                        type: 'xhr',
                        xhr: this,
                        data: data
                    });
                    return;
                }
                
                // Processa criptografia
                self.processXHREncryption(this, data);
                return;
            }
            
            return self.originalXHRSend.call(this, data);
        };
        
        console.log('XMLHttpRequest interceptado com sucesso');
    }
    
    /**
     * Processa fetch com criptografia
     * @param {string} url - URL da requisição
     * @param {Object} options - Opções do fetch
     * @returns {Promise<Response>} - Resposta processada
     */
    static async processSecureFetch(url, options) {
        // Verifica se deve criptografar
        if (!this.shouldEncryptUrl(url)) {
            return this.originalFetch(url, options);
        }
        
        // Verifica se CryptoClient está pronto
        if (!window.CryptoClient || !CryptoClient.isReady()) {
            if (this.QUEUE_ENABLED) {
                console.log('Adicionando fetch à queue (CryptoClient não pronto)');
                return this.queueRequest('fetch', url, options);
            } else {
                console.warn('CryptoClient não pronto, enviando requisição sem criptografia');
                return this.originalFetch(url, options);
            }
        }
        
        try {
            // Processa criptografia dos dados
            const processedOptions = await this.processRequestOptions(options);
            
            // Envia requisição
            const response = await this.originalFetch(url, processedOptions);
            
            // Processa resposta
            return await this.processResponse(response);
            
        } catch (error) {
            console.error('Erro no processamento seguro:', error);
            
            // Tenta fallback sem criptografia se configurado
            if (options.allowFallback !== false) {
                console.warn('Tentando fallback sem criptografia');
                return this.originalFetch(url, options);
            }
            
            throw error;
        }
    }
    
    /**
     * Processa opções da requisição para criptografia
     * @param {Object} options - Opções originais
     * @returns {Promise<Object>} - Opções processadas
     */
    static async processRequestOptions(options) {
        const processedOptions = { ...options };
        
        // Processa body se existir
        if (options.body) {
            processedOptions.body = await this.processRequestBody(options.body);
            
            // Ajusta headers se necessário
            if (!processedOptions.headers) {
                processedOptions.headers = {};
            }
            
            // Define Content-Type se não especificado
            if (!(processedOptions.body instanceof FormData) && 
                !processedOptions.headers['Content-Type']) {
                processedOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            }
        }
        
        return processedOptions;
    }
    
    /**
     * Processa body da requisição para criptografia
     * @param {*} body - Body original
     * @returns {Promise<*>} - Body processado
     */
    static async processRequestBody(body) {
        try {
            let dataToEncrypt;
            
            // Converte diferentes tipos de body para objeto
            if (body instanceof FormData) {
                dataToEncrypt = this.formDataToObject(body);
            } else if (typeof body === 'string') {
                // Tenta fazer parse se for JSON ou URLSearchParams
                try {
                    dataToEncrypt = JSON.parse(body);
                } catch {
                    // Se não for JSON, trata como URLSearchParams
                    const params = new URLSearchParams(body);
                    dataToEncrypt = Object.fromEntries(params);
                }
            } else if (body instanceof URLSearchParams) {
                dataToEncrypt = Object.fromEntries(body);
            } else {
                dataToEncrypt = body;
            }
            
            // Criptografa dados
            const encryptedData = await CryptoClient.prepareEncryptedData(dataToEncrypt);
            
            // Retorna como URLSearchParams para compatibilidade
            return new URLSearchParams(encryptedData);
            
        } catch (error) {
            console.error('Erro ao processar body:', error);
            return body; // Retorna original em caso de erro
        }
    }
    
    /**
     * Converte FormData para objeto
     * @param {FormData} formData - FormData a ser convertido
     * @returns {Object} - Objeto com dados do FormData
     */
    static formDataToObject(formData) {
        const obj = {};
        for (const [key, value] of formData.entries()) {
            if (obj[key]) {
                // Se já existe, converte para array
                if (Array.isArray(obj[key])) {
                    obj[key].push(value);
                } else {
                    obj[key] = [obj[key], value];
                }
            } else {
                obj[key] = value;
            }
        }
        return obj;
    }
    
    /**
     * Processa resposta para descriptografia
     * @param {Response} response - Resposta original
     * @returns {Promise<Response>} - Resposta processada
     */
    static async processResponse(response) {
        try {
            // Verifica se é JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return response; // Não processa se não for JSON
            }
            
            // Clona resposta para não consumir o stream original
            const responseClone = response.clone();
            const responseData = await responseClone.json();
            
            // Verifica se resposta está criptografada
            if (responseData.encrypted_response) {
                const decryptedData = await CryptoClient.decryptData(responseData.encrypted_response);
                
                // Cria nova resposta com dados descriptografados
                return new Response(JSON.stringify(decryptedData), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });
            }
            
            return response;
            
        } catch (error) {
            console.error('Erro ao processar resposta:', error);
            return response; // Retorna original em caso de erro
        }
    }
    
    /**
     * Processa criptografia para XMLHttpRequest
     * @param {XMLHttpRequest} xhr - Objeto XHR
     * @param {*} data - Dados a serem enviados
     */
    static async processXHREncryption(xhr, data) {
        try {
            const processedData = await this.processRequestBody(data);
            
            // Configura listener para processar resposta
            const originalReadyStateChange = xhr.onreadystatechange;
            xhr.onreadystatechange = async function() {
                if (this.readyState === 4 && this.status === 200) {
                    try {
                        const responseData = JSON.parse(this.responseText);
                        if (responseData.encrypted_response) {
                            const decryptedData = await CryptoClient.decryptData(responseData.encrypted_response);
                            
                            // Substitui responseText (não é padrão, mas funciona em alguns casos)
                            Object.defineProperty(this, 'responseText', {
                                value: JSON.stringify(decryptedData),
                                writable: false
                            });
                        }
                    } catch (e) {
                        // Ignora erros de parsing - pode não ser JSON
                    }
                }
                
                if (originalReadyStateChange) {
                    originalReadyStateChange.call(this);
                }
            };
            
            SecureRequest.originalXHRSend.call(xhr, processedData);
            
        } catch (error) {
            console.error('Erro na criptografia XHR:', error);
            SecureRequest.originalXHRSend.call(xhr, data);
        }
    }
    
    /**
     * Adiciona requisição à queue
     * @param {Object} requestData - Dados da requisição
     * @returns {Promise} - Promise que resolve quando processada
     */
    static addToQueue(requestData) {
        return new Promise((resolve, reject) => {
            if (this.requestQueue.length >= this.MAX_QUEUE_SIZE) {
                reject(new Error('Queue de requisições cheia'));
                return;
            }
            
            const queueItem = {
                ...requestData,
                resolve,
                reject,
                timestamp: Date.now()
            };
            
            this.requestQueue.push(queueItem);
            console.log(`Requisição adicionada à queue (${this.requestQueue.length} pendentes)`);
        });
    }
    
    /**
     * Processa requisição em queue (fetch)
     * @param {string} url - URL da requisição
     * @param {Object} options - Opções do fetch
     * @returns {Promise<Response>} - Promise da resposta
     */
    static queueRequest(url, options) {
        return this.addToQueue({
            type: 'fetch',
            url,
            options
        });
    }
    
    /**
     * Inicia processador de queue
     */
    static startQueueProcessor() {
        // Verifica queue periodicamente
        setInterval(() => {
            if (this.requestQueue.length > 0 && !this.queueProcessing) {
                this.processQueue();
            }
        }, 1000);
        
        // Processa quando CryptoClient fica pronto
        if (window.KeyExchange) {
            KeyExchange.addEventListener(KeyExchange.events.handshakeSuccess, () => {
                if (this.requestQueue.length > 0) {
                    this.processQueue();
                }
            });
        }
    }
    
    /**
     * Processa queue de requisições pendentes
     */
    static async processQueue() {
        if (this.queueProcessing || this.requestQueue.length === 0) {
            return;
        }
        
        this.queueProcessing = true;
        console.log(`Processando queue com ${this.requestQueue.length} requisições`);
        
        try {
            while (this.requestQueue.length > 0) {
                const item = this.requestQueue.shift();
                
                // Verifica timeout
                if (Date.now() - item.timestamp > this.QUEUE_TIMEOUT) {
                    item.reject(new Error('Timeout na queue'));
                    continue;
                }
                
                try {
                    if (item.type === 'fetch') {
                        const response = await this.processSecureFetch(item.url, item.options);
                        item.resolve(response);
                    } else if (item.type === 'xhr') {
                        await this.processXHREncryption(item.xhr, item.data);
                        // XHR não tem resolve/reject direto
                    }
                } catch (error) {
                    item.reject(error);
                }
            }
        } finally {
            this.queueProcessing = false;
        }
        
        console.log('Queue processada completamente');
    }
    
    /**
     * Verifica se URL deve ser criptografada
     * @param {string} url - URL a ser verificada
     * @returns {boolean} - True se deve criptografar
     */
    static shouldEncryptUrl(url) {
        if (!this.AUTO_ENCRYPT_ENABLED) {
            return false;
        }
        
        // Verifica padrões ignorados primeiro
        if (this.ignoredPatterns.some(pattern => pattern.test(url))) {
            return false;
        }
        
        // Verifica padrões de criptografia
        return this.encryptionPatterns.some(pattern => pattern.test(url));
    }
    
    /**
     * Adiciona padrão de URL para criptografia
     * @param {RegExp} pattern - Padrão regex
     */
    static addEncryptionPattern(pattern) {
        this.encryptionPatterns.push(pattern);
    }
    
    /**
     * Adiciona padrão de URL para ignorar
     * @param {RegExp} pattern - Padrão regex
     */
    static addIgnorePattern(pattern) {
        this.ignoredPatterns.push(pattern);
    }
    
    /**
     * Habilita/desabilita criptografia automática
     * @param {boolean} enabled - True para habilitar
     */
    static setAutoEncryption(enabled) {
        this.AUTO_ENCRYPT_ENABLED = enabled;
        console.log(`Criptografia automática ${enabled ? 'habilitada' : 'desabilitada'}`);
    }
    
    /**
     * Obtém estatísticas da queue
     * @returns {Object} - Estatísticas
     */
    static getQueueStats() {
        return {
            queueLength: this.requestQueue.length,
            queueProcessing: this.queueProcessing,
            maxQueueSize: this.MAX_QUEUE_SIZE,
            queueTimeout: this.QUEUE_TIMEOUT,
            autoEncryptEnabled: this.AUTO_ENCRYPT_ENABLED
        };
    }
    
    /**
     * Limpa queue de requisições
     */
    static clearQueue() {
        const queueLength = this.requestQueue.length;
        
        // Rejeita todas as requisições pendentes
        this.requestQueue.forEach(item => {
            item.reject(new Error('Queue limpa'));
        });
        
        this.requestQueue = [];
        console.log(`Queue limpa (${queueLength} requisições descartadas)`);
    }
    
    /**
     * Restaura funções originais
     */
    static restore() {
        if (this.originalFetch) {
            window.fetch = this.originalFetch;
            this.originalFetch = null;
        }
        
        if (this.originalXHROpen) {
            XMLHttpRequest.prototype.open = this.originalXHROpen;
            XMLHttpRequest.prototype.send = this.originalXHRSend;
            this.originalXHROpen = null;
            this.originalXHRSend = null;
        }
        
        this.clearQueue();
        this.initialized = false;
        
        console.log('SecureRequest restaurado');
    }
}

// Exporta para uso global
window.SecureRequest = SecureRequest;
