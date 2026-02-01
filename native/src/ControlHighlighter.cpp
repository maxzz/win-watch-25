#include "ControlHighlighter.h"
#include <process.h>

const wchar_t* ControlHighlighter::WINDOW_CLASS_NAME = L"WinWatchHighlighterWindow";

ControlHighlighter& ControlHighlighter::GetInstance() {
    static ControlHighlighter instance;
    return instance;
}

ControlHighlighter::ControlHighlighter() {
}

ControlHighlighter::~ControlHighlighter() {
    Cleanup();
}

bool ControlHighlighter::Initialize() {
    if (m_initialized) {
        return true;
    }
    
    // Create event to signal when window is ready
    m_hReadyEvent = CreateEvent(nullptr, FALSE, FALSE, nullptr);
    if (!m_hReadyEvent) {
        return false;
    }
    
    // Create worker thread
    m_hThread = (HANDLE)_beginthreadex(nullptr, 0, ThreadProc, this, 0, &m_threadId);
    if (!m_hThread) {
        CloseHandle(m_hReadyEvent);
        m_hReadyEvent = nullptr;
        return false;
    }
    
    // Wait for window to be created
    WaitForSingleObject(m_hReadyEvent, 5000);
    
    m_initialized = (m_hwnd != nullptr);
    return m_initialized;
}

void ControlHighlighter::Cleanup() {
    if (!m_initialized) {
        return;
    }
    
    // Send close message to the window
    if (m_hwnd) {
        PostMessage(m_hwnd, WM_CLOSE, 0, 0);
    }
    
    // Wait for thread to finish
    if (m_hThread) {
        WaitForSingleObject(m_hThread, 3000);
        CloseHandle(m_hThread);
        m_hThread = nullptr;
    }
    
    if (m_hReadyEvent) {
        CloseHandle(m_hReadyEvent);
        m_hReadyEvent = nullptr;
    }
    
    m_hwnd = nullptr;
    m_initialized = false;
}

void ControlHighlighter::Highlight(const HighlightParams& params) {
    if (!m_initialized || !m_hwnd) {
        return;
    }
    
    // Copy params to heap so they survive the async call
    HighlightParams* pParams = new HighlightParams(params);
    PostMessage(m_hwnd, WM_HIGHLIGHT, 0, reinterpret_cast<LPARAM>(pParams));
}

void ControlHighlighter::Hide() {
    if (!m_initialized || !m_hwnd) {
        return;
    }
    
    PostMessage(m_hwnd, WM_HIDE_HIGHLIGHT, 0, 0);
}

unsigned __stdcall ControlHighlighter::ThreadProc(void* pThis) {
    auto* self = static_cast<ControlHighlighter*>(pThis);
    self->RunMessageLoop();
    return 0;
}

void ControlHighlighter::RunMessageLoop() {
    // Register window class
    WNDCLASSEXW wc = {};
    wc.cbSize = sizeof(WNDCLASSEXW);
    wc.lpfnWndProc = WndProc;
    wc.hInstance = GetModuleHandle(nullptr);
    wc.lpszClassName = WINDOW_CLASS_NAME;
    RegisterClassExW(&wc);
    
    // Create layered window
    m_hwnd = CreateWindowExW(
        WS_EX_TOPMOST | WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE | WS_EX_TRANSPARENT,
        WINDOW_CLASS_NAME,
        L"",
        WS_POPUP,
        0, 0, 0, 0,
        nullptr,
        nullptr,
        GetModuleHandle(nullptr),
        this  // Pass this pointer for WM_CREATE
    );
    
    // Signal that window is ready
    SetEvent(m_hReadyEvent);
    
    if (!m_hwnd) {
        return;
    }
    
    // Message loop
    MSG msg;
    while (GetMessage(&msg, nullptr, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    
    // Cleanup
    if (m_timerId) {
        KillTimer(m_hwnd, m_timerId);
        m_timerId = 0;
    }
    
    DestroyWindow(m_hwnd);
    UnregisterClassW(WINDOW_CLASS_NAME, GetModuleHandle(nullptr));
    m_hwnd = nullptr;
}

LRESULT CALLBACK ControlHighlighter::WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    ControlHighlighter* self = nullptr;
    
    if (msg == WM_CREATE) {
        CREATESTRUCT* cs = reinterpret_cast<CREATESTRUCT*>(lParam);
        self = static_cast<ControlHighlighter*>(cs->lpCreateParams);
        SetWindowLongPtr(hwnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(self));
    } else {
        self = reinterpret_cast<ControlHighlighter*>(GetWindowLongPtr(hwnd, GWLP_USERDATA));
    }
    
    if (self) {
        return self->HandleMessage(hwnd, msg, wParam, lParam);
    }
    
    return DefWindowProc(hwnd, msg, wParam, lParam);
}

LRESULT ControlHighlighter::HandleMessage(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_HIGHLIGHT: {
            HighlightParams* pParams = reinterpret_cast<HighlightParams*>(lParam);
            if (pParams) {
                OnHighlight(*pParams);
                delete pParams;
            }
            return 0;
        }
        
        case WM_HIDE_HIGHLIGHT:
            OnHide();
            return 0;
        
        case WM_TIMER:
            OnTimer();
            return 0;
        
        case WM_CLOSE:
            PostQuitMessage(0);
            return 0;
    }
    
    return DefWindowProc(hwnd, msg, wParam, lParam);
}

