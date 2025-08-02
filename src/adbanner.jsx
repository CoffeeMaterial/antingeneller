import { useEffect } from "react";

export default function AdBanner() {
  useEffect(() => {
    try {
      // Try to render ads (required by AdSense)
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", margin: "20px auto" }}
      data-ad-client="ca-pub-3596254894158926"
      data-ad-slot="4269658663"  // ✅ Replace this with your real ad slot ID
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
}