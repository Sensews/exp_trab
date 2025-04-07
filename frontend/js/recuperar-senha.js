document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("form-recover");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const usuario = document.getElementById("usuario").value.trim();

        if (!usuario) {
            alert("Por favor, preencha o e-mail ou telefone.");
            return;
        }

        const formData = new FormData();
        formData.append("usuario", usuario);

        try {
            const response = await fetch(form.action, {
                method: "POST",
                body: formData
            });

            const text = await response.text();
            alert(text);
        } catch (error) {
            alert("Erro ao tentar enviar solicitação. Tente novamente.");
            console.error(error);
        }
    });
});
