// app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isFaceDown, setIsFaceDown] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // iOS 13+ では、ユーザーのアクション（タップ）がないとセンサー許可を要求できない
  const requestPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionGranted(true);
          startListening();
        } else {
          alert('センサーの使用が拒否されました。設定を確認してね。');
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      // AndroidやPCなど、許可が不要な場合
      setPermissionGranted(true);
      startListening();
    }
  };

  const startListening = () => {
    window.addEventListener('deviceorientation', handleOrientation);
    
    // Wake Lock API (画面常時点灯) のリクエスト
    // スマホを伏せてもスリープしないようにする
    if ('wakeLock' in navigator) {
      try {
        (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.log('Wake Lock error:', err);
      }
    }
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
    const beta = event.beta; // 前後の傾き (-180 ~ 180)
    
    // betaのデバッグ表示（開発用）
    setDebugInfo(`Beta: ${beta?.toFixed(0)}`);

    // およそ180度（または-180度）に近いとき＝伏せている状態
    // 完全に平らじゃなくても反応するように、絶対値150以上くらいを判定ラインにする
    if (beta && (Math.abs(beta) > 150)) {
      setIsFaceDown(true);
    } else {
      setIsFaceDown(false);
    }
  };

  // 伏せた状態(isFaceDown)が変わった時の副作用
  useEffect(() => {
    if (!audioRef.current) return;

    if (isFaceDown) {
      // 伏せたら再生（フェードインさせてもおしゃれかも）
      audioRef.current.play().catch(e => console.log('Audio play error', e));
    } else {
      // 表に向けたら停止
      audioRef.current.pause();
      // 次回のために時間を巻き戻しておくかはお好みで
      // audioRef.current.currentTime = 0; 
    }
  }, [isFaceDown]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-900 text-white p-4 transition-colors duration-1000"
      style={{ backgroundColor: isFaceDown ? '#000000' : '#171717' }}
    >
      {/* 隠しオーディオ要素 */}
      <audio ref={audioRef} src="/rain.mp3" loop hidden />

      {!permissionGranted ? (
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-light tracking-widest mb-8">ZEN FLIP</h1>
          <p className="text-neutral-400">音を鳴らすには、センサーの許可が必要です。</p>
          <button
            onClick={requestPermission}
            className="px-8 py-3 border border-neutral-600 rounded-full hover:bg-neutral-800 transition active:scale-95"
          >
            Start Experience
          </button>
        </div>
      ) : (
        <div className="text-center space-y-4 animate-in fade-in duration-700">
          <div className="text-6xl mb-4">
            {isFaceDown ? '🌙' : '👀'}
          </div>
          <p className="text-xl font-light tracking-wider">
            {isFaceDown ? 'Resting...' : 'Place face down'}
          </p>
          <p className="text-xs text-neutral-600 mt-8 font-mono">
            {debugInfo}
          </p>
        </div>
      )}
    </main>
  );
}
