import React from 'react';

// Skeleton for chat messages
export const ChatSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs ${i % 2 === 0 ? 'bg-blue-100' : 'bg-gray-100'} rounded-lg p-4 space-y-2`}>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                </div>
            </div>
        ))}
    </div>
);

// Skeleton for persona card
export const PersonaSkeleton = () => (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
        </div>
        <div className="mt-4 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
    </div>
);

// Skeleton for inbox items
export const InboxSkeleton = () => (
    <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
        ))}
    </div>
);

// Skeleton for activity items
export const ActivitySkeleton = () => (
    <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                </div>
            </div>
        ))}
    </div>
);

// Generic skeleton for cards
export const CardSkeleton = () => (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
    </div>
);

// Generic loading spinner
export const LoadingSpinner = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className="flex items-center justify-center">
            <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
        </div>
    );
};

export default {
    ChatSkeleton,
    PersonaSkeleton,
    InboxSkeleton,
    ActivitySkeleton,
    CardSkeleton,
    LoadingSpinner,
};
