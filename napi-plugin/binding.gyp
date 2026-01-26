{
  "variables": {
    "native_config%": "Release"
  },
  "targets": [
    {
      "target_name": "winwatch",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [ "src/binding.cpp" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "../native/src"
      ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "libraries": [ 
        "../../plugins/<(native_config)/WindowMonitor.lib",
        "uiautomationcore.lib",
        "ole32.lib",
        "oleaut32.lib",
        "user32.lib",
        "kernel32.lib"
      ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1
        }
      }
    }
  ]
}
