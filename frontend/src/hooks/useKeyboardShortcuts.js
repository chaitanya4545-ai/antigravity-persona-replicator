import { useHotkeys } from 'react-hotkeys-hook';

export const useKeyboardShortcuts = ({
    onToggleDarkMode,
    onFocusChat,
    onShowHelp,
    onNewChat,
    onEscape
}) => {
    // Toggle dark mode: Ctrl/Cmd + D
    useHotkeys('ctrl+d, meta+d', (e) => {
        e.preventDefault();
        onToggleDarkMode?.();
    }, [onToggleDarkMode]);

    // Focus chat input: Ctrl/Cmd + K
    useHotkeys('ctrl+k, meta+k', (e) => {
        e.preventDefault();
        onFocusChat?.();
    }, [onFocusChat]);

    // Show shortcuts help: Ctrl/Cmd + /
    useHotkeys('ctrl+/, meta+/', (e) => {
        e.preventDefault();
        onShowHelp?.();
    }, [onShowHelp]);

    // New chat: Ctrl/Cmd + N
    useHotkeys('ctrl+n, meta+n', (e) => {
        e.preventDefault();
        onNewChat?.();
    }, [onNewChat]);

    // Escape key
    useHotkeys('escape', () => {
        onEscape?.();
    }, [onEscape]);
};

export const SHORTCUTS = [
    { keys: ['Ctrl', 'D'], mac: ['⌘', 'D'], description: 'Toggle dark mode' },
    { keys: ['Ctrl', 'K'], mac: ['⌘', 'K'], description: 'Focus chat input' },
    { keys: ['Ctrl', '/'], mac: ['⌘', '/'], description: 'Show shortcuts' },
    { keys: ['Ctrl', 'N'], mac: ['⌘', 'N'], description: 'New chat' },
    { keys: ['Esc'], mac: ['Esc'], description: 'Close modals' },
];
