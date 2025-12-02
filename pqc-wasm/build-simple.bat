@echo off
echo ============================================
echo Building PQC WebAssembly Module
echo ============================================
echo.

REM Activate Emscripten
call C:\Users\%USERNAME%\emsdk\emsdk_env.bat

echo.
echo [Step 1/4] Checking for liboqs source...
if not exist "liboqs" (
    echo Cloning liboqs repository...
    git clone --depth 1 https://github.com/open-quantum-safe/liboqs.git
    if %errorlevel% neq 0 (
        echo ERROR: Failed to clone liboqs
        pause
        exit /b 1
    )
) else (
    echo liboqs already exists, skipping clone
)

echo.
echo [Step 2/4] Building liboqs for WebAssembly...
cd liboqs

if not exist "build-wasm" (
    mkdir build-wasm
)
cd build-wasm

echo Configuring with CMake...
emcmake cmake .. ^
    -DCMAKE_BUILD_TYPE=Release ^
    -DBUILD_SHARED_LIBS=OFF ^
    -DOQS_USE_OPENSSL=OFF ^
    -DOQS_MINIMAL_BUILD="KEM_kyber_1024"

if %errorlevel% neq 0 (
    echo ERROR: CMake configuration failed
    cd ..\..
    pause
    exit /b 1
)

echo Building liboqs (this may take 5-10 minutes)...
emmake make -j4

if %errorlevel% neq 0 (
    echo ERROR: liboqs build failed
    cd ..\..
    pause
    exit /b 1
)

cd ..\..

echo.
echo [Step 3/4] Compiling pqc_keygen.c...
emcc pqc_keygen.c ^
    -o pqc_keygen.js ^
    -I"liboqs/build-wasm/include" ^
    -L"liboqs/build-wasm/lib" ^
    -loqs ^
    -s WASM=1 ^
    -s EXPORTED_RUNTIME_METHODS="['cwrap','ccall','getValue','setValue','HEAPU8','_malloc','_free']" ^
    -s EXPORTED_FUNCTIONS="['_generate_keypair','_get_public_key','_get_secret_key','_get_public_key_length','_get_secret_key_length','_cleanup','_encapsulate','_decapsulate','_malloc','_free']" ^
    -s ALLOW_MEMORY_GROWTH=1 ^
    -s MODULARIZE=1 ^
    -s EXPORT_NAME='createPQCModule' ^
    -s ENVIRONMENT='web' ^
    -s INITIAL_MEMORY=33554432 ^
    -O3

if %errorlevel% neq 0 (
    echo.
    echo ============================================
    echo BUILD FAILED!
    echo ============================================
    pause
    exit /b 1
)

echo.
echo [Step 4/4] Copying files to frontend...
if exist "pqc_keygen.js" (
    copy /Y pqc_keygen.js ..\frontend\public\
    copy /Y pqc_keygen.wasm ..\frontend\public\
    
    echo.
    echo ============================================
    echo BUILD SUCCESSFUL!
    echo ============================================
    echo Generated files:
    echo   - pqc_keygen.js
    echo   - pqc_keygen.wasm
    echo.
    echo Files copied to frontend\public\
    echo ============================================
) else (
    echo ERROR: Output files not found
    pause
    exit /b 1
)

pause