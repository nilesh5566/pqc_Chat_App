# Implementation Notes & Security Architecture

## 🔐 Cryptographic Implementation

### Post-Quantum Cryptography Stack

```
Message Flow:
┌─────────────┐                              ┌─────────────┐
│   Sender    │                              │  Receiver   │
│             │                              │             │
│ 1. Type     │                              │ 6. Receive  │
│    Message  │                              │    Encrypted│
│             │                              │    Message  │
│ 2. Generate │                              │             │
│    AES Key  │                              │ 7. Fetch    │
│             │                              │    Private  │
│ 3. Encrypt  │                              │    Key      │
│    with AES │                              │             │
│             │                              │ 8. Decap-   │
│ 4. Fetch    │                              │    sulate   │
│    Receiver │                              │    Session  │
│    PQC Key  │                              │    Key      │
│             │                              │             │
│ 5. Encap-   │                              │ 9. Decrypt  │
│    sulate   │────────Encrypted Data───────>│    Message  │
│    Session  │                              │             │
│    Key      │                              │10. Display  │
└─────────────┘                              └─────────────┘
```

### Encryption Process (Detailed)

#### Client-Side (Sender)

1. **Message Composition**
   ```javascript
   const plaintext = "Hello, World!";
   ```

2. **Session Key Generation**
   ```javascript
   // Generate random AES-256 key
   const sessionKey = await crypto.subtle.generateKey(
     { name: 'AES-GCM', length: 256 },
     true,
     ['encrypt', 'decrypt']
   );
   ```

3. **Message Encryption (AES-GCM)**
   ```javascript
   const iv = crypto.getRandomValues(new Uint8Array(12));
   const encrypted = await crypto.subtle.encrypt(
     { name: 'AES-GCM', iv, tagLength: 128 },
     sessionKey,
     textEncoder.encode(plaintext)
   );
   // Output: { ciphertext, authTag }
   ```

4. **Fetch Receiver's Public Key**
   ```javascript
   const response = await fetch(`/api/users/${receiverId}/public-key`);
   const { publicKey } = await response.json();
   ```

5. **Key Encapsulation (Kyber-1024)**
   ```javascript
   // In production: Use liboqs WASM
   const encapsulatedKey = await kyber.encapsulate(sessionKey, publicKey);
   ```

6. **Send to Server**
   ```javascript
   socket.emit('send_message', {
     senderId,
     receiverId,
     encryptedContent: base64(ciphertext),
     encapsulatedKey: base64(encapsulatedKey),
     iv: base64(iv),
     authTag: base64(authTag)
   });
   ```

#### Server-Side (Storage)

```javascript
// Store in MongoDB - Server CANNOT decrypt
const message = await Message.create({
  sender: senderId,
  receiver: receiverId,
  encryptedContent,  // Base64 encrypted data
  encapsulatedKey,   // Base64 encrypted session key
  iv,                // Base64 initialization vector
  authTag,           // Base64 authentication tag
  timestamp: new Date()
});
```

#### Client-Side (Receiver)

1. **Receive Encrypted Message**
   ```javascript
   socket.on('receive_message', async (data) => {
     const { message } = data;
   });
   ```

2. **Fetch Private Key from IndexedDB**
   ```javascript
   const privateKey = await keyStorage.getPrivateKey(userId);
   ```

3. **Decapsulate Session Key**
   ```javascript
   const sessionKey = await kyber.decapsulate(
     message.encapsulatedKey,
     privateKey
   );
   ```

4. **Decrypt Message**
   ```javascript
   const decrypted = await crypto.subtle.decrypt(
     { name: 'AES-GCM', iv, tagLength: 128 },
     sessionKey,
     combinedCiphertext  // ciphertext + authTag
   );
   
   const plaintext = textDecoder.decode(decrypted);
   ```

## 🛡️ Security Features

### 1. End-to-End Encryption

**What it means:**
- Only sender and receiver can read messages
- Server stores encrypted blobs
- Even database admin cannot decrypt

**Implementation:**
- AES-256-GCM for message encryption
- Unique session key per message
- Keys never transmitted in plaintext

### 2. Post-Quantum Security

**Threat Model:**
- Future quantum computers could break RSA/ECC
- Shor's algorithm can factor large numbers
- Current encrypted data vulnerable to "harvest now, decrypt later"

**Solution:**
- Kyber-1024 KEM (NIST standardized)
- Based on lattice cryptography (M-LWE)
- Resistant to quantum attacks

**Key Sizes:**
```
RSA-2048:       Public Key  = 256 bytes
                Private Key = 256 bytes

Kyber-1024:     Public Key  = 1,568 bytes (+513%)
                Private Key = 3,168 bytes (+1,137%)
                
Trade-off: Larger keys for quantum resistance
```

### 3. Forward Secrecy

**What it provides:**
- Compromise of one session doesn't affect others
- Each message has unique encryption key
- Old messages stay secure even if current key compromised

**Implementation:**
```javascript
// New session key for EVERY message
for (const message of messages) {
  const sessionKey = await generateSessionKey();
  await encryptMessage(message, sessionKey);
  await encapsulateKey(sessionKey, receiverPublicKey);
}
```

