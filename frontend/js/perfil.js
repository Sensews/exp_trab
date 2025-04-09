const modal = document.getElementById('modal');

// Abre o modal e preenche os campos
function abrirModal() {
  modal.classList.add('open');

  document.getElementById('inputNome').value = localStorage.getItem('nome') || '';
  document.getElementById('inputArroba').value = (localStorage.getItem('arroba') || '@seuarroba').replace('@', '');
  document.getElementById('inputBio').value = localStorage.getItem('bio') || '';
  document.getElementById('inputLocal').value = localStorage.getItem('local') || '';
  document.getElementById('inputAniversario').value = localStorage.getItem('aniversario') || '';

  document.getElementById('contadorBio').textContent = `${document.getElementById('inputBio').value.length} / 160`;

  const bannerUrl = localStorage.getItem('banner');
  if (bannerUrl) {
    const banner = document.getElementById('modalBanner');
    banner.style.backgroundImage = `url('${bannerUrl}')`;
    banner.style.backgroundSize = 'cover';
    banner.style.backgroundPosition = 'center';
  }
}

// Salva os dados no localStorage
function salvarPerfil() {
  const nome = document.getElementById('inputNome').value.trim();
  const arroba = document.getElementById('inputArroba').value.trim();
  const bio = document.getElementById('inputBio').value;
  const local = document.getElementById('inputLocal').value;
  const aniversario = document.getElementById('inputAniversario').value;

  if (nome === '' || arroba === '') {
    alert('Nome e usuário são obrigatórios!');
    return;
  }

  if (nome.length > 30) {
    alert('O nome não pode ter mais que 30 caracteres.');
    return;
  }

  if (arroba.length > 15) {
    alert('O nome de usuário não pode ter mais que 15 caracteres.');
    return;
  }

  localStorage.setItem('nome', nome);
  localStorage.setItem('arroba', '@' + arroba);
  localStorage.setItem('bio', bio);
  localStorage.setItem('local', local);
  localStorage.setItem('aniversario', aniversario);

  atualizarPerfil();
  modal.classList.remove('open');
}

// Atualiza os elementos do perfil
function atualizarPerfil() {
  document.getElementById('nome').textContent = localStorage.getItem('nome') || 'Seu nome';
  const arroba = localStorage.getItem('arroba') || '@seuarroba';
  document.getElementById('arroba').textContent = arroba;
  document.getElementById('arrobaPost').textContent = arroba;
  document.getElementById('bio').textContent = localStorage.getItem('bio') || 'Sua bio aqui';
  document.getElementById('local').textContent = localStorage.getItem('local') || 'Sua cidade';

  const avatar = localStorage.getItem('avatar');
  const defaultAvatar = 'https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png';

  const avatarEl = document.getElementById('avatar');
  const modalAvatarEl = document.getElementById('modalAvatar');
  if (avatarEl) avatarEl.src = avatar || defaultAvatar;
  if (modalAvatarEl) modalAvatarEl.src = avatar || defaultAvatar;

  const bannerUrl = localStorage.getItem('banner');
  if (bannerUrl) {
    const banner = document.getElementById('banner');
    banner.style.backgroundImage = `url('${bannerUrl}')`;
    banner.style.backgroundSize = 'cover';
    banner.style.backgroundPosition = 'center';
  }

  const aniversario = localStorage.getItem('aniversario');
  if (aniversario) {
    const [ano, mes, dia] = aniversario.split('-');
    document.getElementById('aniversario').textContent = `Aniversário: ${dia}/${mes}/${ano}`;
  }
}

// Redimensiona uma imagem 
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

// Atualiza imagem do perfil
document.getElementById('inputAvatar').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    resizeAndStoreImage(file, 130, 130, (resizedUrl) => {
      localStorage.setItem('avatar', resizedUrl);
      atualizarPerfil();

      // Atualiza o avatar do header
      const iconHeader = document.getElementById("iconHeader");
      if (iconHeader) {
        iconHeader.src = resizedUrl;
      }
    });
  }
});

// Atualiza imagem do banner
document.getElementById('inputBanner').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    resizeAndStoreImage(file, 800, 200, (resizedUrl) => {
      localStorage.setItem('banner', resizedUrl);
      const modalBanner = document.getElementById('modalBanner');
      modalBanner.style.backgroundImage = `url('${resizedUrl}')`;
      modalBanner.style.backgroundSize = 'cover';
      modalBanner.style.backgroundPosition = 'center';
      atualizarPerfil();
    });
  }
});

// Atualiza contador da bio
document.getElementById('inputBio').addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
  document.getElementById('contadorBio').textContent = `${this.value.length} / 160`;
});

// Inicializa o perfil ao carregar a página
window.onload = () => {
  atualizarPerfil();
};
