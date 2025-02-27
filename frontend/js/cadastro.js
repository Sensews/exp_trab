document.getElementById("cadastro-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    let nome = document.getElementById("nome").value;
    let email = document.getElementById("email").value;
    let senha = document.getElementById("senha").value;
    let confirmarSenha = document.getElementById("confirmar-senha").value;
    let telefone = document.getElementById("telefone").value;
    let cpf = document.getElementById("cpf").value;

// VALIDAR SENHA
    if (senha.length < 8 || !/[A-Z]/.test(senha) || !/[0-9]/.test(senha)) {
        alert("A senha deve ter pelo menos 8 caracteres, uma letra maiúscula e um número.");
        return;
    }

// CONFIRMAR SENHA
    if (senha !== confirmarSenha) {
        alert("As senhas não coincidem!");
        return;
    }

    // GERADOR DE HASH PARA A SENHA
    const encoder = new TextEncoder();
    const data = encoder.encode(senha);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashSenha = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    console.log("Nome:", nome);
    console.log("Email:", email);
    console.log("Senha Hash:", hashSenha); // Apenas para teste
    console.log("Telefone:", telefone);
    console.log("CPF:", cpf);

    alert("Cadastro realizado! Confirme seu email para ativar sua conta.");
    
// CONTINUAR ENVIANDO OS DADOS PARA O SERVER
});

// FORMATAR TELEFONE E CPF
document.addEventListener("DOMContentLoaded", function () {
    const telefoneInput = document.getElementById("telefone");
    const cpfInput = document.getElementById("cpf");

// FORMATAR O TELEFONE: (XX) XXXXX-XXXX
    telefoneInput.addEventListener("input", function (e) {
        let value = e.target.value.replace(/\D/g, "");

        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 10) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
        } else if (value.length > 6) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
        } else if (value.length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else if (value.length > 0) {
            value = `(${value}`;
        }

        e.target.value = value;
    });

// FORMATAR O CPF: XXX.XXX.XXX-XX
    cpfInput.addEventListener("input", function (e) {
        let value = e.target.value.replace(/\D/g, "");

        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 9) {
            value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9, 11)}`;
        } else if (value.length > 6) {
            value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
        } else if (value.length > 3) {
            value = `${value.slice(0, 3)}.${value.slice(3)}`;
        }

        e.target.value = value;
    });
});

// OCULTAR E MOSTRAR SENHA
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector("i");

    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password"; 
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye"); 
    }
}

