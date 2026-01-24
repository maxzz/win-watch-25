#include <napi.h>
#include "WindowMonitor.h"
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
        Napi::TypeError::New(env, "String expected (window handle as hex)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string handleStr = info[0].As<Napi::String>().Utf8Value();
    HWND hwnd = (HWND)std::stoll(handleStr); 
    
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
        return env.Boolean();
    }
    
    std::string handleStr = info[0].As<Napi::String>().Utf8Value();
    std::string runtimeId = info[1].As<Napi::String>().Utf8Value();
    HWND hwnd = (HWND)std::stoll(handleStr);
    
    bool result = InvokeControl(hwnd, runtimeId.c_str());
    return Napi::Boolean::New(env, result); 
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    InitializeMonitor();
    
    exports.Set(Napi::String::New(env, "getTopLevelWindows"), Napi::Function::New(env, GetTopLevelWindowsWrapper));
    exports.Set(Napi::String::New(env, "getControlTree"), Napi::Function::New(env, GetControlTreeWrapper));
    exports.Set(Napi::String::New(env, "startMonitoring"), Napi::Function::New(env, StartMonitoringWrapper));
    exports.Set(Napi::String::New(env, "stopMonitoring"), Napi::Function::New(env, StopMonitoringWrapper));
    exports.Set(Napi::String::New(env, "invokeControl"), Napi::Function::New(env, InvokeControlWrapper));
    
    return exports;
}

NODE_API_MODULE(winwatch, Init)
