async function loadWasm(path) {
    const wasm = await WebAssembly.instantiateStreaming(fetch(path), {});
    return wasm.instance.exports;
}

loadWasm("pqc_crypto.wasm").then(mod => {
    console.log("WASM Loaded!");

    // Call `_main()` from WASM
    const exit_code = mod._main();
    console.log("Program finished with exit code:", exit_code);
});
