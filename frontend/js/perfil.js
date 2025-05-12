document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById('modal');
  let avatarBase64 = '';
  let bannerBase64 = '';

  // Carrega dados do perfil do servidor
  fetch("perfil.php?action=carregar")
    .then(res => res.json())
    .then(data => {
      if (data.erro) {
        window.location.href = "erro.html";
      } else {
        atualizarPerfil(data);
      }
    });

  // Atualiza os elementos da interface com os dados do perfil
  function atualizarPerfil(data) {
    document.getElementById('nome').textContent = data.nome;
    document.getElementById('arroba').textContent = data.arroba;
    document.getElementById('arrobaPost').textContent = data.arroba;
    document.getElementById('bio').textContent = data.bio;
    document.getElementById('local').textContent = data.local;

    const avatar = data.avatar || 'https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png';
    document.getElementById('avatar').src = avatar;
    document.getElementById('modalAvatar').src = avatar;
    document.getElementById('iconHeader').src = avatar;
    avatarBase64 = avatar;

    if (data.banner) {
      document.getElementById('banner').style.backgroundImage = `url('${data.banner}')`;
      document.getElementById('modalBanner').style.backgroundImage = `url('${data.banner}')`;
      bannerBase64 = data.banner;
    }

    if (data.aniversario) {
      const [ano, mes, dia] = data.aniversario.split("-");
      document.getElementById('aniversario').textContent = `Aniversário: ${dia}/${mes}/${ano}`;
    }
  }

  // Abre o modal com os campos preenchidos
  window.abrirModal = function () {
    modal.classList.add('open');
    fetch("perfil.php?action=carregar")
      .then(res => res.json())
      .then(data => {
        document.getElementById('inputNome').value = data.nome;
        document.getElementById('inputArroba').value = data.arroba.replace('@', '');
        document.getElementById('inputBio').value = data.bio;
        document.getElementById('inputLocal').value = data.local;
        document.getElementById('inputAniversario').value = data.aniversario;
        document.getElementById('contadorBio').textContent = `${data.bio.length} / 160`;
      });
  };

  // Envia os dados para o backend e fecha o modal
  window.salvarPerfil = function () {
    const nome = document.getElementById('inputNome').value.trim();
    const arroba = document.getElementById('inputArroba').value.trim();
    const bio = document.getElementById('inputBio').value;
    const local = document.getElementById('inputLocal').value;
    const aniversario = document.getElementById('inputAniversario').value;

    if (!nome || !arroba) return alert("Nome e usuário são obrigatórios.");
    if (nome.length > 30) return alert("O nome não pode ter mais que 30 caracteres.");
    if (arroba.length > 15) return alert("O nome de usuário não pode ter mais que 15 caracteres.");

    const dados = new URLSearchParams({
      nome,
      arroba,
      bio,
      local,
      aniversario,
      avatar: avatarBase64,
      banner: bannerBase64
    });

    fetch("perfil.php?action=salvar", {
      method: "POST",
      body: dados
    })
      .then(res => res.json())
      .then(() => {
        modal.classList.remove('open');
        return fetch("perfil.php?action=carregar");
      })
      .then(res => res.json())
      .then(data => atualizarPerfil(data));
  };

  // Redimensiona e armazena o avatar como base64
  document.getElementById('inputAvatar').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
      resizeAndStoreImage(file, 130, 130, (resizedUrl) => {
        avatarBase64 = resizedUrl;
        document.getElementById('modalAvatar').src = resizedUrl;
        document.getElementById("iconHeader").src = resizedUrl;
      });
    }
  });

  // Redimensiona e armazena o banner como base64
  document.getElementById('inputBanner').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
      resizeAndStoreImage(file, 800, 200, (resizedUrl) => {
        bannerBase64 = resizedUrl;
        const modalBanner = document.getElementById('modalBanner');
        modalBanner.style.backgroundImage = `url('${resizedUrl}')`;
        modalBanner.style.backgroundSize = 'cover';
        modalBanner.style.backgroundPosition = 'center';
      });
    }
  });

  // Utilitário para redimensionar imagem antes de salvar
  function resizeAndStoreImage(file, width, height, callback) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        callback(resizedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Atualiza contador da bio dinamicamente
  document.getElementById('inputBio').addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
    document.getElementById('contadorBio').textContent = `${this.value.length} / 160`;
  });
});
