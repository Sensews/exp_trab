// Formatar telefone
window.addEventListener('load', () => {
    const telefoneInput = document.querySelector('#telefone');
    telefoneInput.addEventListener('keydown', bloquearEntradaNaoNumerica);
    telefoneInput.addEventListener('keyup', formatarParaTelefoneBrasileiro);
});

const bloquearEntradaNaoNumerica = (evento) => {
    if (evento.ctrlKey) { return; }
    if (evento.key.length > 1) { return; }
    if (/[0-9]/.test(evento.key)) { return; }
    evento.preventDefault();
};

const formatarParaTelefoneBrasileiro = (evento) => {
    const digitos = evento.target.value.replace(/\D/g, '').substring(0, 11); // Máximo de 11 dígitos
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

// Conferir força de senha
window.addEventListener('load', () => {
    const senhaInput = document.querySelector('#senha');
    const confirmarSenhaInput = document.querySelector('#confirmar-senha');
    const senhaForcaOutput = document.createElement('div');
    const senhaErroOutput = document.createElement('div');
    const botaoCadastro = document.querySelector('#btn-cadastro');

    senhaForcaOutput.style.fontSize = '12px';
    senhaErroOutput.style.fontSize = '12px';
    senhaErroOutput.style.color = 'red';

    senhaInput.parentNode.appendChild(senhaForcaOutput);
    confirmarSenhaInput.parentNode.appendChild(senhaErroOutput);

    const validarFormulario = () => {
        const forca = verificarForcaSenha(senhaInput.value);
        const senhasCoincidem = senhaInput.value === confirmarSenhaInput.value;

        if (forca === 'Muito forte' && senhasCoincidem) {
            botaoCadastro.disabled = false;
        } else {
            botaoCadastro.disabled = true;
        }
    };

    senhaInput.addEventListener('input', () => {
        const forca = verificarForcaSenha(senhaInput.value);
        senhaForcaOutput.textContent = `Força da senha: ${forca}`;

        // Alterar a cor com base na força da senha
        switch (forca) {
            case 'Muito forte':
                senhaForcaOutput.style.color = 'green';
                break;
            case 'Forte':
                senhaForcaOutput.style.color = 'blue';
                break;
            case 'Moderada':
                senhaForcaOutput.style.color = 'orange';
                break;
            case 'Fraca':
            case 'Muito fraca':
                senhaForcaOutput.style.color = 'red';
                break;
        }

        validarFormulario();
    });

    confirmarSenhaInput.addEventListener('input', () => {
        if (senhaInput.value !== confirmarSenhaInput.value) {
            senhaErroOutput.textContent = 'As senhas não coincidem.';
        } else {
            senhaErroOutput.textContent = '';
        }
        validarFormulario();
    });
});

const verificarForcaSenha = (senha) => {
    let forca = 0;

    if (senha.length >= 8) forca++;
    if (/[A-Z]/.test(senha)) forca++;
    if (/[a-z]/.test(senha)) forca++;
    if (/[0-9]/.test(senha)) forca++;
    if (/[\W_]/.test(senha)) forca++;

    switch (forca) {
        case 5: return 'Muito forte';
        case 4: return 'Forte';
        case 3: return 'Moderada';
        case 2: return 'Fraca';
        default: return 'Muito fraca';
    }
};
