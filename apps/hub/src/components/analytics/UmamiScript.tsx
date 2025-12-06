'use client';

import Script from 'next/script';

export function UmamiScript() {
    const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
    const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;

    if (!websiteId || !scriptUrl) {
        console.warn('Umami Analytics: NEXT_PUBLIC_UMAMI_WEBSITE_ID or NEXT_PUBLIC_UMAMI_SCRIPT_URL is missing.');
        return null;
    }

    return (
        <Script
            src={scriptUrl}
            data-website-id={websiteId}
            strategy="afterInteractive"
        />
    );
}
