window.addEventListener('load', () => {
    // Adiciona os scripts de criptografia à página
    const cryptoScript = document.createElement('script');
    cryptoScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
    document.head.appendChild(cryptoScript);
    
    const jsEncryptScript = document.createElement('script');
    jsEncryptScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsencrypt/3.3.0/jsencrypt.min.js';
    document.head.appendChild(jsEncryptScript);
    
    // Aguardar carregamento das bibliotecas e do cliente seguro
    setTimeout(async () => {
        // Carregar cliente de criptografia
        const secureClientScript = document.createElement('script');
        secureClientScript.src = 'js/secure_client.js';
        document.head.appendChild(secureClientScript);
        
        setTimeout(() => {
            initializeCadastroSecure();
        }, 500);
    }, 1000);
});

function initializeCadastroSecure() {
    // ===== INICIALIZAÇÃO DOS ELEMENTOS =====
    const telefoneInput = document.querySelector('#telefone');
    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmar-senha');
    const form = document.getElementById('form-cadastro');
    const botaoCadastro = document.getElementById('btn-cadastrar');

    // ===== CONFIGURAÇÃO DE ELEMENTOS DINAMICAMENTE CRIADOS =====
    const senhaForcaOutput = document.createElement('div');
    const senhaErroOutput = document.createElement('div');
    
    // Estilização dos elementos dinâmicos
    senhaForcaOutput.style.fontSize = '12px';
    senhaErroOutput.style.fontSize = '12px';
    senhaErroOutput.style.color = 'red';

    // Campo oculto para enviar o hash ao servidor
    const senhaHashInput = document.createElement('input');
    senhaHashInput.type = 'hidden';
    senhaHashInput.name = 'senha_hash_visual';
    senhaHashInput.id = 'senha_hash_visual';
    form.appendChild(senhaHashInput);

    // Adiciona elementos ao DOM
    senhaInput.parentNode.appendChild(senhaForcaOutput);
    confirmarSenhaInput.parentNode.appendChild(senhaErroOutput);

    // ===== FUNÇÃO DE GERAÇÃO DE HASH =====
    const gerarHash = (senha) => {
        if (!senha || typeof CryptoJS === 'undefined') {
            return;
        }
        
        const hash = CryptoJS.SHA256(senha).toString();
        senhaHashInput.value = hash.substring(0, 8);
    };

    // ===== FUNÇÕES DE VALIDAÇÃO DE SENHA =====
    const verificarForcaSenha = (senha) => {
        let forca = 0;
        if (senha.length >= 8) forca++;
        if (/[A-Z]/.test(senha)) forca++;
        if (/[a-z]/.test(senha)) forca++;
        if (/[0-9]/.test(senha)) forca++;
        if (/[^A-Za-z0-9]/.test(senha)) forca++;

        if (forca >= 5) return 'Muito forte';
        if (forca >= 4) return 'Forte';
        if (forca >= 3) return 'Moderada';
        if (forca >= 2) return 'Fraca';
        return 'Muito fraca';
    };

    const validarFormulario = () => {
        const forca = verificarForcaSenha(senhaInput.value);
        const senhasCoincidem = senhaInput.value === confirmarSenhaInput.value;

        botaoCadastro.disabled = !(forca === 'Muito forte' && senhasCoincidem);
    };

    // ===== CONFIGURAÇÃO DE EVENTOS =====
    telefoneInput.addEventListener('keydown', bloquearEntradaNaoNumerica);
    telefoneInput.addEventListener('keyup', formatarParaTelefone);

    senhaInput.addEventListener('input', () => {
        const forca = verificarForcaSenha(senhaInput.value);
        senhaForcaOutput.textContent = `Força da senha: ${forca}`;
        senhaForcaOutput.style.color =
            forca === 'Muito forte' ? 'green' :
            forca === 'Forte' ? 'blue' :
            forca === 'Moderada' ? 'orange' : 'red';
        
        gerarHash(senhaInput.value);
        validarFormulario();
    });

    confirmarSenhaInput.addEventListener('input', () => {
        senhaErroOutput.textContent =
            senhaInput.value !== confirmarSenhaInput.value ? 'As senhas não coincidem.' : '';
        validarFormulario();
    });    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (senhaInput.value !== confirmarSenhaInput.value) {
            senhaErroOutput.textContent = 'As senhas não coincidem.';
            return;
        }

        // Desabilitar botão durante o envio
        botaoCadastro.disabled = true;
        botaoCadastro.textContent = 'Cadastrando...';

        try {
            // Coletar dados do formulário
            const formData = {
                nome: document.getElementById('nome').value,
                email: document.getElementById('email').value,
                telefone: telefoneInput.value,
                senha: senhaInput.value,
                'confirmar-senha': confirmarSenhaInput.value
            };

            // Tentar envio criptografado primeiro
            let response;
            try {
                response = await secureClient.registerUser(formData);
                console.log('Cadastro com criptografia híbrida realizado com sucesso');
            } catch (cryptoError) {
                console.warn('Erro na criptografia, tentando método tradicional:', cryptoError);
                
                // Fallback para método tradicional
                const formDataTraditional = new FormData();
                Object.keys(formData).forEach(key => {
                    formDataTraditional.append(key, formData[key]);
                });

                const traditionalResponse = await fetch('../backend/cadastro.php', {
                    method: 'POST',
                    body: formDataTraditional
                });

                if (traditionalResponse.ok) {
                    response = { success: true, message: 'Cadastro realizado com método tradicional' };
                } else {
                    throw new Error('Erro no cadastro tradicional: ' + traditionalResponse.statusText);
                }
            }

            if (response.success) {
                document.getElementById('popup-modal').style.display = 'block';
                form.reset();
            } else {
                throw new Error(response.error || response.message || 'Erro desconhecido');
            }

        } catch (error) {
            console.error('Erro no cadastro:', error);
            alert('Erro no cadastro: ' + error.message);
        } finally {
            // Reabilitar botão
            botaoCadastro.disabled = false;
            botaoCadastro.textContent = 'CADASTRAR';
        }
    });

    // ===== VERIFICAÇÃO DE REDIRECIONAMENTO =====
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('sucesso') === '1') {
        document.getElementById('popup-modal').style.display = 'block';
    }
}

// ===== FUNÇÕES AUXILIARES =====
const bloquearEntradaNaoNumerica = (evento) => {
    if (evento.ctrlKey || evento.key.length > 1 || /[0-9]/.test(evento.key)) return;
    evento.preventDefault();
};

const formatarParaTelefone = (evento) => {
    const digitos = evento.target.value.replace(/\D/g, '').substring(0, 11);
    const codigoArea = digitos.substring(0, 2);
    const primeiraParte = digitos.length > 10 ? digitos.substring(2, 7) : digitos.substring(2, 6);
    const segundaParte = digitos.length > 10 ? digitos.substring(7, 11) : digitos.substring(6, 10);

    if (digitos.length > 6) {
        evento.target.value = `(${codigoArea}) ${primeiraParte}-${segundaParte}`;
    } else if (digitos.length > 2) {
        evento.target.value = `(${codigoArea}) ${primeiraParte}`;
    } else if (digitos.length > 0) {
        evento.target.value = `(${codigoArea}`;
    }
};

function fecharPopup() {
    document.getElementById("popup-modal").style.display = "none";
}