void ControlHighlighter::OnHighlight(const HighlightParams& params) {
    // Stop any existing timer
    if (m_timerId) {
        KillTimer(m_hwnd, m_timerId);
        m_timerId = 0;
    }
    
    // Update the layered window
    UpdateHighlightWindow(params);
    
    // Show the window
    ShowWindow(m_hwnd, SW_SHOWNA);
    
    // Start blinking if requested
    if (params.blinkCount > 0) {
        m_remainingBlinks = params.blinkCount * 2 - 1;  // *2 for show/hide cycles, -1 because we just showed it
        m_timerId = SetTimer(m_hwnd, 1, FLASH_INTERVAL_MS, nullptr);
    }
}

void ControlHighlighter::OnHide() {
    if (m_timerId) {
        KillTimer(m_hwnd, m_timerId);
        m_timerId = 0;
    }
    ShowWindow(m_hwnd, SW_HIDE);
}

void ControlHighlighter::OnTimer() {
    if (m_remainingBlinks <= 0) {
        KillTimer(m_hwnd, m_timerId);
        m_timerId = 0;
        ShowWindow(m_hwnd, SW_HIDE);
        return;
    }
    
    m_remainingBlinks--;
    
    // Toggle visibility
    if (IsWindowVisible(m_hwnd)) {
        ShowWindow(m_hwnd, SW_HIDE);
    } else {
        ShowWindow(m_hwnd, SW_SHOWNA);
    }
}

void ControlHighlighter::UpdateHighlightWindow(const HighlightParams& params) {
    int borderWidth = params.borderWidth;
    const int rectWidth = params.right - params.left;
    const int rectHeight = params.bottom - params.top;
    if (rectWidth <= 0 || rectHeight <= 0) {
        // Invalid rectangle
        ShowWindow(m_hwnd, SW_HIDE);
        return;
    }

    int windowWidth = rectWidth + borderWidth * 2;
    int windowHeight = rectHeight + borderWidth * 2;
    int windowX = params.left - borderWidth;
    int windowY = params.top - borderWidth;
    
    // Create a compatible DC and bitmap for drawing
    HDC hdcScreen = GetDC(nullptr);
    HDC hdcMem = CreateCompatibleDC(hdcScreen);
    HBITMAP hBitmap = CreateCompatibleBitmap(hdcScreen, windowWidth, windowHeight);
    HBITMAP hOldBitmap = (HBITMAP)SelectObject(hdcMem, hBitmap);
    
    // Fill with the highlight color (border)
    RECT rcFull = { 0, 0, windowWidth, windowHeight };
    HBRUSH hBrushBorder = CreateSolidBrush(params.highlightColor);
    FillRect(hdcMem, &rcFull, hBrushBorder);
    DeleteObject(hBrushBorder);
    
    // Fill the center with the transparent color
    RECT rcCenter = { 
        borderWidth, 
        borderWidth, 
        windowWidth - borderWidth, 
        windowHeight - borderWidth 
    };
    HBRUSH hBrushTransparent = CreateSolidBrush(params.transparentColor);
    FillRect(hdcMem, &rcCenter, hBrushTransparent);
    DeleteObject(hBrushTransparent);
    
    // Position and size
    POINT ptPos = { windowX, windowY };
    SIZE sizeWnd = { windowWidth, windowHeight };
    POINT ptSrc = { 0, 0 };
    
    // Update the layered window with color key for transparency
    UpdateLayeredWindow(
        m_hwnd,
        hdcScreen,
        &ptPos,
        &sizeWnd,
        hdcMem,
        &ptSrc,
        params.transparentColor,
        nullptr,
        ULW_COLORKEY
    );
    
    // Cleanup
    SelectObject(hdcMem, hOldBitmap);
    DeleteObject(hBitmap);
    DeleteDC(hdcMem);
    ReleaseDC(nullptr, hdcScreen);
}
