#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔨 Building PQC WebAssembly Module..."

# Check if liboqs is installed
if ! pkg-config --exists liboqs; then
    echo -e "${RED}❌ Error: liboqs not found${NC}"
    echo "Install it first:"
    echo "  Ubuntu/Debian: sudo apt-get install liboqs-dev"
    echo "  macOS: brew install liboqs"
    exit 1
fi

# Get liboqs include and library paths
LIBOQS_INCLUDE=$(pkg-config --cflags liboqs)
LIBOQS_LIB=$(pkg-config --libs liboqs)

# Compile with Emscripten
emcc pqc_keygen.c \
    -o pqc_keygen.js \
    $LIBOQS_INCLUDE \
    $LIBOQS_LIB \
    -s WASM=1 \
    -s EXPORTED_RUNTIME_METHODS='["cwrap", "ccall", "getValue", "setValue", "HEAPU8"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME='createPQCModule' \
    -s ENVIRONMENT='web' \
    -O3

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo "📦 Generated files:"
    echo "   - pqc_keygen.js"
    echo "   - pqc_keygen.wasm"
    
    # Copy to frontend public folder
    cp pqc_keygen.js ../frontend/public/
    cp pqc_keygen.wasm ../frontend/public/
    echo -e "${GREEN}✅ Copied to frontend/public/${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi