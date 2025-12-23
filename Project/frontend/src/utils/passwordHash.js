/**
 * Simple hash function for password (using Web Crypto API)
 * In production, consider using bcrypt or similar library
 */
export async function hashPassword(password) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        console.error('Error hashing password:', error);
        // Fallback: return plain password (not recommended for production)
        return password;
    }
}

/**
 * Verify password against hashed password
 */
export async function verifyPassword(password, hashedPassword) {
    try {
        const hashed = await hashPassword(password);
        return hashed === hashedPassword;
    } catch (error) {
        console.error('Error verifying password:', error);
        return password === hashedPassword;
    }
}

/**
 * Check if password is hashed (basic check)
 */
export function isPasswordHashed(password) {
    // SHA-256 produces a 64-character hex string
    return /^[a-f0-9]{64}$/i.test(password);
}
