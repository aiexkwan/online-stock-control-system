加入電腦螢幕規範

大螢幕
- 橫向最多支援 20格
- 直向最多支援 10格

小螢幕
- 橫向最多支援 15格
- 直向最多支援 10格

(WIDGET之間要留有平均的間隔)


查看public\screenshot\screenshot.png
1) 加以利用widget與頁面導航欄之間的空間
2) widget現時是5x5, 但顯示為長方形


public\screenshot\1.png
public\screenshot\2.png
public\screenshot\3.png
public\screenshot\4.png
public\screenshot\5.png

查看以上5個截圖
係 /admin-modern 頁面既設計草圖

幫我根據草圖
- 修改 /admin-modern 頁面
- 將 /admin 入面對應既widget 融入頁面


-將可以統一管理既部份都做成元件
-方使管理同日後維護,                    │
-同埋入面UI全數要用英文
-用以下作為標籤設計

import GradientButton from "@/components/ui/button-1";

const DemoOne = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center">
      <GradientButton
        onClick={() => console.log('clicked')}
        width="300px"
        height="60px"
        disabled={false}
      >
        Button
      </GradientButton>
    </div>
  );
};

export { DemoOne };



改用以下既code做widget既效果

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" cont
  nt="width=device-width, initial-scale=1.0">
  <title>Onboarding Inner Glow Card</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background: #16161A; }
    .card-container { opacity: 0; transform: scale(0.97); animation: fadeInScale 0.7s cubic-bezier(.46,.03,.52,.96) forwards;}
    @keyframes fadeInScale { 0% { opacity: 0; transform: scale(0.97);} 100% { opacity: 1; transform: scale(1);} }
    .cell { animation: fadeUpCell 0.7s cubic-bezier(.64,.09,.08,1) forwards; opacity: 0; transform: translateY(30px);}
    .cell-1 { animation-delay: 0.2s;}
    .cell-2 { animation-delay: 0.35s;}
    .cell-3 { animation-delay: 0.5s;}
    .cell-4 { animation-delay: 0.65s;}
    @keyframes fadeUpCell { 0% { opacity:0; transform: translateY(30px);} 100% {opacity:1; transform:translateY(0);} }
    .progress-dot { transition: background 0.3s; }
    .subtle-outline { outline: 1.5px solid rgba(100,112,140,0.10);}
    .subtle-outline-inner { border-color: rgba(120,130,150,0.09);}
    /* --- Glowing Inner Border --- */
    @property --rotation-angle {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }
    .glow-card {
      position: relative;
      border-radius: 1rem;
      overflow: visible;
    }
    .glow-card::before {
      content: '';
      position: absolute;
      z-index: 1;
      inset: 0;
      border-radius: 1rem;
      pointer-events: none;
      box-shadow: 0 0 32px 12px rgba(102,153,0,0.18),
                  0 0 48px 16px rgba(51,153,204,0.12),
                  0 0 0 2px rgba(204,238,102,0.08) inset;
      /* For conic-gradient border inner glow */
      background: conic-gradient(
        from var(--rotation-angle),
        #669900, #99cc33, #ccee66, 
        #006699, #3399cc, #990066, #cc3399, 
        #ff6600, #ff9900, #ffcc00, #669900
      );
      filter: blur(20px);
      opacity: 0.44;
      animation: rotate 4s linear infinite;
      mix-blend-mode: lighten;
    }
    @keyframes rotate {
      to { --rotation-angle: 360deg;}
    }
    .glow-card > .main-content {
      position: relative;
      z-index: 2;
      border-radius: 1rem;
      overflow: hidden;
    }
  </style>
