let postCounter = 0; //contador para um unico ID a cada post//

//publica novo post//
function postar() {
  const text = document.getElementById("postText").value.trim(); //remove espaçõs em branco//
  const fileInput = document.getElementById("postImage"); //referencia o input(img)//
  const file = fileInput.files[0]; //pega a img //

  if (text === "" && !file) return; //impede de postar se n tiver nd//

  const tweet = document.createElement("div"); //cria um novo elemento para o post//
  tweet.className = "tweet"; //Define a classe css//

  const postId = "post-" + (++postCounter); //gera um id para o post//
  tweet.setAttribute("data-id", postId); //atribui o id ao post//

  const textDiv = document.createElement("div"); //cria uma caix para o texto
  textDiv.className = "text"; //define a classe css//
  textDiv.textContent = text; //define o texto digitado/
  tweet.appendChild(textDiv); //adc o text a o post//

  if (file) { //verifica se adc uma imagem//
    const reader = new FileReader(); //cria um leitor de arquivos//
    reader.onload = function (e) { //quando o arquivo for lido//
      const img = document.createElement("img"); //cria um elemento de imagem//
      img.src = e.target.result; //define a img como base64//
      tweet.appendChild(img); //adc img a o post//
      adicionarInteracoes(tweet, postId); //adc like e comentario//
    };
    reader.readAsDataURL(file); //le a img como url base64//
  } else {
    adicionarInteracoes(tweet, postId); //se n tiver img adc so as interações//
  }

  const feed = document.getElementById("feed"); //seleciona a area do feed//
  feed.insertBefore(tweet, feed.firstChild); //coloca o post no topo do feed//
  //limpa o campo de postagem//
  document.getElementById("postText").value = ""; 
  document.getElementById("postImage").value = "";
}
//função q adc curtida e comentarios//
function adicionarInteracoes(tweet, postId) {
  const actions = document.createElement("div"); //container para ações
  actions.className = "actions";//dfine classe css//

  const likeButton = document.createElement("button"); //botão de curtida
  likeButton.className = "like-btn";//define classe css//

  let curtido = jaCurtiu(postId); //verifica se ja foi curtido o post
  let count = curtido ? 1 : 0; // contagem//
  likeButton.innerHTML = `❤️ Curtir (<span>${count}</span>)`; //html do botao//

  likeButton.onclick = function () { //ação de clicar no botão de like
    const countSpan = this.querySelector("span"); //referencia o contador

    if (!curtido) {
      count++; //incrementa se n tiver curtida ainda
      salvarCurtida(postId); //salva no localstorage
      curtido = true;
    } else {
      count--; //decrementa se ja tiver curtido
      removerCurtida(postId); //remove do localstorage
      curtido = false;
    }

    countSpan.textContent = count; //atualiza a contagem
  };

  actions.appendChild(likeButton); //adc botao de curtida a ações
  tweet.appendChild(actions); //adc as ações a os post
  //area de comentarios
  const chatArea = document.createElement("div");
  chatArea.className = "chat-area"; //define o css

  const input = document.createElement("input"); //campo d entrada para comentario
  input.type = "text";
  input.placeholder = "Comentar..."; //placeholder

  const commentBtn = document.createElement("button"); //botao de enviar
  commentBtn.textContent = "Enviar";

  const commentList = document.createElement("div"); //container p listar de comentario
  commentList.className = "comments"; //classe css

  commentBtn.onclick = () => {
    const commentText = input.value.trim();//pega o texto
    if (commentText !== "") {
      const comment = document.createElement("div"); //cria o comentario
      comment.className = "comment"; //define o css
      comment.textContent = commentText; //define o texto
      commentList.appendChild(comment); //adc a lista e coemntario
      input.value = ""; //limpa o campo de entrada
    }
  };
  //faz a area de comentario do tweet
  chatArea.appendChild(input);
  chatArea.appendChild(commentBtn);
  tweet.appendChild(chatArea);
  tweet.appendChild(commentList);
}
//salva a curtida no localstorage
function salvarCurtida(postId) {
  let curtidas = JSON.parse(localStorage.getItem("curtidas")) || []; //pega as curtida salvas
  if (!curtidas.includes(postId)) { // se ainda n foi curtida
    curtidas.push(postId); //adc o id do post
    localStorage.setItem("curtidas", JSON.stringify(curtidas)); //salva de volta
  }
}
//remove a curtida do localstorage
function removerCurtida(postId) {
  let curtidas = JSON.parse(localStorage.getItem("curtidas")) || []; //pega a curtida
  curtidas = curtidas.filter(id => id !== postId); //remov o do post curtido
  localStorage.setItem("curtidas", JSON.stringify(curtidas)); //salva de volta
}
//verifica se o post ja foi curtido anteriormente
function jaCurtiu(postId) {
  let curtidas = JSON.parse(localStorage.getItem("curtidas")) || [];  //pega as curtidas salvas
  return curtidas.includes(postId); //retorna true ou false
}