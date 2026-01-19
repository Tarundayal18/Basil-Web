/**
 * Facebook Pixel component that loads and initializes Facebook Pixel tracking.
 * This component should be added to the root layout to enable Facebook Pixel tracking
 * across the entire application.
 */

"use client";

import Script from "next/script";

/**
 * FacebookPixel component initializes Facebook Pixel tracking
 * @param pixelId - Facebook Pixel ID from environment variables
 * @returns Script component that loads Facebook Pixel
 */
export function FacebookPixel({ pixelId }: { pixelId?: string }) {
  if (!pixelId) {
    return null;
  }

  return (
    <>
      <Script
        key="fb-pixel-script"
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript key="fb-pixel-noscript">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
