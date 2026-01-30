#include <napi.h>
#include "WindowMonitor.h"
#include "Utils.h"
#include <iostream>
#include <thread>
#include <string>

// Global thread-safe function for callback
Napi::ThreadSafeFunction g_tsfn;

void OnActiveWindowChanged(const char* windowInfoJson) {
    if (!g_tsfn) return;
    
    std::string jsonStr = windowInfoJson ? windowInfoJson : "{}";
    
    auto callback = [jsonStr](Napi::Env env, Napi::Function jsCallback) {
        jsCallback.Call({Napi::String::New(env, jsonStr)});
    };
    
    g_tsfn.NonBlockingCall(callback);
}

Napi::Value GetTopLevelWindowsWrapper(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    const char* json = GetTopLevelWindowsJson();
    Napi::String result = Napi::String::New(env, json ? json : "[]");
    FreeString(json);
    return result;
}

Napi::Value GetControlTreeWrapper(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected (window handle like 0x000000001234ABCD)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string handleStr = info[0].As<Napi::String>().Utf8Value();
    HWND hwnd = nullptr;
    if (!TryParseHwnd(handleStr, hwnd)) {
        Napi::TypeError::New(env, "Invalid window handle string (expected hex like 0x000000001234ABCD)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    const char* json = GetControlTreeJson(hwnd);
    Napi::String result = Napi::String::New(env, json ? json : "{}");
    FreeString(json);
    return result;
}

Napi::Value StartMonitoringWrapper(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsFunction()) {
        Napi::TypeError::New(env, "Function expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    g_tsfn = Napi::ThreadSafeFunction::New(
        env,
        info[0].As<Napi::Function>(),
        "ActiveWindowCallback",
        0,
        1
    );
    
    StartActiveWindowMonitoring(OnActiveWindowChanged);
    return Napi::Boolean::New(env, true);
}

Napi::Value StopMonitoringWrapper(const Napi::CallbackInfo& info) {
    StopActiveWindowMonitoring();
    if (g_tsfn) {
        g_tsfn.Release();
        g_tsfn = nullptr;
    }
    return Napi::Boolean::New(info.Env(), true);
}

Napi::Value InvokeControlWrapper(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (handle: string, runtimeId: string)").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
    
    std::string handleStr = info[0].As<Napi::String>().Utf8Value();
    std::string runtimeId = info[1].As<Napi::String>().Utf8Value();
    HWND hwnd = nullptr;
    if (!TryParseHwnd(handleStr, hwnd)) {
        Napi::TypeError::New(env, "Invalid window handle string (expected hex like 0x000000001234ABCD)").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
    
    bool result = InvokeControl(hwnd, runtimeId.c_str());
    return Napi::Boolean::New(env, result); 
}

// Highlight a rectangle on screen
// Parameters: bounds object {x, y, width, height}, optional options {color, borderWidth, blinkCount}
Napi::Value HighlightRectWrapper(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected bounds object {x, y, width, height}").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    Napi::Object bounds = info[0].As<Napi::Object>();
    
    int x = bounds.Has("x") ? bounds.Get("x").As<Napi::Number>().Int32Value() : 0;
    int y = bounds.Has("y") ? bounds.Get("y").As<Napi::Number>().Int32Value() : 0;
    int width = bounds.Has("width") ? bounds.Get("width").As<Napi::Number>().Int32Value() : 0;
    int height = bounds.Has("height") ? bounds.Get("height").As<Napi::Number>().Int32Value() : 0;
    
    // Default values
    int color = 0;          // 0 means use default (red)
    int borderWidth = 5;    // Default border width
    int blinkCount = 5;     // Default blink count
    
    // Parse optional options object
    if (info.Length() >= 2 && info[1].IsObject()) {
        Napi::Object options = info[1].As<Napi::Object>();
        
        if (options.Has("color")) {
            color = options.Get("color").As<Napi::Number>().Int32Value();
        }
        if (options.Has("borderWidth")) {
            borderWidth = options.Get("borderWidth").As<Napi::Number>().Int32Value();
        }
        if (options.Has("blinkCount")) {
            blinkCount = options.Get("blinkCount").As<Napi::Number>().Int32Value();
        }
    }
    
    HighlightRect(x, y, width, height, color, borderWidth, blinkCount);
    return env.Undefined();
}

// Hide the highlight rectangle
Napi::Value HideHighlightWrapper(const Napi::CallbackInfo& info) {
    HideHighlight();
    return info.Env().Undefined();
}

// Get current window rectangle in screen coordinates
Napi::Value GetWindowRectWrapper(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected (window handle)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string handleStr = info[0].As<Napi::String>().Utf8Value();
    HWND hwnd = nullptr;
    if (!TryParseHwnd(handleStr, hwnd)) {
        Napi::TypeError::New(env, "Invalid window handle string (expected hex like 0x000000001234ABCD)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    const char* json = GetWindowRectJson(hwnd);
    Napi::String result = Napi::String::New(env, json ? json : "null");
    FreeString(json);
    return result;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    InitializeMonitor();
    
    exports.Set(Napi::String::New(env, "getTopLevelWindows"), Napi::Function::New(env, GetTopLevelWindowsWrapper));
    exports.Set(Napi::String::New(env, "getControlTree"), Napi::Function::New(env, GetControlTreeWrapper));
    exports.Set(Napi::String::New(env, "startMonitoring"), Napi::Function::New(env, StartMonitoringWrapper));
    exports.Set(Napi::String::New(env, "stopMonitoring"), Napi::Function::New(env, StopMonitoringWrapper));
    exports.Set(Napi::String::New(env, "invokeControl"), Napi::Function::New(env, InvokeControlWrapper));
    exports.Set(Napi::String::New(env, "highlightRect"), Napi::Function::New(env, HighlightRectWrapper));
    exports.Set(Napi::String::New(env, "hideHighlight"), Napi::Function::New(env, HideHighlightWrapper));
    exports.Set(Napi::String::New(env, "getWindowRect"), Napi::Function::New(env, GetWindowRectWrapper));
    
    return exports;
}

NODE_API_MODULE(winwatch, Init)
