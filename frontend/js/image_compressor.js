// Utilitário para compressão de imagens no frontend
class ImageCompressor {
    
    /**
     * Comprime uma imagem mantendo qualidade aceitável
     * @param {File} file - Arquivo de imagem
     * @param {number} maxWidth - Largura máxima (default: 800)
     * @param {number} maxHeight - Altura máxima (default: 600)
     * @param {number} quality - Qualidade JPEG (0.1 a 1.0, default: 0.8)
     * @returns {Promise<string>} - Base64 comprimido
     */
    static async compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
        return new Promise((resolve, reject) => {
            // Verificar se é imagem
            if (!file.type.startsWith('image/')) {
                reject(new Error('Arquivo não é uma imagem'));
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = function() {
                // Calcular novas dimensões mantendo proporção
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                // Configurar canvas
                canvas.width = width;
                canvas.height = height;

                // Desenhar imagem redimensionada
                ctx.drawImage(img, 0, 0, width, height);

                // Converter para base64 com compressão
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                
                // Remover prefixo data:image/jpeg;base64,
                const base64Data = compressedBase64.split(',')[1];
                
                console.log(`Imagem comprimida: ${img.width}x${img.height} -> ${width}x${height}`);
                console.log(`Tamanho estimado: ${Math.round(base64Data.length * 0.75 / 1024)} KB`);
                
                resolve(base64Data);
            };

            img.onerror = function() {
                reject(new Error('Erro ao carregar imagem'));
            };

            // Carregar imagem
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
            };
            reader.onerror = function() {
                reject(new Error('Erro ao ler arquivo'));
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Valida arquivo de imagem
     * @param {File} file - Arquivo a validar
     * @param {number} maxSizeMB - Tamanho máximo em MB (default: 5)
     * @returns {Object} - {valid: boolean, error: string}
     */
    static validateImage(file, maxSizeMB = 5) {
        // Verificar tipo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Tipo de arquivo não suportado. Use JPEG, PNG, GIF ou WebP.'
            };
        }

        // Verificar tamanho
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return {
                valid: false,
                error: `Arquivo muito grande. Máximo ${maxSizeMB}MB.`
            };
        }

        return { valid: true, error: null };
    }

    /**
     * Estima o tamanho do base64 resultante
     * @param {File} file - Arquivo de imagem
     * @returns {number} - Tamanho estimado em KB
     */
    static estimateBase64Size(file) {
        // Base64 aumenta ~33% o tamanho
        return Math.round(file.size * 1.33 / 1024);
    }
}