### 4. Side-Channel Attack Mitigation

**Potential Attacks:**

1. **Timing Attacks**
   - Attacker measures encryption/decryption time
   - Infers information about keys
   
   **Mitigation:**
   - Use constant-time operations
   - Web Crypto API provides this by default

2. **Memory Attacks**
   - Keys stored in JavaScript heap
   - Vulnerable to memory dumps
   
   **Mitigation:**
   - Store private keys in IndexedDB (isolated storage)
   - Never store in localStorage (accessible to XSS)
   - Clear sensitive data after use
   
   ```javascript
   // Bad
   localStorage.setItem('privateKey', key);  // XSS vulnerable
   
   // Good
   await indexedDB.put('keys', key);  // Isolated storage
   ```

3. **XSS (Cross-Site Scripting)**
   - Malicious script steals keys from memory
   
   **Mitigation:**
   - CSP (Content Security Policy) headers
   - Input sanitization
   - HttpOnly cookies for session tokens
   - Never use `eval()` or `innerHTML`

### 5. Authentication Security

**Password Handling:**
```javascript
// Server-side (backend)
const bcrypt = require('bcryptjs');

// Hash with salt (round=10)
const hash = await bcrypt.hash(password, 10);

// Compare
const isValid = await bcrypt.compare(password, hash);
```

**JWT Tokens:**
```javascript
// Generate
const token = jwt.sign({ userId }, JWT_SECRET, {
  expiresIn: '7d'
});

// Verify
const decoded = jwt.verify(token, JWT_SECRET);
```

**Best Practices:**
- Minimum password length: 6 characters
- Hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Tokens stored in memory, not localStorage

## 🔧 Performance Optimizations

### 1. Encryption Performance

**AES-GCM (Hardware Accelerated):**
- Modern CPUs have AES-NI instructions
- ~10 GB/s throughput on typical hardware
- Negligible overhead for text messages

**Kyber-1024 Performance:**
- Key generation: ~1ms
- Encapsulation: ~1ms
- Decapsulation: ~1.5ms

Total overhead: <5ms per message

### 2. Database Optimization

**Indexes:**
```javascript
// Efficient message queries
db.messages.createIndex({ 
  sender: 1, 
  receiver: 1, 
  createdAt: -1 
});

// Efficient unread count
db.messages.createIndex({ 
  receiver: 1, 
  read: 1 
});
```

**Query Optimization:**
```javascript
// Pagination to limit results
const messages = await Message.find(query)
  .sort({ createdAt: -1 })
  .limit(50);  // Only fetch 50 messages
```

### 3. WebSocket Optimization

**Connection Pooling:**
- Single WebSocket per user
- Automatic reconnection
- Heartbeat to detect disconnects

**Message Batching:**
```javascript
// Group multiple updates
const updates = [];
updates.push(messageUpdate1);
updates.push(messageUpdate2);
socket.emit('batch_update', updates);
```

## 🚨 Known Limitations & Future Work

### Current Limitations

1. **Simulated PQC in Browser**
   - `encryption.js` uses placeholder KEM
   - Real Kyber requires WebAssembly
   
   **Fix Required:**
   ```javascript
   // TODO: Replace with liboqs WASM
   import * as oqs from 'liboqs-js';
   const kem = new oqs.KeyEncapsulation('Kyber1024');
   ```

2. **No Key Rotation**
   - Users keep same key pair forever
   - Compromised key affects all messages
   
   **Future Work:**
   - Implement periodic key rotation
   - Use key versioning
   - Support multiple active keys

3. **No Multi-Device Support**
   - Key pair tied to single device
   - Cannot sync messages across devices
   
   **Future Work:**
   - Implement device management
   - Use key escrow or backup codes
   - Support key export/import

4. **Limited Metadata Protection**
   - Server knows who messages whom
   - Timestamps visible
   
   **Future Work:**
   - Implement mix networks
   - Add dummy traffic
   - Use onion routing

### Security Assumptions

