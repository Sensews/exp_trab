document.addEventListener('DOMContentLoaded', async () => {
  // Verifica se a sessão está ativa
  try {
    const res = await fetch("../backend/verificar_sessao.php");
    const dados = await res.json();

    if (!dados.logado) {
      window.location.href = "../frontend/erro.html";
      return;
    }

    document.body.style.display = "block";
  } catch (e) {
    window.location.href = "../frontend/erro.html";
    return;
  }

  const form = document.getElementById('formEntrarParty');
  const codigoInput = document.getElementById('codigo');
  const senhaInput = document.getElementById('senha');
  const mensagemErro = document.getElementById('mensagemErro');

  // 🔄 Carregar perfil do usuário logado
  let id_perfil = null;
  try {
    const perfilRes = await fetch("../backend/perfil.php?action=carregar");
    const perfilData = await perfilRes.json();
    if (!perfilData.id_perfil) {
      mensagemErro.textContent = 'Perfil não encontrado.';
      return;
    }
    id_perfil = perfilData.id_perfil;
  } catch {
    mensagemErro.textContent = 'Erro ao buscar perfil.';
    return;
  }

  // Submeter formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensagemErro.textContent = '';

    const codigo = codigoInput.value.trim();
    const senha = senhaInput.value.trim();

    if (!codigo || !senha || !id_perfil) {
      mensagemErro.textContent = 'Preencha todos os campos.';
      return;
    }

    const formData = new FormData();
    formData.append('codigo', codigo);
    formData.append('senha', senha);
    formData.append('id_perfil', id_perfil);

    try {
      const response = await fetch('../backend/entrar_party.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.sucesso) {
        window.location.href = 'party.html?id=' + result.id_party;
      } else {
        mensagemErro.textContent = result.erro || 'Erro ao entrar na party.';
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      mensagemErro.textContent = 'Erro na comunicação com o servidor.';
    }
  });
});

 {
    // Objetos para mapear atributos e suas perícias
    const abilityScores = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const skillAbilityMap = {
        'acrobatics': 'dex',
        'animalHandling': 'wis',
        'arcana': 'int',
        'athletics': 'str',
        'deception': 'cha',
        'history': 'int',
        'insight': 'wis',
        'intimidation': 'cha',
        'investigation': 'int',
        'medicine': 'wis',
        'nature': 'int',
        'perception': 'wis',
        'performance': 'cha',
        'persuasion': 'cha',
        'religion': 'int',
        'sleightOfHand': 'dex',
        'stealth': 'dex',
        'survival': 'wis'
    };

    // Função para calcular modificador com base no atributo
    function calculateModifier(abilityScore) {
        return Math.floor((abilityScore - 10) / 2);
    }

    // Função para formatar o modificador (adicionar + para valores não negativos)
    function formatModifier(modifier) {
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    // Atualiza modificadores de atributos e valores relacionados
    function updateModifiers() {
        // Cálculo de bônus de proficiência com base no nível
        const level = parseInt(document.getElementById('charLevel').value) || 1;
        const profBonus = Math.floor((level - 1) / 4) + 2;
        document.getElementById('profBonus').textContent = formatModifier(profBonus);

        // Atualiza os modificadores de atributos
        abilityScores.forEach(ability => {
            const score = parseInt(document.getElementById(ability).value) || 10;
            const modifier = calculateModifier(score);
            document.getElementById(`${ability}Mod`).textContent = formatModifier(modifier);

            // Atualiza testes de resistência
            const saveProf = document.getElementById(`${ability}Save`).checked;
            const saveMod = modifier + (saveProf ? profBonus : 0);
            document.getElementById(`${ability}SaveMod`).textContent = formatModifier(saveMod);
        });

        // Atualiza perícias
        for (const skill in skillAbilityMap) {
            const ability = skillAbilityMap[skill];
            const abilityMod = calculateModifier(parseInt(document.getElementById(ability).value) || 10);
            const isProf = document.getElementById(skill).checked;
            const skillMod = abilityMod + (isProf ? profBonus : 0);
            document.getElementById(`${skill}Mod`).textContent = formatModifier(skillMod);
        }

        // Atualiza iniciativa (baseada na DEX)
        const dexMod = calculateModifier(parseInt(document.getElementById('dex').value) || 10);
        document.getElementById('initiative').textContent = formatModifier(dexMod);

        // Atualiza CD de magia e bônus de ataque
        updateSpellValues();
    }

    // Atualiza valores relacionados à magia
    function updateSpellValues() {
        const spellAbility = document.getElementById('spellcastingAbility').value;
        const abilityMod = calculateModifier(parseInt(document.getElementById(spellAbility).value) || 10);
        const profBonus = parseInt(document.getElementById('profBonus').textContent) || 2;

        const spellSaveDC = 8 + profBonus + abilityMod;
        const spellAttack = profBonus + abilityMod;

        document.getElementById('spellSaveDC').textContent = spellSaveDC;
        document.getElementById('spellAttackBonus').textContent = formatModifier(spellAttack);
    }

    // Event listeners para atributos
    abilityScores.forEach(ability => {
        document.getElementById(ability).addEventListener('change', updateModifiers);
    });

    // Event listeners para proficiências em testes de resistência
    abilityScores.forEach(ability => {
        document.getElementById(`${ability}Save`).addEventListener('change', updateModifiers);
    });

    // Event listeners para proficiências em perícias
    for (const skill in skillAbilityMap) {
        document.getElementById(skill).addEventListener('change', updateModifiers);
    }

    // Event listener para mudança de nível
    document.getElementById('charLevel').addEventListener('change', function() {
        updateModifiers();
        updateHitDiceByLevel();
    });

    // Event listener para mudança de habilidade de conjuração
    document.getElementById('spellcastingAbility').addEventListener('change', updateSpellValues);

    // Event listener para classe do personagem
    document.getElementById('charClass').addEventListener('change', function() {
        updateHitDiceByClass();
        applyClassProficiencies();
    });

    // Função para atualizar dados de vida com base na classe
    function updateHitDiceByClass() {
        const charClass = document.getElementById('charClass').value;
        let hitDie = '1d8'; // Padrão

        switch(charClass) {
            case 'barbaro':
                hitDie = '1d12';
                break;
            case 'guerreiro': case 'paladino': case 'ranger':
                hitDie = '1d10';
                break;
            case 'bardo': case 'clerigo': case 'druida': case 'monge': case 'ladino': case 'bruxo':
                hitDie = '1d8';
                break;
            case 'feiticeiro': case 'mago':
                hitDie = '1d6';
                break;
        }

        // Atualiza dados de vida
        const level = parseInt(document.getElementById('charLevel').value) || 1;
        document.getElementById('hitDiceTotal').value = `${level}${hitDie.substring(1)}`;
        document.getElementById('hitDiceRemaining').value = `${level}${hitDie.substring(1)}`;
        
        // Atualiza pontos de vida máximos baseado no dado de vida e CON
        updateMaxHP();
    }

    // Função para atualizar dados de vida com base no nível
    function updateHitDiceByLevel() {
        const level = parseInt(document.getElementById('charLevel').value) || 1;
        const hitDiceTotal = document.getElementById('hitDiceTotal').value;
        
        if (hitDiceTotal) {
            const dieType = hitDiceTotal.match(/d\d+/)[0];
            document.getElementById('hitDiceTotal').value = `${level}${dieType}`;
            document.getElementById('hitDiceRemaining').value = `${level}${dieType}`;
        }
        
        // Atualiza pontos de vida máximos baseado no nível
        updateMaxHP();
    }

    // Função para atualizar pontos de vida máximos
    function updateMaxHP() {
        const charClass = document.getElementById('charClass').value;
        const level = parseInt(document.getElementById('charLevel').value) || 1;
        const conMod = calculateModifier(parseInt(document.getElementById('con').value) || 10);
        
        let baseHitPoints = 0;
        let hitDie = 8; // Padrão

        switch(charClass) {
            case 'barbaro':
                hitDie = 12;
                break;
            case 'guerreiro': case 'paladino': case 'ranger':
                hitDie = 10;
                break;
            case 'bardo': case 'clerigo': case 'druida': case 'monge': case 'ladino': case 'bruxo':
                hitDie = 8;
                break;
            case 'feiticeiro': case 'mago':
                hitDie = 6;
                break;
        }
        
        if (level === 1) {
            baseHitPoints = hitDie + conMod;
        } else {
            // No primeiro nível, PV máximos. Para outros níveis, média + modificador de CON
            baseHitPoints = hitDie + conMod;
            baseHitPoints += (level - 1) * (Math.floor(hitDie/2) + 1 + conMod);
        }
        
        document.getElementById('maxHp').value = baseHitPoints;
        document.getElementById('currentHp').value = baseHitPoints;
    }

    // Função para aplicar proficiências com base na classe
    function applyClassProficiencies() {
        // Primeiro, limpa todas as proficiências
        abilityScores.forEach(ability => {
            document.getElementById(`${ability}Save`).checked = false;
        });
        
        for (const skill in skillAbilityMap) {
            document.getElementById(skill).checked = false;
        }
        
        const charClass = document.getElementById('charClass').value;
        
        // Aplicar proficiências em testes de resistência por classe
        switch(charClass) {
            case 'barbaro':
                document.getElementById('strSave').checked = true;
                document.getElementById('conSave').checked = true;
                break;
            case 'bardo':
                document.getElementById('dexSave').checked = true;
                document.getElementById('chaSave').checked = true;
                break;
            case 'clerigo':
                document.getElementById('wisSave').checked = true;
                document.getElementById('chaSave').checked = true;
                break;
            case 'druida':
                document.getElementById('intSave').checked = true;
                document.getElementById('wisSave').checked = true;
                break;
            case 'guerreiro':
                document.getElementById('strSave').checked = true;
                document.getElementById('conSave').checked = true;
                break;
            case 'monge':
                document.getElementById('strSave').checked = true;
                document.getElementById('dexSave').checked = true;
                break;
            case 'paladino':
                document.getElementById('wisSave').checked = true;
                document.getElementById('chaSave').checked = true;
                break;
            case 'ranger':
                document.getElementById('strSave').checked = true;
                document.getElementById('dexSave').checked = true;
                break;
            case 'ladino':
                document.getElementById('dexSave').checked = true;
                document.getElementById('intSave').checked = true;
                break;
            case 'feiticeiro':
                document.getElementById('conSave').checked = true;
                document.getElementById('chaSave').checked = true;
                break;
            case 'bruxo':
                document.getElementById('wisSave').checked = true;
                document.getElementById('chaSave').checked = true;
                break;
            case 'mago':
                document.getElementById('intSave').checked = true;
                document.getElementById('wisSave').checked = true;
                break;
        }
        
        updateModifiers();
    }

    // Event listener para modificador de CON
    document.getElementById('con').addEventListener('change', function() {
        updateMaxHP();
    });

    // Adicionar novo ataque
    document.getElementById('addAttack').addEventListener('click', function() {
        const attacksTable = document.getElementById('attacksTableBody');
        const newRow = document.createElement('tr');
        
        newRow.innerHTML = `
            <td><input type="text" class="attack-name" placeholder="Arma"></td>
            <td><input type="text" class="attack-bonus" placeholder="+5"></td>
            <td><input type="text" class="attack-damage" placeholder="1d8+3 cortante"></td>
        `;
        
        attacksTable.appendChild(newRow);
    });

    // Adicionar nova magia
    document.querySelectorAll('.add-spell').forEach(button => {
        button.addEventListener('click', function() {
            const level = this.getAttribute('data-level');
            const spellsList = document.getElementById(`level${level}Spells`);
            const newSpell = document.createElement('div');
            
            newSpell.classList.add('spell-entry');
            newSpell.innerHTML = `
                <input type="checkbox" class="spell-prepared">
                <input type="text" class="spell-name" placeholder="Nome da magia">
            `;
            
            spellsList.appendChild(newSpell);
        });
    });

    // Rolagem de dados
    document.getElementById('rollDice').addEventListener('click', rollDice);
    
    // Event listeners para botões de dados rápidos
    document.querySelectorAll('.dice-btn').forEach(button => {
        button.addEventListener('click', function() {
            const diceType = this.getAttribute('data-dice');
            document.getElementById('diceExpression').value = `1${diceType}`;
            rollDice();
        });
    });

    // Função para rolar dados
    function rollDice() {
        const expression = document.getElementById('diceExpression').value;
        
        if (!expression) {
            return;
        }
        
        // Parse da expressão de dados (ex: 2d6+3)
        const diceRegex = /(\d+)d(\d+)([+-]\d+)?/;
        const match = expression.match(diceRegex);
        
        if (match) {
            const numberOfDice = parseInt(match[1]);
            const diceType = parseInt(match[2]);
            const modifier = match[3] ? parseInt(match[3]) : 0;
            
            let total = modifier;
            let rolls = [];
            
            for (let i = 0; i < numberOfDice; i++) {
                const roll = Math.floor(Math.random() * diceType) + 1;
                rolls.push(roll);
                total += roll;
            }
            
            document.getElementById('diceResult').textContent = `${total} (${rolls.join('+')})${modifier !== 0 ? modifier > 0 ? '+' + modifier : modifier : ''}`;
        } else {
            document.getElementById('diceResult').textContent = 'Formato inválido';
        }
    }

    // Salvar ficha
    document.getElementById('salvarFicha').addEventListener('click', function() {
        saveCharacter();
    });

    // Carregar ficha
    document.getElementById('carregarFicha').addEventListener('click', function() {
        // Abre diálogo para carregar personagem
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const characterData = JSON.parse(e.target.result);
                        loadCharacter(characterData);
                        alert("Ficha carregada com sucesso!");
                    } catch (error) {
                        alert("Erro ao carregar a ficha: " + error.message);
                    }
                };
                reader.readAsText(file);
            }
        });
        
        fileInput.click();
    });

    // Nova ficha
    document.getElementById('novaFicha').addEventListener('click', function() {
        if (confirm("Deseja criar uma nova ficha? Todos os dados não salvos serão perdidos.")) {
            resetCharacterSheet();
        }
    });

    // Imprimir ficha
    document.getElementById('imprimirFicha').addEventListener('click', function() {
        window.print();
    });

    // Função para coletar todos os dados da ficha
    function collectCharacterData() {
        const characterData = {
            // Informações básicas
            name: document.getElementById('charName').value,
            class: document.getElementById('charClass').value,
            level: document.getElementById('charLevel').value,
            race: document.getElementById('charRace').value,
            background: document.getElementById('charBackground').value,
            alignment: document.getElementById('charAlignment').value,
            playerName: document.getElementById('playerName').value,
            
            // Atributos
            abilityScores: {},
            savingThrows: {},
            skills: {},
            
            // Stats vitais
            armorClass: document.getElementById('armorClass').value,
            hitPoints: {
                max: document.getElementById('maxHp').value,
                current: document.getElementById('currentHp').value,
                temp: document.getElementById('tempHp').value
            },
            hitDice: {
                total: document.getElementById('hitDiceTotal').value,
                remaining: document.getElementById('hitDiceRemaining').value
            },
            deathSaves: {
                successes: [
                    document.getElementById('success1').checked,
                    document.getElementById('success2').checked,
                    document.getElementById('success3').checked
                ],
                failures: [
                    document.getElementById('failure1').checked,
                    document.getElementById('failure2').checked,
                    document.getElementById('failure3').checked
                ]
            },
            
            // Equipamento e moeda
            currency: {
                cp: document.getElementById('cp').value,
                sp: document.getElementById('sp').value,
                ep: document.getElementById('ep').value,
                gp: document.getElementById('gp').value,
                pp: document.getElementById('pp').value
            },
            equipment: document.getElementById('equipment').value,
            
            // Características e personalidade
            features: document.getElementById('features').value,
            personality: {
                traits: document.getElementById('personalityTraits').value,
                ideals: document.getElementById('ideals').value,
                bonds: document.getElementById('bonds').value,
                flaws: document.getElementById('flaws').value
            },
            
            // Notas
            notes: document.getElementById('characterNotes').value,
            
            // Inspiração
            inspiration: document.getElementById('inspiration').checked,
            
            // Velocidade
            speed: document.getElementById('speed').value,
            
            // Ataques
            attacks: [],
            
            // Magia
            spellcasting: {
                ability: document.getElementById('spellcastingAbility').value,
                slots: {}
            },
            spells: {
                cantrips: [],
                level1: [],
                level2: []
            }
        };
        
        // Coletar valores dos atributos
        abilityScores.forEach(ability => {
            characterData.abilityScores[ability] = document.getElementById(ability).value;
            characterData.savingThrows[ability] = document.getElementById(`${ability}Save`).checked;
        });
        
        // Coletar valores das perícias
        for (const skill in skillAbilityMap) {
            characterData.skills[skill] = document.getElementById(skill).checked;
        }
        
        // Coletar ataques
        const attackRows = document.querySelectorAll('#attacksTableBody tr');
        attackRows.forEach(row => {
            const nameInput = row.querySelector('.attack-name');
            const bonusInput = row.querySelector('.attack-bonus');
            const damageInput = row.querySelector('.attack-damage');
            
            if (nameInput && nameInput.value) {
                characterData.attacks.push({
                    name: nameInput.value,
                    bonus: bonusInput ? bonusInput.value : '',
                    damage: damageInput ? damageInput.value : ''
                });
            }
        });
        
        // Coletar slots de magia
        for (let i = 1; i <= 9; i++) {
            characterData.spellcasting.slots[`level${i}`] = {
                total: document.getElementById(`level${i}Total`).value,
                used: document.getElementById(`level${i}Used`).value
            };
        }
        
        // Coletar truques
        const cantripInputs = document.querySelectorAll('#cantrips input');
        cantripInputs.forEach(input => {
            if (input.value) {
                characterData.spells.cantrips.push(input.value);
            }
        });
        
        // Coletar magias de nível 1
        const level1SpellEntries = document.querySelectorAll('#level1Spells .spell-entry');
        level1SpellEntries.forEach(entry => {
            const nameInput = entry.querySelector('.spell-name');
            const preparedInput = entry.querySelector('.spell-prepared');
            
            if (nameInput && nameInput.value) {
                characterData.spells.level1.push({
                    name: nameInput.value,
                    prepared: preparedInput ? preparedInput.checked : false
                });
            }
        });
        
        // Coletar magias de nível 2
        const level2SpellEntries = document.querySelectorAll('#level2Spells .spell-entry');
        level2SpellEntries.forEach(entry => {
            const nameInput = entry.querySelector('.spell-name');
            const preparedInput = entry.querySelector('.spell-prepared');
            
            if (nameInput && nameInput.value) {
                characterData.spells.level2.push({
                    name: nameInput.value,
                    prepared: preparedInput ? preparedInput.checked : false
                });
            }
        });
        
        return characterData;
    }

    // Função para salvar personagem
    function saveCharacter() {
        const characterData = collectCharacterData();
        const characterName = characterData.name || 'personagem';
        
        // Duas opções:
        // 1. Salvar no localStorage
        localStorage.setItem(`character_${characterName}`, JSON.stringify(characterData));
        
        // 2. Salvar como arquivo JSON para download
        const dataStr = JSON.stringify(characterData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = `${characterName.replace(/\s+/g, '_')}.json`;
        downloadLink.click();
        
        // 3. Opcionalmente, enviar para o servidor via fetch
        fetch('../backend/ficha.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: dataStr
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Ficha salva com sucesso no servidor!');
            } else {
                console.error('Erro ao salvar no servidor:', data.error);
            }
        })
        .catch(error => {
            console.error('Erro ao enviar dados para o servidor:', error);
        });
    }

    // Função para carregar personagem
    function loadCharacter(characterData) {
        // Informações básicas
        document.getElementById('charName').value = characterData.name || '';
        document.getElementById('charClass').value = characterData.class || '';
        document.getElementById('charLevel').value = characterData.level || 1;
        document.getElementById('charRace').value = characterData.race || '';
        document.getElementById('charBackground').value = characterData.background || '';
        document.getElementById('charAlignment').value = characterData.alignment || '';
        document.getElementById('playerName').value = characterData.playerName || '';
        
        // Atributos
        for (const ability in characterData.abilityScores) {
            if (document.getElementById(ability)) {
                document.getElementById(ability).value = characterData.abilityScores[ability];
            }
        }
        
        // Testes de resistência
        for (const save in characterData.savingThrows) {
            if (document.getElementById(`${save}Save`)) {
                document.getElementById(`${save}Save`).checked = characterData.savingThrows[save];
            }
        }
        
        // Perícias
        for (const skill in characterData.skills) {
            if (document.getElementById(skill)) {
                document.getElementById(skill).checked = characterData.skills[skill];
            }
        }
        
        // Stats vitais
        document.getElementById('armorClass').value = characterData.armorClass || 10;
        document.getElementById('maxHp').value = characterData.hitPoints?.max || 10;
        document.getElementById('currentHp').value = characterData.hitPoints?.current || 10;
        document.getElementById('tempHp').value = characterData.hitPoints?.temp || 0;
        document.getElementById('hitDiceTotal').value = characterData.hitDice?.total || '1d8';
        document.getElementById('hitDiceRemaining').value = characterData.hitDice?.remaining || '1d8';
        
        // Death saves
        if (characterData.deathSaves) {
            document.getElementById('success1').checked = characterData.deathSaves.successes[0] || false;
            document.getElementById('success2').checked = characterData.deathSaves.successes[1] || false;
            document.getElementById('success3').checked = characterData.deathSaves.successes[2] || false;
            document.getElementById('failure1').checked = characterData.deathSaves.failures[0] || false;
            document.getElementById('failure2').checked = characterData.deathSaves.failures[1] || false;
            document.getElementById('failure3').checked = characterData.deathSaves.failures[2] || false;
        }
        
        // Moeda
        if (characterData.currency) {
            document.getElementById('cp').value = characterData.currency.cp || 0;
            document.getElementById('sp').value = characterData.currency.sp || 0;
            document.getElementById('ep').value = characterData.currency.ep || 0;
            document.getElementById('gp').value = characterData.currency.gp || 0;
            document.getElementById('pp').value = characterData.currency.pp || 0;
        }
        
        // Equipamento e características
        document.getElementById('equipment').value = characterData.equipment || '';
        document.getElementById('features').value = characterData.features || '';
        
        // Personalidade
        if (characterData.personality) {
            document.getElementById('personalityTraits').value = characterData.personality.traits || '';
            document.getElementById('ideals').value = characterData.personality.ideals || '';
            document.getElementById('bonds').value = characterData.personality.bonds || '';
            document.getElementById('flaws').value = characterData.personality.flaws || '';
        }
        
        // Notas
        document.getElementById('characterNotes').value = characterData.notes || '';
        
        // Inspiração e velocidade
        document.getElementById('inspiration').checked = characterData.inspiration || false;
        document.getElementById('speed').value = characterData.speed || 9;
        
        // Ataques
        const attacksTableBody = document.getElementById('attacksTableBody');
        attacksTableBody.innerHTML = '';
        
        if (characterData.attacks && characterData.attacks.length > 0) {
            characterData.attacks.forEach(attack => {
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td><input type="text" class="attack-name" value="${attack.name || ''}" placeholder="Arma"></td>
                    <td><input type="text" class="attack-bonus" value="${attack.bonus || ''}" placeholder="+5"></td>
                    <td><input type="text" class="attack-damage" value="${attack.damage || ''}" placeholder="1d8+3 cortante"></td>
                `;
                attacksTableBody.appendChild(newRow);
            });
        } else {
            // Adiciona linha vazia se não houver ataques
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="text" class="attack-name" placeholder="Arma"></td>
                <td><input type="text" class="attack-bonus" placeholder="+5"></td>
                <td><input type="text" class="attack-damage" placeholder="1d8+3 cortante"></td>
            `;
            attacksTableBody.appendChild(newRow);
        }
        
        // Magia
        if (characterData.spellcasting) {
            document.getElementById('spellcastingAbility').value = characterData.spellcasting.ability || 'int';
            
            // Slots de magia
            for (let i = 1; i <= 9; i++) {
                if (characterData.spellcasting.slots[`level${i}`]) {
                    document.getElementById(`level${i}Total`).value = characterData.spellcasting.slots[`level${i}`].total || 0;
                    document.getElementById(`level${i}Used`).value = characterData.spellcasting.slots[`level${i}`].used || 0;
                }
            }
        }
        
        // Truques
        const cantripInputs = document.querySelectorAll('#cantrips input');
        if (characterData.spells && characterData.spells.cantrips) {
            characterData.spells.cantrips.forEach((cantrip, index) => {
                if (index < cantripInputs.length) {
                    cantripInputs[index].value = cantrip;
                }
            });
        }
        
        // Magias de nível 1
        if (characterData.spells && characterData.spells.level1) {
            const level1Container = document.getElementById('level1Spells');
            level1Container.innerHTML = '';
            
            characterData.spells.level1.forEach(spell => {
                const spellEntry = document.createElement('div');
                spellEntry.classList.add('spell-entry');
                spellEntry.innerHTML = `
                    <input type="checkbox" class="spell-prepared" ${spell.prepared ? 'checked' : ''}>
                    <input type="text" class="spell-name" value="${spell.name}" placeholder="Nome da magia">
                `;
                level1Container.appendChild(spellEntry);
            });
        }
        
        // Magias de nível 2
        if (characterData.spells && characterData.spells.level2) {
            const level2Container = document.getElementById('level2Spells');
            level2Container.innerHTML = '';
            
            characterData.spells.level2.forEach(spell => {
                const spellEntry = document.createElement('div');
                spellEntry.classList.add('spell-entry');
                spellEntry.innerHTML = `
                    <input type="checkbox" class="spell-prepared" ${spell.prepared ? 'checked' : ''}>
                    <input type="text" class="spell-name" value="${spell.name}" placeholder="Nome da magia">
                `;
                level2Container.appendChild(spellEntry);
            });
        }
        
        // Atualiza todos os modificadores e valores derivados
        updateModifiers();
    }

    // Função para resetar a ficha
    function resetCharacterSheet() {
        // Redefine informações básicas
        document.getElementById('charName').value = '';
        document.getElementById('charClass').value = '';
        document.getElementById('charLevel').value = 1;
        document.getElementById('charRace').value = '';
        document.getElementById('charBackground').value = '';
        document.getElementById('charAlignment').value = '';
        document.getElementById('playerName').value = '';
        
        // Redefine atributos
        abilityScores.forEach(ability => {
            document.getElementById(ability).value = 10;
        });
        
        // Redefine testes de resistência e perícias
        abilityScores.forEach(ability => {
            document.getElementById(`${ability}Save`).checked = false;
        });
        
        for (const skill in skillAbilityMap) {
            document.getElementById(skill).checked = false;
        }
        
        // Redefine stats vitais
        document.getElementById('armorClass').value = 10;
        document.getElementById('maxHp').value = 10;
        document.getElementById('currentHp').value = 10;
        document.getElementById('tempHp').value = 0;
        document.getElementById('hitDiceTotal').value = '1d8';
        document.getElementById('hitDiceRemaining').value = '1d8';
        
        // Redefine death saves
        document.getElementById('success1').checked = false;
        document.getElementById('success2').checked = false;
        document.getElementById('success3').checked = false;
        document.getElementById('failure1').checked = false;
        document.getElementById('failure2').checked = false;
        document.getElementById('failure3').checked = false;
        
        // Redefine moeda
        document.getElementById('cp').value = 0;
        document.getElementById('sp').value = 0;
        document.getElementById('ep').value = 0;
        document.getElementById('gp').value = 0;
        document.getElementById('pp').value = 0;
        
        // Limpa equipamento, características e personalidade
        document.getElementById('equipment').value = '';
        document.getElementById('features').value = '';
        document.getElementById('personalityTraits').value = '';
        document.getElementById('ideals').value = '';
        document.getElementById('bonds').value = '';
        document.getElementById('flaws').value = '';
        document.getElementById('characterNotes').value = '';
        
        // Redefine inspiração e velocidade
        document.getElementById('inspiration').checked = false;
        document.getElementById('speed').value = 9;
        
        // Limpa ataques
        document.getElementById('attacksTableBody').innerHTML = `
            <tr>
                <td><input type="text" class="attack-name" placeholder="Arma"></td>
                <td><input type="text" class="attack-bonus" placeholder="+5"></td>
                <td><input type="text" class="attack-damage" placeholder="1d8+3 cortante"></td>
            </tr>
        `;
        
        // Redefine valores de magia
        document.getElementById('spellcastingAbility').value = 'int';
        
        // Limpa slots de magia
        for (let i = 1; i <= 9; i++) {
            document.getElementById(`level${i}Total`).value = 0;
            document.getElementById(`level${i}Used`).value = 0;
        }
        
        // Limpa truques
        const cantripInputs = document.querySelectorAll('#cantrips input');
        cantripInputs.forEach(input => {
            input.value = '';
        });
        
        // Limpa magias
        document.getElementById('level1Spells').innerHTML = `
            <div class="spell-entry">
                <input type="checkbox" class="spell-prepared">
                <input type="text" class="spell-name" placeholder="Nome da magia">
            </div>
        `;
        
        document.getElementById('level2Spells').innerHTML = `
            <div class="spell-entry">
                <input type="checkbox" class="spell-prepared">
                <input type="text" class="spell-name" placeholder="Nome da magia">
            </div>
        `;
        
        // Atualiza todos os modificadores
        updateModifiers();
    }

    // Inicializa a ficha
    updateModifiers();
};