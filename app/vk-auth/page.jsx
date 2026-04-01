"use client";

import Script from "next/script";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const VK_APP_ID = Number(process.env.NEXT_PUBLIC_VK_APP_ID || 54519669);
const VK_REDIRECT_URI =
  process.env.NEXT_PUBLIC_VK_REDIRECT_URI || "https://asts.vercel.app/api/vk/callback";

function VkAuthContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');
  const userId = searchParams.get('user_id');

  return (
    <main style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 24 }}>Авторизация VK</h1>
      
      {error && (
        <div style={{ 
          padding: 16, 
          marginBottom: 24, 
          backgroundColor: '#fee2e2', 
          border: '1px solid #ef4444',
          borderRadius: 8,
          color: '#b91c1c'
        }}>
          <strong>Ошибка:</strong> {decodeURIComponent(error)}
        </div>
      )}

      {success && (
        <div style={{ 
          padding: 16, 
          marginBottom: 24, 
          backgroundColor: '#dcfce7', 
          border: '1px solid #22c55e',
          borderRadius: 8,
          color: '#166534'
        }}>
          <strong>Успешная авторизация!</strong>
          {userId && <p>User ID: {userId}</p>}
        </div>
      )}

      <div id="vk-auth" style={{ marginBottom: 24 }} />
      <div id="vk-result" style={{ marginTop: 24, whiteSpace: "pre-wrap" }} />

      <Script
        src="https://unpkg.com/@vkid/sdk@2.2.0/dist-sdk/umd/index.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && 'VKIDSDK' in window) {
            initVKID();
          }
        }}
        onError={() => {
          const resultBox = document.getElementById('vk-result');
          if (resultBox) {
            resultBox.innerHTML = '<pre style="color:red;">Не удалось загрузить VK ID SDK</pre>';
          }
        }}
      />
    </main>
  );
}

function initVKID() {
  const VKID = window.VKIDSDK;
  const resultBox = document.getElementById('vk-result');
  const authBox = document.getElementById('vk-auth');

  if (!authBox || !VKID) return;

  const config = {
    app: VK_APP_ID,
    redirectUrl: VK_REDIRECT_URI,
    responseMode: VKID.ConfigResponseMode?.Redirect ?? 'redirect',
    scope: 'offline',
  };

  if (VKID.ConfigSource?.LOWCODE) {
    config.source = VKID.ConfigSource.LOWCODE;
  }

  VKID.Config.init(config);

  const oAuth = new VKID.OAuthList();

  oAuth.render({
    container: authBox,
    oauthList: ['vkid']
  })
  .on(VKID.WidgetEvents.ERROR, vkidOnError);

  function vkidOnError(error) {
    console.error('VKID error:', error);
    if (resultBox) {
      resultBox.innerHTML = '<pre style="color:red;">' + JSON.stringify(error, null, 2) + '</pre>';
    }
  }
}

export default function VkAuthPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Загрузка...</div>}>
      <VkAuthContent />
    </Suspense>
  );
}
