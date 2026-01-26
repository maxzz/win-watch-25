#pragma once
#include <windows.h>
#include <atomic>

// Parameters for highlighting a control
struct HighlightParams {
    int x = 0;
    int y = 0;
    int width = 0;
    int height = 0;
    int borderWidth = 5;
    COLORREF highlightColor = RGB(255, 0, 0);  // Red
    COLORREF transparentColor = RGB(0, 128, 128);  // For color key
    int blinkCount = 5;  // Number of blinks (0 = stay visible)
};

/// <summary>
/// Singleton class that manages a layered window for highlighting controls.
/// The highlighting window is created on a worker thread with its own message loop.
/// </summary>
class ControlHighlighter {
public:
    static ControlHighlighter& GetInstance();
    
    // Initialize the highlighter (creates worker thread and window)
    bool Initialize();
    
    // Cleanup resources
    void Cleanup();
    
    // Show highlight rectangle at specified position
    void Highlight(const HighlightParams& params);
    
    // Hide the highlight
    void Hide();

private:
    ControlHighlighter();
    ~ControlHighlighter();
    
    // Non-copyable
    ControlHighlighter(const ControlHighlighter&) = delete;
    ControlHighlighter& operator=(const ControlHighlighter&) = delete;
    
    // Worker thread procedure
    static unsigned __stdcall ThreadProc(void* pThis);
    void RunMessageLoop();
    
    // Window procedure for the highlighter window
    static LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);
    LRESULT HandleMessage(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);
    
    // Message handlers
    void OnHighlight(const HighlightParams& params);
    void OnHide();
    void OnTimer();
    
    // Helper to update the layered window
    void UpdateHighlightWindow(const HighlightParams& params);

private:
    HWND m_hwnd = nullptr;
    HANDLE m_hThread = nullptr;
    unsigned m_threadId = 0;
    HANDLE m_hReadyEvent = nullptr;
    
    std::atomic<bool> m_initialized{false};
    
    // Blinking state
    UINT_PTR m_timerId = 0;
    int m_remainingBlinks = 0;
    static const int FLASH_INTERVAL_MS = 200;
    
    // Custom window messages
    static const UINT WM_HIGHLIGHT = WM_USER + 100;
    static const UINT WM_HIDE_HIGHLIGHT = WM_USER + 101;
    
    // Window class name
    static const wchar_t* WINDOW_CLASS_NAME;
};
