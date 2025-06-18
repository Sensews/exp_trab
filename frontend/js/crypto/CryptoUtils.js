/**
 * CryptoUtils - Utilitários auxiliares para criptografia
 */

class CryptoUtils {
    /**
     * Valida se os dados estão no formato criptografado esperado
     */
    static isEncryptedData(data) {
        return data && 
               typeof data === 'object' && 
               data.encryptedMessage && 
               data.encryptedAesKey && 
               data.aesIv;
    }
    
    /**
     * Gera hash SHA-256 de uma string
     */
    static async generateHash(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    /**
     * Gera string aleatória para uso como salt
     */
    static generateRandomString(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const randomArray = new Uint8Array(length);
        crypto.getRandomValues(randomArray);
        
        for (let i = 0; i < length; i++) {
            result += chars[randomArray[i] % chars.length];
        }
        
        return result;
    }
    
    /**
     * Validação de força de senha
     */
    static validatePasswordStrength(password) {
        let strength = 0;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };
        
        Object.values(checks).forEach(check => {
            if (check) strength++;
        });
        
        return {
            score: strength,
            checks: checks,
            level: strength >= 5 ? 'Muito forte' :
                   strength >= 4 ? 'Forte' :
                   strength >= 3 ? 'Moderada' :
                   strength >= 2 ? 'Fraca' : 'Muito fraca'
        };
    }
    
    /**
     * Sanitiza dados para log (remove informações sensíveis)
     */
    static sanitizeForLog(data) {
        if (typeof data !== 'object' || data === null) {
            return data;
        }
        
        const sensitiveFields = ['senha', 'password', 'token', 'key', 'hash'];
        const sanitized = { ...data };
        
        Object.keys(sanitized).forEach(key => {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                sanitized[key] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }
}

// Exportar para uso global
window.CryptoUtils = CryptoUtils;
