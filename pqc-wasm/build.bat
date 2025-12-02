@echo off
echo Building PQC WebAssembly Module...

REM Activate Emscripten
call C:\Users\%USERNAME%\emsdk\emsdk_env.bat

REM Set liboqs paths
set LIBOQS_INCLUDE=-I"C:\vcpkg\installed\x64-windows\include"
set LIBOQS_LIB=-L"C:\vcpkg\installed\x64-windows\lib" -loqs

REM Compile with Emscripten
emcc pqc_keygen.c ^
    -o pqc_keygen.js ^
    %LIBOQS_INCLUDE% ^
    %LIBOQS_LIB% ^
    -s WASM=1 ^
    -s EXPORTED_RUNTIME_METHODS="['cwrap', 'ccall', 'getValue', 'setValue', 'HEAPU8']" ^
    -s ALLOW_MEMORY_GROWTH=1 ^
    -s MODULARIZE=1 ^
    -s EXPORT_NAME='createPQCModule' ^
    -s ENVIRONMENT='web' ^
    -O3

if %errorlevel% equ 0 (
    echo.
    echo Build successful!
    echo Generated files:
    echo   - pqc_keygen.js
    echo   - pqc_keygen.wasm
    
    REM Copy to frontend
    copy /Y pqc_keygen.js ..\frontend\public\
    copy /Y pqc_keygen.wasm ..\frontend\public\
    
    echo.
    echo Copied to frontend\public\
) else (
    echo.
    echo Build failed!
)

pause