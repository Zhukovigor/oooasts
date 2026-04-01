"use client";

import Script from "next/script";

export default function VkAuthPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Авторизация VK</h1>
      <div id="vk-auth" />
      <div id="vk-result" style={{ marginTop: 24, whiteSpace: "pre-wrap" }} />

      <Script
        src="https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js"
        strategy="afterInteractive"
      />
      <Script id="vk-auth-script" strategy="afterInteractive">
        {`
          if ('VKIDSDK' in window) {
            const VKID = window.VKIDSDK;
            const resultBox = document.getElementById('vk-result');
            const authBox = document.getElementById('vk-auth');

            VKID.Config.init({
              app: 54519669,
              redirectUrl: 'https://asts.vercel.app/api/vk/callback',
              responseMode: VKID.ConfigResponseMode.Callback,
              source: VKID.ConfigSource.LOWCODE,
              scope: 'wall photos groups offline',
            });

            const oAuth = new VKID.OAuthList();

            oAuth.render({
              container: authBox,
              oauthList: ['vkid']
            })
            .on(VKID.WidgetEvents.ERROR, vkidOnError)
            .on(VKID.OAuthListInternalEvents.LOGIN_SUCCESS, function (payload) {
              const code = payload.code;
              const deviceId = payload.device_id;

              VKID.Auth.exchangeCode(code, deviceId)
                .then(vkidOnSuccess)
                .catch(vkidOnError);
            });

            function vkidOnSuccess(data) {
              console.log('VKID success:', data);
              resultBox.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            }

            function vkidOnError(error) {
              console.error('VKID error:', error);
              resultBox.innerHTML = '<pre style="color:red;">' + JSON.stringify(error, null, 2) + '</pre>';
            }
          }
        `}
      </Script>
    </main>
  );
}
