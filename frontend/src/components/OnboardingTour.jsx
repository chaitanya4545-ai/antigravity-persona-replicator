import React from 'react';
import Joyride from 'react-joyride';

export default function OnboardingTour({ run, stepIndex, callback }) {
    const steps = [
        {
            target: 'body',
            content: (
                <div className="p-2">
                    <h2 className="text-2xl font-bold mb-3">Welcome to Antigravity Twin! 👋</h2>
                    <p className="text-lg">Let me show you around in just 30 seconds.</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '[data-tour="persona"]',
            content: (
                <div>
                    <h3 className="font-bold mb-2">Train Your Persona</h3>
                    <p>Upload your writing samples here to train your AI twin to write just like you.</p>
                </div>
            ),
            disableBeacon: true,
        },
        {
            target: '[data-tour="chat"]',
            content: (
                <div>
                    <h3 className="font-bold mb-2">Chat Interface</h3>
                    <p>Chat with your AI twin or switch to AI Assistant mode for general help.</p>
                </div>
            ),
            disableBeacon: true,
        },
        {
            target: '[data-tour="dark-mode"]',
            content: (
                <div>
                    <h3 className="font-bold mb-2">Dark Mode</h3>
                    <p>Toggle dark mode for comfortable viewing. Try pressing <kbd className="px-2 py-1 bg-slate-200 rounded">Ctrl+D</kbd>!</p>
                </div>
            ),
            disableBeacon: true,
        },
        {
            target: '[data-tour="shortcuts"]',
            content: (
                <div>
                    <h3 className="font-bold mb-2">Keyboard Shortcuts</h3>
                    <p>Press <kbd className="px-2 py-1 bg-slate-200 rounded">Ctrl+/</kbd> anytime to see all keyboard shortcuts.</p>
                </div>
            ),
            disableBeacon: true,
        },
        {
            target: 'body',
            content: (
                <div className="p-2">
                    <h2 className="text-2xl font-bold mb-3">You're all set! 🎉</h2>
                    <p className="text-lg">Start by training your persona with some writing samples.</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
    ];

    return (
        <Joyride
            steps={steps}
            run={run}
            stepIndex={stepIndex}
            callback={callback}
            continuous
            showProgress
            showSkipButton
            scrollToFirstStep
            disableOverlayClose
            styles={{
                options: {
                    primaryColor: '#4f46e5',
                    zIndex: 10000,
                    arrowColor: '#fff',
                    backgroundColor: '#fff',
                    textColor: '#1f2937',
                },
                tooltip: {
                    borderRadius: 12,
                    fontSize: 15,
                },
                buttonNext: {
                    backgroundColor: '#4f46e5',
                    borderRadius: 8,
                    fontSize: 14,
                    padding: '10px 20px',
                },
                buttonBack: {
                    color: '#64748b',
                    marginRight: 10,
                },
                buttonSkip: {
                    color: '#94a3b8',
                },
            }}
            locale={{
                back: 'Back',
                close: 'Close',
                last: 'Finish',
                next: 'Next',
                skip: 'Skip tour',
            }}
        />
    );
}
