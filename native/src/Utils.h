#pragma once
#include <windows.h>
#include <cerrno>
#include <cstdint>
#include <cstdlib>
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

// Format HWND as fixed-width uppercase hex with 0x prefix.
// - 32-bit: 0x0012ABCD (8 hex digits)
// - 64-bit: 0x000000001234ABCD (16 hex digits)
inline std::string HwndToHexString(HWND hwnd) {
    const auto handleValue = reinterpret_cast<std::uintptr_t>(hwnd);
    std::ostringstream handleHex;
    handleHex << "0x"
              << std::uppercase
              << std::hex
              << std::setw(sizeof(std::uintptr_t) * 2)
              << std::setfill('0')
              << handleValue;
    return handleHex.str();
}

// Parse a stringified HWND.
// Accepts either decimal (e.g. "1234") or hex (e.g. "0x000000001234ABCD" or "000000001234ABCD").
inline bool TryParseHwnd(const std::string& s, HWND& outHwnd) {
    if (s.empty()) return false;
    if (s[0] == '-') return false;
    errno = 0;
    const char* begin = s.c_str();
    int base = 10;
    if (s.rfind("0x", 0) == 0 || s.rfind("0X", 0) == 0) {
        begin += 2;
        base = 16;
    } else if (s.find_first_of("abcdefABCDEF") != std::string::npos) {
        // If it contains hex alpha digits, treat it as hex even without a 0x prefix.
        // This avoids base-0 treating leading zero strings as octal.
        base = 16;
    }

    char* end = nullptr;
    const unsigned long long value = std::strtoull(begin, &end, base);
    if (errno == ERANGE) return false;
    if (end == begin || *end != '\0') return false;
    outHwnd = reinterpret_cast<HWND>(static_cast<std::uintptr_t>(value));
    return true;
}
