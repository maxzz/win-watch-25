#pragma once
#include <windows.h>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>

inline std::string WideToUtf8(const std::wstring& ws) {
    if (ws.empty()) return "";

    int sizeNeeded = WideCharToMultiByte(
        CP_UTF8,
        0,
        ws.data(),
        static_cast<int>(ws.size()),
        nullptr,
        0,
        nullptr,
        nullptr
    );
    if (sizeNeeded <= 0) return "";

    std::string result(static_cast<size_t>(sizeNeeded), '\0');
    WideCharToMultiByte(
        CP_UTF8,
        0,
        ws.data(),
        static_cast<int>(ws.size()),
        &result[0],
        sizeNeeded,
        nullptr,
        nullptr
    );
    return result;
}

inline std::wstring Utf8ToWide(const std::string& s) {
    if (s.empty()) return L"";

    int sizeNeeded = MultiByteToWideChar(
        CP_UTF8,
        0,
        s.data(),
        static_cast<int>(s.size()),
        nullptr,
        0
    );
    if (sizeNeeded <= 0) return L"";

    std::wstring result(static_cast<size_t>(sizeNeeded), L'\0');
    MultiByteToWideChar(
        CP_UTF8,
        0,
        s.data(),
        static_cast<int>(s.size()),
        &result[0],
        sizeNeeded
    );
    return result;
}

inline std::string EscapeJson(const std::string& s) {
    std::ostringstream o;
    for (char c : s) {
        switch (c) {
            case '"': o << "\\\""; break;
            case '\\': o << "\\\\"; break;
            case '\b': o << "\\b"; break;
            case '\f': o << "\\f"; break;
            case '\n': o << "\\n"; break;
            case '\r': o << "\\r"; break;
            case '\t': o << "\\t"; break;
            default:
                if ('\x00' <= c && c <= '\x1f') {
                    o << "\\u" << std::hex << std::setw(4) << std::setfill('0') << (int)c;
                } else {
                    o << c;
                }
        }
    }
    return o.str();
}
