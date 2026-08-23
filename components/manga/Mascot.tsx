"use client";

import { useEffect, useRef } from "react";
import type { Mood } from "@/lib/types";

const INK = "var(--color-ink)";
const CREAM = "var(--color-cream)";
const RED = "var(--color-clay)";

/**
 * The mascots watch you — pupils (and the cat's head) drift a couple
 * of pixels toward the cursor. rAF-throttled, written straight to CSS
 * variables so React never re-renders, skipped for reduced motion.
 */
function useGaze<T extends SVGSVGElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.38;
        const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 340));
        const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 340));
        el.style.setProperty("--gx", `${(dx * 2.6).toFixed(2)}px`);
        el.style.setProperty("--gy", `${(dy * 1.8).toFixed(2)}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}

/**
 * Hand-drawn-style chibi shopkeeper + lucky shop cat, animated
 * purely with CSS (the .m-* keyframes live in globals.css).
 * Motion is layered: body sway → bob → breath → head bob →
 * blinks/glances, so characters never feel frozen.
 */

/* ————— eyes ————— */

const EYES: Record<Mood, React.ReactNode> = {
  celebrate: (
    <g stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none">
      <path d="M79 107 q11 -14 22 0" />
      <path d="M119 107 q11 -14 22 0" />
    </g>
  ),
  lonely: (
    <g>
      <g className="m-blink2">
        <ellipse cx={90} cy={106} rx={10} ry={12} fill="#fff" stroke={INK} strokeWidth={4} />
        <ellipse cx={130} cy={106} rx={10} ry={12} fill="#fff" stroke={INK} strokeWidth={4} />
        <g className="m-look">
          <g className="m-gaze">
            <circle cx={90} cy={109} r={3.6} fill={INK} />
            <circle cx={130} cy={109} r={3.6} fill={INK} />
          </g>
        </g>
      </g>
      <g stroke={INK} strokeWidth={3.5} strokeLinecap="round">
        <path d="M82 99 h16" />
        <path d="M122 99 h16" />
      </g>
    </g>
  ),
  waiting: (
    <g className="m-blink2">
      <ellipse cx={90} cy={105} rx={10.5} ry={13.5} fill="#fff" stroke={INK} strokeWidth={4} />
      <ellipse cx={130} cy={105} rx={10.5} ry={13.5} fill="#fff" stroke={INK} strokeWidth={4} />
      <g className="m-look">
        <g className="m-gaze">
          <circle cx={90} cy={108} r={4.8} fill={INK} />
          <circle cx={130} cy={108} r={4.8} fill={INK} />
          <circle cx={92.4} cy={104} r={1.7} fill={CREAM} />
          <circle cx={132.4} cy={104} r={1.7} fill={CREAM} />
        </g>
      </g>
    </g>
  ),
  problem: (
    <g>
      <ellipse cx={90} cy={105} rx={12} ry={15} fill="#fff" stroke={INK} strokeWidth={4} />
      <ellipse cx={130} cy={105} rx={12} ry={15} fill="#fff" stroke={INK} strokeWidth={4} />
      <g className="m-look">
        <g className="m-gaze">
          <circle cx={90} cy={106} r={2.8} fill={INK} />
          <circle cx={130} cy={106} r={2.8} fill={INK} />
        </g>
      </g>
    </g>
  ),
  curious: (
    <g className="m-blink2">
      <ellipse cx={90} cy={105} rx={10.5} ry={13.5} fill="#fff" stroke={INK} strokeWidth={4} />
      <ellipse cx={130} cy={105} rx={10.5} ry={13.5} fill="#fff" stroke={INK} strokeWidth={4} />
      <g className="m-look">
        <g className="m-gaze">
          <circle cx={90} cy={108} r={4.8} fill={INK} />
          <circle cx={130} cy={108} r={4.8} fill={INK} />
          <circle cx={92.4} cy={104} r={1.7} fill={CREAM} />
          <circle cx={132.4} cy={104} r={1.7} fill={CREAM} />
        </g>
      </g>
    </g>
  ),
};

const BROWS: Record<Mood, React.ReactNode> = {
  celebrate: null,
  lonely: (
    <g stroke={INK} strokeWidth={4.5} strokeLinecap="round">
      <path d="M78 90 L100 82" />
      <path d="M120 82 L142 90" />
    </g>
  ),
  waiting: (
    <g stroke={INK} strokeWidth={4.5} strokeLinecap="round">
      <path d="M80 88 q10 -5 20 -2" fill="none" />
      <path d="M120 86 q10 -3 20 2" fill="none" />
    </g>
  ),
  problem: (
    <g stroke={INK} strokeWidth={4.5} strokeLinecap="round">
      <path d="M78 82 L100 92" />
      <path d="M120 92 L142 82" />
    </g>
  ),
  curious: (
    <g stroke={INK} strokeWidth={4.5} strokeLinecap="round">
      <path d="M80 88 q10 -5 20 -2" fill="none" />
      <path d="M120 78 q10 -4 20 2" fill="none" />
    </g>
  ),
};

const MOUTH: Record<Mood, React.ReactNode> = {
  celebrate: (
    <g>
      <path d="M98 124 q12 19 24 0 z" fill={INK} />
      <path d="M104 129 q6 5 12 0" fill="none" stroke={RED} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  ),
  lonely: (
    <path d="M100 131 q5 -7 10 0 q5 7 10 0" stroke={INK} strokeWidth={4.5} strokeLinecap="round" fill="none" />
  ),
  waiting: (
    <path d="M101 127 q9 9 18 0" stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
  ),
  problem: <ellipse cx={110} cy={131} rx={7.5} ry={10} fill={INK} />,
  curious: (
    <path d="M104 128 q6 6 12 0" stroke={INK} strokeWidth={4.5} strokeLinecap="round" fill="none" />
  ),
};

const ROOT_ANIM: Record<Mood, string> = {
  celebrate: "m-bounce",
  lonely: "m-sway",
  waiting: "m-sway",
  problem: "m-shake",
  curious: "m-sway",
};

const HEAD_TILT: Record<Mood, string> = {
  celebrate: "",
  lonely: "rotate(-4 110 98)",
  waiting: "",
  problem: "",
  curious: "rotate(5 110 98)",
};

/* ————— arms with mitten-thumb hands; waving arms snap with overshoot ————— */
function Arms({ mood }: { mood: Mood }) {
  const stroke = { stroke: INK, strokeWidth: 13, strokeLinecap: "round" } as const;
  const hand = (cx: number, cy: number) => (
    <g>
      <circle cx={cx} cy={cy} r={10.5} fill={CREAM} stroke={INK} strokeWidth={5} />
      <path
        d={`M${cx - 4} ${cy - 9} a6 6 0 0 1 8 0`}
        fill="none"
        stroke={INK}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </g>
  );
  if (mood === "celebrate" || mood === "problem") {
    return (
      <g>
        <g className="m-arm-wave-alt">
          <line x1={82} y1={160} x2={52} y2={124} {...stroke} />
          {hand(48, 118)}
        </g>
        <g className="m-arm-wave">
          <line x1={138} y1={160} x2={168} y2={124} {...stroke} />
          {hand(172, 118)}
        </g>
      </g>
    );
  }
  if (mood === "curious") {
    return (
      <g>
        <line x1={82} y1={160} x2={64} y2={198} {...stroke} />
        {hand(62, 202)}
        <line x1={138} y1={160} x2={150} y2={138} {...stroke} />
        {hand(146, 131)}
      </g>
    );
  }
  return (
    <g>
      <line x1={82} y1={160} x2={64} y2={198} {...stroke} />
      {hand(62, 202)}
      <g className="m-arm-wave">
        <line x1={138} y1={160} x2={170} y2={124} {...stroke} />
        {hand(173, 118)}
      </g>
    </g>
  );
}

/* ————— floating emotion marks ————— */
function Marks({ mood }: { mood: Mood }) {
  if (mood === "problem")
    return (
      <g className="m-pop">
        <rect x={172} y={18} width={11} height={28} rx={4} fill={RED} stroke={INK} strokeWidth={3} />
        <circle cx={177.5} cy={57} r={5.5} fill={RED} stroke={INK} strokeWidth={3} />
      </g>
    );
  if (mood === "celebrate")
    return (
      <g>
        <g className="m-pop">
          <path
            d="M182 26 l2.6 7.4 L192 36 l-7.4 2.6 L182 46 l-2.6 -7.4 L172 36 l7.4 -2.6 Z"
            fill={RED}
            stroke={INK}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        </g>
        <g className="m-pop-slow">
          <path
            d="M36 56 l2 5.6 L44 64 l-6 2.4 L36 72 l-2 -5.6 L28 64 l6 -2.4 Z"
            fill={RED}
            stroke={INK}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        </g>
      </g>
    );
  if (mood === "curious")
    return (
      <g className="m-pop">
        <text
          x={172}
          y={52}
          fontFamily="var(--font-anton)"
          fontSize={40}
          fill={RED}
          stroke={INK}
          strokeWidth={1.5}
        >
          ?
        </text>
      </g>
    );
  if (mood === "lonely")
    return (
      <g fill={INK} className="m-pop-slow">
        <circle cx={176} cy={40} r={3.5} />
        <circle cx={188} cy={33} r={3.5} />
        <circle cx={200} cy={26} r={3.5} />
      </g>
    );
  /* waiting — a little shop melody */
  return (
    <g className="m-pop-slow">
      <text x={176} y={46} fontSize={30} fill={RED} fontFamily="serif">
        ♪
      </text>
    </g>
  );
}

export function Chibi({ mood = "waiting", className }: { mood?: Mood; className?: string }) {
  const gazeRef = useGaze<SVGSVGElement>();
  const blush =
    mood === "celebrate" || mood === "problem" || mood === "waiting" ? (
      <g stroke={RED} strokeWidth={3.5} strokeLinecap="round">
        <path d="M72 120 l7 4.5" />
        <path d="M76 115 l7 4.5" />
        <path d="M80 125 l7 4.5" />
        <path d="M141 124.5 l7 -4.5" />
        <path d="M145 119.5 l7 -4.5" />
        <path d="M137 129.5 l7 -4.5" />
      </g>
    ) : null;

  return (
    <svg
      ref={gazeRef}
      viewBox="0 0 220 260"
      className={className}
      role="img"
      aria-label={`Chibi shopkeeper, ${mood}`}
    >
      <ellipse cx={110} cy={248} rx={54} ry={8} fill="rgba(22,19,14,0.12)" />

      <g className={ROOT_ANIM[mood]}>
        <g className={mood === "celebrate" ? "" : "m-bob"}>
          {/* legs + manga sneakers */}
          <rect x={91} y={198} width={14} height={36} rx={7} fill={INK} />
          <rect x={115} y={198} width={14} height={36} rx={7} fill={INK} />
          <ellipse cx={96} cy={238} rx={15} ry={7.5} fill={INK} />
          <ellipse cx={124} cy={238} rx={15} ry={7.5} fill={INK} />
          <path d="M85 238 q11 7 22 0" fill="none" stroke={CREAM} strokeWidth={3} strokeLinecap="round" />
          <path d="M113 238 q11 7 22 0" fill="none" stroke={CREAM} strokeWidth={3} strokeLinecap="round" />

          <Arms mood={mood} />

          {/* breathing torso: shirt, apron, belt */}
          <g className="m-breathe">
            <path
              d="M80 152 C78 147 84 145 88 147 L132 147 C136 145 142 147 140 152 L144 200 C144 206 140 210 134 210 L86 210 C80 210 76 206 76 200 Z"
              fill={CREAM}
              stroke={INK}
              strokeWidth={5}
              strokeLinejoin="round"
            />
            {/* apron with the house mark */}
            <path
              d="M86 156 L134 156 L138 202 L82 202 Z"
              fill="#fff"
              stroke={INK}
              strokeWidth={4}
              strokeLinejoin="round"
            />
            <text x={110} y={190} textAnchor="middle" fontSize={20} fill={RED} fontFamily="var(--font-jp)">
              人
            </text>
            {/* apron straps + belt */}
            <path d="M88 150 L92 156 M132 150 L128 156" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
            <path d="M78 200 H142" stroke={INK} strokeWidth={4} />
          </g>

          {/* head — attribute tilt outside, CSS bob inside */}
          <g transform={HEAD_TILT[mood]}>
            <g className="m-head-bob">
              <circle cx={62} cy={104} r={6} fill={CREAM} stroke={INK} strokeWidth={4} />
              <circle cx={158} cy={104} r={6} fill={CREAM} stroke={INK} strokeWidth={4} />
              <ellipse cx={110} cy={98} rx={48} ry={45} fill={CREAM} stroke={INK} strokeWidth={5} />
              {/* hair with zigzag bangs + shine strokes */}
              <path
                d="M62 96 C60 48 82 30 110 30 C138 30 160 48 158 96 L149 76 L141 94 L131 70 L121 92 L110 64 L99 92 L89 70 L79 94 L71 76 Z"
                fill={INK}
              />
              <path d="M62 96 C60 110 62 122 66 132 L74 128 C70 118 69 106 70 96 Z" fill={INK} />
              <path d="M158 96 C160 110 158 122 154 132 L146 128 C150 118 151 106 150 96 Z" fill={INK} />
              <g stroke={CREAM} strokeWidth={3} strokeLinecap="round" opacity={0.45}>
                <path d="M92 44 q9 -6 17 -6" />
                <path d="M114 40 q8 1 13 6" />
              </g>
              {/* ahoge */}
              <path
                className="m-ahoge"
                d="M110 31 q2 -17 19 -21 q-9 9 -8 21"
                fill="none"
                stroke={INK}
                strokeWidth={5}
                strokeLinecap="round"
              />
              {EYES[mood]}
              {BROWS[mood]}
              <circle cx={110} cy={117} r={1.4} fill={INK} />
              {MOUTH[mood]}
              {blush}
            </g>
          </g>
        </g>
      </g>
      <Marks mood={mood} />
    </svg>
  );
}

/** Maneki-neko shop cat — sways, wags, swings its bell, waves the lucky paw. */
export function LuckyCat({ className }: { className?: string }) {
  const gazeRef = useGaze<SVGSVGElement>();
  return (
    <svg ref={gazeRef} viewBox="0 0 200 230" className={className} role="img" aria-label="Lucky shop cat">
      <ellipse cx={100} cy={222} rx={48} ry={7} fill="rgba(22,19,14,0.12)" />

      <g className="m-sway">
        {/* wagging tail */}
        <path
          className="m-tail"
          d="M150 192 q28 -6 24 -30"
          stroke={INK}
          strokeWidth={9}
          strokeLinecap="round"
          fill="none"
        />

        <g className="m-breathe">
          <ellipse cx={100} cy={168} rx={54} ry={46} fill={CREAM} stroke={INK} strokeWidth={5} />
          {/* belly patch */}
          <ellipse cx={100} cy={180} rx={22} ry={17} fill="#fff" stroke={INK} strokeWidth={3.5} />

          {/* left paw + floating lucky coin */}
          <line x1={58} y1={140} x2={44} y2={168} stroke={INK} strokeWidth={10} strokeLinecap="round" />
          <g className="m-float">
            <circle cx={40} cy={180} r={14} fill={RED} stroke={INK} strokeWidth={4} />
            <text x={40} y={186} textAnchor="middle" fontSize={14} fill={CREAM} fontFamily="var(--font-jp)">
              人
            </text>
          </g>
        </g>

        {/* waving paw with toe beans */}
        <g className="m-arm-wave">
          <line x1={142} y1={140} x2={160} y2={114} stroke={INK} strokeWidth={10} strokeLinecap="round" />
          <circle cx={164} cy={107} r={12} fill={CREAM} stroke={INK} strokeWidth={5} />
          <circle cx={160} cy={102} r={1.6} fill={RED} />
          <circle cx={167} cy={104} r={1.6} fill={RED} />
        </g>

        {/* head — slow curious tilt cycle, plus a lean toward your cursor */}
        <g className="m-tilt">
          <g className="m-gaze">
          <path d="M62 60 L54 20 L88 46 Z" fill={CREAM} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M64 52 L60 32 L79 45 Z" fill={RED} />
          <path d="M138 60 L146 20 L112 46 Z" fill={INK} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <circle cx={100} cy={88} r={48} fill={CREAM} stroke={INK} strokeWidth={5} />
          {/* calico patch with tabby stripes */}
          <path d="M60 56 C66 42 86 36 96 40 C86 46 76 54 72 64 C66 62 60 60 60 56 Z" fill={INK} />
          <g stroke={CREAM} strokeWidth={2.5} strokeLinecap="round" opacity={0.6}>
            <path d="M76 46 l4 6" />
            <path d="M84 42 l3 6" />
          </g>
          {/* face */}
          <g stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none">
            <path d="M78 88 q8 -11 16 0" />
            <path d="M106 88 q8 -11 16 0" />
          </g>
          <path d="M96.5 100 L103.5 100 L100 106 Z" fill={RED} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M100 106 q-4 6 -10 2 M100 106 q4 6 10 2" stroke={INK} strokeWidth={3.5} strokeLinecap="round" fill="none" />
          <g stroke={INK} strokeWidth={3.5} strokeLinecap="round">
            <path d="M38 80 L58 84" />
            <path d="M36 92 L57 92" />
            <path d="M38 104 L58 100" />
            <path d="M162 84 L182 80" />
            <path d="M163 92 L184 92" />
            <path d="M162 100 L182 104" />
          </g>
          {/* cheek blush */}
          <g stroke={RED} strokeWidth={3} strokeLinecap="round">
            <path d="M70 100 l5 3" />
            <path d="M125 103 l5 -3" />
          </g>
          <g className="m-pop-slow">
            <path
              d="M176 34 l2.4 6.8 L186 44 l-7.6 3.2 L176 54 l-2.4 -6.8 L166 44 l7.6 -3.2 Z"
              fill={RED}
              stroke={INK}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
          </g>
          </g>
        </g>

        {/* collar + swinging bell */}
        <path d="M60 128 q40 18 80 0 l-2 8 q-38 14 -76 0 Z" fill={RED} stroke={INK} strokeWidth={4} />
        <g className="m-bell">
          <circle cx={100} cy={144} r={9} fill={CREAM} stroke={INK} strokeWidth={4} />
          <path d="M93.5 141 h13" stroke={INK} strokeWidth={3} />
          <circle cx={100} cy={147.5} r={1.8} fill={INK} />
        </g>

        {/* front paws */}
        <ellipse cx={76} cy={206} rx={13} ry={9} fill={CREAM} stroke={INK} strokeWidth={4.5} />
        <ellipse cx={124} cy={206} rx={13} ry={9} fill={CREAM} stroke={INK} strokeWidth={4.5} />
      </g>
    </svg>
  );
}
