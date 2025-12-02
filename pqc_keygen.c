#include <emscripten.h>
#include <oqs/oqs.h>
#include <string.h>
#include <stdlib.h>

// Memory to store generated keys
static uint8_t *public_key_buffer = NULL;
static uint8_t *secret_key_buffer = NULL;
static size_t public_key_len = 0;
static size_t secret_key_len = 0;

/**
 * Generate a key pair using Kyber1024 (Post-Quantum KEM)
 * Returns: 1 on success, 0 on failure
 */
EMSCRIPTEN_KEEPALIVE
int generate_keypair() {
    // Clean up any previous keys
    if (public_key_buffer) free(public_key_buffer);
    if (secret_key_buffer) free(secret_key_buffer);
    
    // Initialize Kyber1024 (strongest variant)
    OQS_KEM *kem = OQS_KEM_new(OQS_KEM_alg_kyber_1024);
    if (kem == NULL) {
        return 0;
    }
    
    // Allocate memory for keys
    public_key_len = kem->length_public_key;
    secret_key_len = kem->length_secret_key;
    
    public_key_buffer = (uint8_t *)malloc(public_key_len);
    secret_key_buffer = (uint8_t *)malloc(secret_key_len);
    
    if (public_key_buffer == NULL || secret_key_buffer == NULL) {
        OQS_KEM_free(kem);
        return 0;
    }
    
    // Generate the keypair
    OQS_STATUS status = OQS_KEM_keypair(kem, public_key_buffer, secret_key_buffer);
    
    OQS_KEM_free(kem);
    
    return (status == OQS_SUCCESS) ? 1 : 0;
}

/**
 * Get pointer to public key (for JavaScript to read)
 */
EMSCRIPTEN_KEEPALIVE
uint8_t* get_public_key() {
    return public_key_buffer;
}

/**
 * Get pointer to secret key (for JavaScript to read)
 */
EMSCRIPTEN_KEEPALIVE
uint8_t* get_secret_key() {
    return secret_key_buffer;
}

/**
 * Get public key length
 */
EMSCRIPTEN_KEEPALIVE
size_t get_public_key_length() {
    return public_key_len;
}

/**
 * Get secret key length
 */
EMSCRIPTEN_KEEPALIVE
size_t get_secret_key_length() {
    return secret_key_len;
}

/**
 * Clean up memory
 */
EMSCRIPTEN_KEEPALIVE
void cleanup() {
    if (public_key_buffer) {
        free(public_key_buffer);
        public_key_buffer = NULL;
    }
    if (secret_key_buffer) {
        free(secret_key_buffer);
        secret_key_buffer = NULL;
    }
    public_key_len = 0;
    secret_key_len = 0;
}

/**
 * Encapsulate (encrypt) a shared secret using public key
 */
EMSCRIPTEN_KEEPALIVE
int encapsulate(uint8_t *public_key, uint8_t *ciphertext, uint8_t *shared_secret) {
    OQS_KEM *kem = OQS_KEM_new(OQS_KEM_alg_kyber_1024);
    if (kem == NULL) return 0;
    
    OQS_STATUS status = OQS_KEM_encaps(kem, ciphertext, shared_secret, public_key);
    
    OQS_KEM_free(kem);
    return (status == OQS_SUCCESS) ? 1 : 0;
}

/**
 * Decapsulate (decrypt) to retrieve shared secret
 */
EMSCRIPTEN_KEEPALIVE
int decapsulate(uint8_t *secret_key, uint8_t *ciphertext, uint8_t *shared_secret) {
    OQS_KEM *kem = OQS_KEM_new(OQS_KEM_alg_kyber_1024);
    if (kem == NULL) return 0;
    
    OQS_STATUS status = OQS_KEM_decaps(kem, shared_secret, ciphertext, secret_key);
    
    OQS_KEM_free(kem);
    return (status == OQS_SUCCESS) ? 1 : 0;
}