**Trusted:**
- Client device is secure
- IndexedDB is not compromised
- Web Crypto API is correctly implemented
- Server is honest-but-curious (doesn't actively attack)

**Threats Considered:**
- Quantum computer attacks
- Passive network eavesdropping
- Server database compromise
- Man-in-the-middle attacks

**Threats NOT Considered:**
- Client-side malware
- Compromised browser
- Nation-state endpoint attacks
- Hardware keyloggers

## 📊 Security Audit Checklist

### Code Security

- [ ] All inputs validated and sanitized
- [ ] SQL/NoSQL injection prevented
- [ ] XSS vulnerabilities patched
- [ ] CSRF protection implemented
- [ ] Rate limiting enabled
- [ ] Error messages don't leak info

### Cryptographic Security

- [ ] Strong algorithms (AES-256, Kyber-1024)
- [ ] Secure random number generation
- [ ] Keys properly sized
- [ ] IVs/nonces never reused
- [ ] Authentication tags verified
- [ ] Constant-time operations

### Infrastructure Security

- [ ] HTTPS/TLS everywhere
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Secrets not in code/repo
- [ ] Environment variables secured
- [ ] Regular dependency updates

### Operational Security

- [ ] Database backups encrypted
- [ ] Logs don't contain sensitive data
- [ ] Access control implemented
- [ ] Monitoring and alerting setup
- [ ] Incident response plan ready
- [ ] Regular security audits

## 🎓 Learning Resources

### Post-Quantum Cryptography

- **NIST PQC Standardization**: https://csrc.nist.gov/projects/post-quantum-cryptography
- **Kyber Specification**: https://pq-crystals.org/kyber/
- **liboqs Documentation**: https://github.com/open-quantum-safe/liboqs

### Web Cryptography

- **Web Crypto API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- **AES-GCM Guide**: https://crypto.stackexchange.com/questions/tagged/aes-gcm

### Secure Coding

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Node.js Security**: https://nodejs.org/en/docs/guides/security/

## 🤝 Contributing

When contributing security-related code:

1. **Never commit secrets** - Use `.gitignore`
2. **Test thoroughly** - Write unit tests
3. **Document changes** - Update this file
4. **Follow standards** - Use established libraries
5. **Request review** - Get security expert review

## 📞 Security Contact

For security vulnerabilities, please:
1. DO NOT open public issues
2. Contact maintainers privately
3. Allow time for fix before disclosure
4. Follow responsible disclosure

---

**Remember: Security is a process, not a product!**

Keep learning, keep improving, stay secure! 🔐


# PQC Key Generation Tool

This tool generates post-quantum cryptographic key pairs using the Kyber-1024 KEM algorithm from liboqs.

## Prerequisites

- **liboqs library** installed on your system
- **GCC compiler**

### Installing liboqs

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install liboqs-dev
```

#### macOS
```bash
brew install liboqs
```

#### Windows
Follow the instructions at: https://github.com/open-quantum-safe/liboqs/wiki/Building-liboqs-on-Windows

## Compilation

```bash
make
```

This will compile `keygen.c` into an executable called `keygen`.

## Usage

Run the key generation tool:

```bash
./keygen
```

This will:
1. Generate a Kyber-1024 key pair
2. Encode keys to Base64
3. Save them to files:
   - `public_key.txt` - Your public key (share this)
   - `private_key.txt` - Your private key (KEEP SECRET!)
4. Display both keys in the terminal

## Using the Keys

### During Registration

1. Run `./keygen` to generate your keys
2. Copy the content of `public_key.txt`
3. Paste it in the "Public Key" field during registration
4. Optionally paste `private_key.txt` content for automatic secure storage

### Important Security Notes

⚠️ **CRITICAL: Private Key Security**

- **NEVER share your private key** with anyone
- **NEVER upload it** to any server or cloud storage
- **KEEP IT SECURE** - Store it offline or in a password manager
- If your private key is compromised, all your encrypted messages can be decrypted
- Consider backing it up to multiple secure locations

✅ **Public Key**
- Safe to share with anyone
- Used by others to encrypt messages to you
- Stored on the server during registration

## Key Specifications

- **Algorithm**: Kyber-1024 (NIST PQC standardized)
- **Security Level**: Level 5 (highest)
- **Public Key Size**: ~1568 bytes
- **Private Key Size**: ~3168 bytes
- **Ciphertext Size**: ~1568 bytes
- **Shared Secret**: 32 bytes

## Troubleshooting

### "liboqs not found"

Make sure liboqs is installed:
```bash
# Check if installed
pkg-config --modversion liboqs

# If not found, install it
sudo apt-get install liboqs-dev  # Ubuntu/Debian
brew install liboqs              # macOS
```

### Compilation Errors

If you get compilation errors, try:
```bash
# Clean and rebuild
make clean
make

# Or compile manually
gcc -o keygen keygen.c -loqs
```

## Files Generated

After running `./keygen`:

```
pqc-keygen/
├── keygen           # Executable
├── keygen.c         # Source code
├── Makefile         # Build configuration
├── public_key.txt   # Your public key (Base64)
└── private_key.txt  # Your private key (Base64) - KEEP SECRET!
```

## Clean Up

To remove generated files:
```bash
make clean
```

This removes the executable and key files, but keeps the source code.

## Security Best Practices

1. **Generate keys on a trusted device**
2. **Use unique keys per device/application**
3. **Rotate keys periodically** (every 6-12 months)
4. **Back up private keys securely**
5. **Never transmit private keys over insecure channels**
6. **Consider using hardware security modules (HSM) for production**

## Algorithm Information

**Kyber-1024** is one of the NIST-selected post-quantum cryptographic algorithms:

- **Type**: Key Encapsulation Mechanism (KEM)
- **Based on**: Module-Learning With Errors (M-LWE)
- **Quantum Secure**: Yes
- **NIST Status**: Selected for standardization (2022)
- **Use Case**: Secure key exchange resistant to quantum computer attacks

## License

This tool uses liboqs, which is available under the MIT License.

## Support

For issues with:
- **liboqs**: https://github.com/open-quantum-safe/liboqs
- **This tool**: Check the main project README