'use client';

import React from 'react';

interface VideoPlayerProps {
    url: string;
    title?: string;
    poster?: string;
    provider?: 'youtube' | 'html5';
}

export default function VideoPlayer({ url, title, provider = 'html5' }: VideoPlayerProps) {
    // For YouTube, construct embed URL with restrictions
    if (provider === 'youtube') {
        // Build restricted YouTube embed URL
        const embedUrl = `https://www.youtube-nocookie.com/embed/${url}?rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&playsinline=1&showinfo=0`;

        return (
            <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-black">
                <iframe
                    src={embedUrl}
                    title={title || 'Video Player'}
                    className="w-full h-full min-h-[400px]"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ border: 'none' }}
                />
            </div>
        );
    }

    // For HTML5 videos (direct files)
    return (
        <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-black">
            <video
                src={url}
                controls
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                className="w-full h-full min-h-[400px] object-contain"
                onContextMenu={(e) => e.preventDefault()}
                playsInline
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
}
