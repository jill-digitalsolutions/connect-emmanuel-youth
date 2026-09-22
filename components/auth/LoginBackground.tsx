export function LoginBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0A1030]">
      {/* Base navy gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A1030] via-[#0B1B4D] to-[#050A20]" />

      {/* Diagonal light-blue shape, top-right */}
      <div
        className="absolute -top-[30%] -right-[25%] h-[90%] w-[85%] rotate-[18deg] rounded-[45%] opacity-90 blur-3xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(87,169,255,0.85) 0%, rgba(47,114,242,0.55) 45%, rgba(11,20,64,0) 75%)",
        }}
      />
      <div
        className="absolute -top-[15%] right-[-10%] h-[60%] w-[60%] rotate-[12deg] rounded-[50%] opacity-80 blur-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(150,205,255,0.9) 0%, rgba(87,169,255,0.4) 50%, rgba(11,20,64,0) 80%)",
        }}
      />

      {/* Mountain silhouette along the bottom */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[22vh] w-full min-h-[140px]"
        viewBox="0 0 1000 220"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0,220 L0,140 L60,110 L140,150 L230,80 L320,130 L400,60 L470,120 L560,40 L650,110 L730,70 L820,130 L900,90 L1000,140 L1000,220 Z"
          fill="#050916"
          fillOpacity="0.92"
        />
        <path
          d="M0,220 L0,175 L90,150 L190,190 L280,140 L380,180 L480,130 L580,175 L680,145 L780,185 L880,150 L1000,180 L1000,220 Z"
          fill="#03050F"
        />
      </svg>
    </div>
  );
}
