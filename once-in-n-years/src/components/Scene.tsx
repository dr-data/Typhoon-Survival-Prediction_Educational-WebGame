export function HarbourScene() {
  return (
    <div className="scene" aria-hidden="true">
      <div className="scene-sky" />
      <div className="scene-stars" />
      <div className="scene-moon" />
      <svg className="scene-city" viewBox="0 0 1200 280" preserveAspectRatio="xMidYMax slice">
        <path
          fill="#081526"
          d="M0 280 V190 H40 V140 H70 V190 H110 V88 H150 V190 H180 V150 H220 V190 H260 V70 H310 V190 H340 V120 H390 V190 H430 V100 H480 V190 H520 V60 H580 V190 H620 V130 H670 V190 H710 V80 H760 V190 H800 V110 H860 V190 H900 V50 H960 V190 H1000 V140 H1040 V190 H1080 V100 H1120 V190 H1200 V280 Z"
        />
        <rect x="292" y="92" width="6" height="10" fill="#f0b429" />
        <rect x="548" y="82" width="6" height="10" fill="#3ec8e0" />
        <rect x="928" y="72" width="6" height="10" fill="#f0b429" />
        <path d="M0 230 Q300 200 600 230 T1200 220 V280 H0 Z" fill="#0a2a44" opacity="0.9" />
        <path d="M0 248 Q200 232 480 248 T1200 240 V280 H0 Z" fill="#0d3554" />
      </svg>
      <div className="scene-rain" />
    </div>
  );
}

export function Nimbus({ mood = "idle" }: { mood?: "idle" | "cheer" | "think" | "oops" }) {
  const face = {
    idle: "◕‿◕",
    cheer: "★‿★",
    think: "◕_◕",
    oops: "◕︵◕",
  }[mood];
  return (
    <div className={`nimbus nimbus-${mood}`} aria-hidden="true">
      <svg viewBox="0 0 120 90" className="nimbus-svg">
        <ellipse cx="58" cy="48" rx="42" ry="26" fill="#e8f4ff" />
        <circle cx="34" cy="42" r="18" fill="#e8f4ff" />
        <circle cx="58" cy="32" r="20" fill="#f7fbff" />
        <circle cx="82" cy="44" r="16" fill="#e8f4ff" />
        <circle cx="48" cy="44" r="4.2" fill="#123049" />
        <circle cx="70" cy="44" r="4.2" fill="#123049" />
        <path d="M50 56 Q60 62 70 56" fill="none" stroke="#123049" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M28 68 L24 80 M40 70 L38 82 M58 72 L58 84 M76 70 L78 82 M88 66 L94 78" stroke="#7ec8f0" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span className="nimbus-face">{face}</span>
    </div>
  );
}
