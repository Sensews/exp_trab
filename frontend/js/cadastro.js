window.addEventListener('load', () => {
    const telefoneInput = document.querySelector('#telefone');
    telefoneInput.addEventListener('keydown', bloquearEntradaNaoNumerica);
    telefoneInput.addEventListener('keyup', formatarParaTelefone);

    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmar-senha');
    const form = document.getElementById('form-cadastro');
    const botaoCadastro = document.getElementById('btn-cadastrar');

    const senhaForcaOutput = document.createElement('div');
    const senhaErroOutput = document.createElement('div');
    senhaForcaOutput.style.fontSize = '12px';
    senhaErroOutput.style.fontSize = '12px';
    senhaErroOutput.style.color = 'red';

    senhaInput.parentNode.appendChild(senhaForcaOutput);
    confirmarSenhaInput.parentNode.appendChild(senhaErroOutput);

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

    senhaInput.addEventListener('input', () => {
        const forca = verificarForcaSenha(senhaInput.value);
        senhaForcaOutput.textContent = `Força da senha: ${forca}`;
        senhaForcaOutput.style.color =
            forca === 'Muito forte' ? 'green' :
            forca === 'Forte' ? 'blue' :
            forca === 'Moderada' ? 'orange' : 'red';
        validarFormulario();
    });

    confirmarSenhaInput.addEventListener('input', () => {
        senhaErroOutput.textContent =
            senhaInput.value !== confirmarSenhaInput.value ? 'As senhas não coincidem.' : '';
        validarFormulario();
    });

    form.addEventListener('submit', (e) => {
        if (senhaInput.value !== confirmarSenhaInput.value) {
            e.preventDefault();
            senhaErroOutput.textContent = 'As senhas não coincidem.';
        }
    });

    // Exibe modal só se sucesso for indicado na URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('sucesso') === '1') {
        document.getElementById('popup-modal').style.display = 'block';
    }
});

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
