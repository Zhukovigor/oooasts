"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const VK_APP_ID = 54519669;
const VK_REDIRECT_URI = "https://asts.vercel.app/api/vk/callback";

function VkAuthContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');
  const userId = searchParams.get('user_id');
  const userName = searchParams.get('user_name');
  
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkError, setSdkError] = useState(null);

  // Генерируем URL для OAuth авторизации напрямую (резервный вариант)
  const vkAuthUrl = `https://oauth.vk.com/authorize?client_id=${VK_APP_ID}&display=page&redirect_uri=${encodeURIComponent(VK_REDIRECT_URI)}&scope=wall,photos,groups,offline&response_type=code&v=5.131`;

  useEffect(() => {
    // Загружаем VK ID SDK
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@vkid/sdk@2.2.0/dist-sdk/umd/index.js';
    script.async = true;
    
    script.onload = () => {
      console.log('[v0] VK SDK loaded');
      try {
        if (window.VKIDSDK) {
          const VKID = window.VKIDSDK;
          
          VKID.Config.init({
            app: VK_APP_ID,
            redirectUrl: VK_REDIRECT_URI,
            responseMode: VKID.ConfigResponseMode.Redirect,
            source: VKID.ConfigSource.LOWCODE,
            scope: 'wall photos groups offline',
          });

          const authBox = document.getElementById('vk-auth-container');
          if (authBox) {
            const oAuth = new VKID.OAuthList();
            oAuth.render({
              container: authBox,
              oauthList: ['vkid']
            }).on(VKID.WidgetEvents.ERROR, (err) => {
              console.error('[v0] VK SDK widget error:', err);
              setSdkError('Ошибка виджета VK: ' + JSON.stringify(err));
            });
            setSdkLoaded(true);
          }
        }
      } catch (err) {
        console.error('[v0] VK SDK init error:', err);
        setSdkError('Ошибка инициализации VK SDK: ' + err.message);
      }
    };
    
    script.onerror = () => {
      console.error('[v0] Failed to load VK SDK');
      setSdkError('Не удалось загрузить VK SDK');
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1.007-1.489-1.143-1.744-1.143-.356 0-.458.102-.458.593v1.563c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.57 4 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.847 2.49 2.27 4.675 2.862 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.644v3.202c0 .373.17.508.271.508.22 0 .407-.135.813-.542 1.27-1.422 2.185-3.608 2.185-3.608.118-.254.322-.491.762-.491h1.744c.525 0 .644.27.525.644-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.78 1.202 1.253.745.847 1.32 1.558 1.473 2.049.17.474-.085.72-.576.72z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Авторизация VK</h1>
          <p className="text-gray-500 mt-2">Войдите через ВКонтакте для доступа к функциям</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <strong>Ошибка:</strong>
            </div>
            <p className="mt-1 text-red-600">{decodeURIComponent(error)}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <strong>Успешная авторизация!</strong>
            </div>
            {userId && <p className="mt-1 text-green-600">User ID: {userId}</p>}
            {userName && <p className="text-green-600">Имя: {decodeURIComponent(userName)}</p>}
          </div>
        )}

        {sdkError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">{sdkError}</p>
          </div>
        )}

        {/* Контейнер для VK SDK виджета */}
        <div id="vk-auth-container" className="mb-6 flex justify-center" />

        {/* Резервная кнопка если SDK не загрузился */}
        {!sdkLoaded && (
          <a
            href={vkAuthUrl}
            className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.713-1.033-1.007-1.489-1.143-1.744-1.143-.356 0-.458.102-.458.593v1.563c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.57 4 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.847 2.49 2.27 4.675 2.862 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.644v3.202c0 .373.17.508.271.508.22 0 .407-.135.813-.542 1.27-1.422 2.185-3.608 2.185-3.608.118-.254.322-.491.762-.491h1.744c.525 0 .644.27.525.644-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.78 1.202 1.253.745.847 1.32 1.558 1.473 2.049.17.474-.085.72-.576.72z"/>
            </svg>
            Войти через ВКонтакте
          </a>
        )}

        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-700 text-sm">
            Вернуться на главную
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            App ID: {VK_APP_ID}
          </p>
        </div>
      </div>
    </main>
  );
}

export default function VkAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    }>
      <VkAuthContent />
    </Suspense>
  );
}
