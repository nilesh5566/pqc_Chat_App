#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <oqs/oqs.h>

// Base64 encoding function
static const char base64_chars[] = 
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

char* base64_encode(const unsigned char* input, size_t length) {
    size_t output_length = 4 * ((length + 2) / 3);
    char* encoded = malloc(output_length + 1);
    if (!encoded) return NULL;

    size_t i, j;
    for (i = 0, j = 0; i < length;) {
        uint32_t octet_a = i < length ? input[i++] : 0;
        uint32_t octet_b = i < length ? input[i++] : 0;
        uint32_t octet_c = i < length ? input[i++] : 0;
        uint32_t triple = (octet_a << 16) + (octet_b << 8) + octet_c;

        encoded[j++] = base64_chars[(triple >> 18) & 0x3F];
        encoded[j++] = base64_chars[(triple >> 12) & 0x3F];
        encoded[j++] = base64_chars[(triple >> 6) & 0x3F];
        encoded[j++] = base64_chars[triple & 0x3F];
    }

    // Add padding
    for (i = 0; i < (3 - length % 3) % 3; i++) {
        encoded[output_length - 1 - i] = '=';
    }

    encoded[output_length] = '\0';
    return encoded;
}

int main(int argc, char* argv[]) {
    // Use Kyber-1024 for post-quantum KEM (highest security level)
    const char* kem_name = "Kyber1024";
    
    if (argc > 1) {
        printf("Usage: %s\n", argv[0]);
        printf("Generates a Kyber-1024 key pair for post-quantum cryptography\n");
        return 0;
    }

    printf("╔════════════════════════════════════════════════════════════╗\n");
    printf("║     Post-Quantum Cryptography Key Generation Tool          ║\n");
    printf("║     Algorithm: %s                                    ║\n", kem_name);
    printf("╚════════════════════════════════════════════════════════════╝\n\n");

    // Initialize OQS KEM
    OQS_KEM* kem = OQS_KEM_new(kem_name);
    if (kem == NULL) {
        fprintf(stderr, "❌ Error: KEM algorithm '%s' not enabled!\n", kem_name);
        fprintf(stderr, "Available KEMs:\n");
        for (size_t i = 0; i < OQS_KEM_alg_count(); i++) {
            printf("  - %s\n", OQS_KEM_alg_identifier(i));
        }
        return 1;
    }

    printf("✅ KEM initialized: %s\n", kem_name);
    printf("   Public key size:  %zu bytes\n", kem->length_public_key);
    printf("   Private key size: %zu bytes\n", kem->length_secret_key);
    printf("   Ciphertext size:  %zu bytes\n", kem->length_ciphertext);
    printf("   Shared secret:    %zu bytes\n\n", kem->length_shared_secret);

    // Allocate memory for keys
    uint8_t* public_key = malloc(kem->length_public_key);
    uint8_t* secret_key = malloc(kem->length_secret_key);

    if (!public_key || !secret_key) {
        fprintf(stderr, "❌ Memory allocation failed!\n");
        OQS_KEM_free(kem);
        return 1;
    }

    // Generate key pair
    printf("🔑 Generating key pair...\n");
    if (OQS_KEM_keypair(kem, public_key, secret_key) != OQS_SUCCESS) {
        fprintf(stderr, "❌ Key generation failed!\n");
        free(public_key);
        free(secret_key);
        OQS_KEM_free(kem);
        return 1;
    }

    printf("✅ Key pair generated successfully!\n\n");

    // Encode keys to Base64
    char* public_key_b64 = base64_encode(public_key, kem->length_public_key);
    char* secret_key_b64 = base64_encode(secret_key, kem->length_secret_key);

    if (!public_key_b64 || !secret_key_b64) {
        fprintf(stderr, "❌ Base64 encoding failed!\n");
        free(public_key);
        free(secret_key);
        OQS_KEM_free(kem);
        return 1;
    }

    // Save to files
    FILE* pub_file = fopen("public_key.txt", "w");
    FILE* priv_file = fopen("private_key.txt", "w");

    if (!pub_file || !priv_file) {
        fprintf(stderr, "❌ Failed to create key files!\n");
        free(public_key);
        free(secret_key);
        free(public_key_b64);
        free(secret_key_b64);
        OQS_KEM_free(kem);
        return 1;
    }

    fprintf(pub_file, "%s", public_key_b64);
    fprintf(priv_file, "%s", secret_key_b64);

    fclose(pub_file);
    fclose(priv_file);

    printf("📁 Keys saved to files:\n");
    printf("   Public key:  public_key.txt\n");
    printf("   Private key: private_key.txt\n\n");

    printf("📋 Public Key (Base64):\n");
    printf("════════════════════════════════════════════════════════════\n");
    printf("%s\n", public_key_b64);
    printf("════════════════════════════════════════════════════════════\n\n");

    printf("🔒 Private Key (Base64) - KEEP THIS SECRET:\n");
    printf("════════════════════════════════════════════════════════════\n");
    printf("%s\n", secret_key_b64);
    printf("════════════════════════════════════════════════════════════\n\n");

    printf("⚠️  SECURITY NOTICE:\n");
    printf("   • Store the private key securely\n");
    printf("   • Never share your private key\n");
    printf("   • Use the public key during registration\n");
    printf("   • Private key stays on YOUR device only\n\n");

    // Cleanup
    OQS_MEM_secure_free(secret_key, kem->length_secret_key);
    free(public_key);
    free(public_key_b64);
    free(secret_key_b64);
    OQS_KEM_free(kem);

    printf("✅ Key generation completed successfully!\n");
    return 0;
}