import { useState, useEffect } from 'react';

export function useOnboarding() {
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeenTour) {
            // Start tour after a short delay to let the app render
            setTimeout(() => setRun(true), 1500);
        }
    }, []);

    const handleJoyrideCallback = (data) => {
        const { status } = data;

        if (status === 'finished' || status === 'skipped') {
            setRun(false);
            localStorage.setItem('hasSeenOnboarding', 'true');
        }
    };

    const restartTour = () => {
        setStepIndex(0);
        setRun(true);
    };

    return {
        run,
        stepIndex,
        handleJoyrideCallback,
        restartTour
    };
}