</head>
<body class="min-h-screen grid place-items-center bg-gray-900">
  <div class="card-container flex items-center justify-center min-h-screen">
    <div class="glow-card max-w-[330px] w-[94vw] rounded-2xl">
      <div class="main-content overflow-hidden flex flex-col bg-[#18181C] border border-[#23232A]/40 shadow-xl shadow-black/20 subtle-outline rounded-2xl">
        <!-- Top Section -->
        <div class="relative w-full flex flex-col items-center justify-center bg-[#18181C] border-b border-[#23232A]/30 pt-8 pb-5 px-4">
          <div class="flex items-center justify-center h-full mb-3">
            <div class="w-[54px] h-[54px] rounded-xl bg-[#22222A] flex items-center justify-center border border-[#36384a]/30 shadow-sm subtle-outline">
              <svg class="w-8 h-8 text-[#8E8EA0]" fill="none" viewBox="0 0 32 32">
                <rect x="4" y="8" width="24" height="4" rx="2" fill="currentColor"/>
                <rect x="4" y="16" width="16" height="4" rx="2" fill="currentColor" opacity=".6"/>
                <rect x="4" y="24" width="8" height="4" rx="2" fill="currentColor" opacity=".3"/>
              </svg>
            </div>
          </div>
          <div class="text-[#eaeaea] text-base font-medium text-center max-w-[210px] leading-snug">
            Welcome! A quick setup to get you started.
          </div>
        </div>
        <!-- 2x2 Onboarding Grid -->
        <div class="px-5 pt-5 pb-1">
          <div class="grid grid-cols-2 grid-rows-2 gap-3">
            <!-- Cell 1 -->
            <div class="cell cell-1 flex flex-col items-center bg-[#23232A] rounded-lg py-5 px-2 shadow-xs hover:bg-[#23232a]/70 transition cursor-pointer border subtle-outline-inner subtle-outline">
              <div class="w-8 h-8 rounded-md bg-[#22222A] flex items-center justify-center mb-2 border subtle-outline-inner subtle-outline">
                <svg class="w-4.5 h-4.5 text-[#8E8EA0]" fill="none" viewBox="0 0 20 20">
                  <rect width="20" height="20" rx="4" fill="currentColor" fill-opacity="0.13"/>
                  <path d="M6 9.5l3 3 5-5" stroke="#A1A1AA" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span class="text-[13px] text-[#eaeaea] font-medium mt-1">Create Account</span>
            </div>
            <!-- Cell 2 -->
            <div class="cell cell-2 flex flex-col items-center bg-[#23232A] rounded-lg py-5 px-2 shadow-xs hover:bg-[#23232a]/70 transition cursor-pointer border subtle-outline-inner subtle-outline">
              <div class="w-8 h-8 rounded-md bg-[#22222A] flex items-center justify-center mb-2 border subtle-outline-inner subtle-outline">
                <svg class="w-4.5 h-4.5 text-[#8E8EA0]" fill="none" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" stroke="#A1A1AA" stroke-width="1.7"/>
                  <path d="M6.5 10.5l2 2 4-4" stroke="#A1A1AA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span class="text-[13px] text-[#eaeaea] font-medium mt-1">Verify Email</span>
            </div>
            <!-- Cell 3 -->
            <div class="cell cell-3 flex flex-col items-center bg-[#23232A] rounded-lg py-5 px-2 shadow-xs hover:bg-[#23232a]/70 transition cursor-pointer border subtle-outline-inner subtle-outline">
              <div class="w-8 h-8 rounded-md bg-[#22222A] flex items-center justify-center mb-2 border subtle-outline-inner subtle-outline">
                <svg class="w-4.5 h-4.5 text-[#8E8EA0]" fill="none" viewBox="0 0 20 20">
                  <rect x="3.5" y="7" width="13" height="6" rx="2" stroke="#A1A1AA" stroke-width="1.7"/>
                  <path d="M7 10h6" stroke="#A1A1AA" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="text-[13px] text-[#eaeaea] font-medium mt-1">Set Password</span>
            </div>
            <!-- Cell 4 -->
            <div class="cell cell-4 flex flex-col items-center bg-[#23232A] rounded-lg py-5 px-2 shadow-xs hover:bg-[#23232a]/70 transition cursor-pointer border subtle-outline-inner subtle-outline">
              <div class="w-8 h-8 rounded-md bg-[#22222A] flex items-center justify-center mb-2 border subtle-outline-inner subtle-outline">
                <svg class="w-4.5 h-4.5 text-[#8E8EA0]" fill="none" viewBox="0 0 20 20">
                  <rect x="6" y="6" width="8" height="8" rx="2" stroke="#A1A1AA" stroke-width="1.7"/>
                  <path d="M10 8v4" stroke="#A1A1AA" stroke-width="1.4" stroke-linecap="round"/>
                  <path d="M12 10h-4" stroke="#A1A1AA" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="text-[13px] text-[#eaeaea] font-medium mt-1">Personalize</span>
            </div>
          </div>
        </div>
        <!-- Progress Dots -->
        <div class="flex items-center justify-center space-x-2 mt-6 mb-1">
          <div class="progress-dot w-2.5 h-2.5 rounded-full bg-[#8E8EA0]"></div>
          <div class="progress-dot w-2 h-2 rounded-full bg-[#353542]"></div>
          <div class="progress-dot w-2 h-2 rounded-full bg-[#353542]"></div>
        </div>
        <!-- Continue Button -->
        <div class="px-5 pb-5 pt-1">
          <button class="w-full rounded-lg py-3 flex items-center justify-center bg-[#29292F] text-[#EAEAEA] text-sm font-medium border border-[#23232A]/40 shadow hover:bg-[#32323a] transition">
            Continue
          </button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
Aura Logo
Made in Aura

Meng To

Preview
Code


