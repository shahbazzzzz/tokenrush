import { motion } from 'framer-motion';

interface Props {
  className?: string;
  animate?: boolean;
}

export const CrashMasterIcon = ({ className = '', animate = true }: Props) => {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <defs>
        <radialGradient id="crashGradient">
          <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0.1" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <circle cx="60" cy="60" r="55" fill="url(#crashGradient)" />
      
      {/* Grid lines */}
      <g strokeOpacity="0.2" stroke="#4ECDC4" strokeWidth="0.5">
        {[20, 40, 60, 80, 100].map(y => (
          <line key={y} x1="10" y1={y} x2="110" y2={y} />
        ))}
        {[20, 40, 60, 80, 100].map(x => (
          <line key={x} x1={x} y1="10" x2={x} y2="110" />
        ))}
      </g>
      
      {/* Crash graph line */}
      <motion.path
        d="M 20 80 Q 40 70, 50 65 T 70 45 Q 80 35, 85 25"
        stroke="#FF6B6B"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        filter="url(#glow)"
        initial={{ pathLength: 0 }}
        animate={animate ? { pathLength: 1 } : {}}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
      />
      
      {/* Explosion at crash point */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={animate ? { scale: [0, 1.5, 1], opacity: [0, 1, 0.8] } : {}}
        transition={{ duration: 0.5, delay: 2, repeat: Infinity, repeatDelay: 2.5 }}
      >
        <circle cx="85" cy="25" r="8" fill="#FFE66D" opacity="0.8" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <line
            key={angle}
            x1="85"
            y1="25"
            x2={85 + 12 * Math.cos((angle * Math.PI) / 180)}
            y2={25 + 12 * Math.sin((angle * Math.PI) / 180)}
            stroke="#FFE66D"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
      </motion.g>
      
      {/* Multiplier text */}
      <motion.text
        x="60"
        y="105"
        textAnchor="middle"
        fill="#4ECDC4"
        fontSize="14"
        fontWeight="bold"
        initial={{ opacity: 0 }}
        animate={animate ? { opacity: [0, 1, 1, 0] } : {}}
        transition={{ duration: 3, repeat: Infinity }}
      >
        2.5x
      </motion.text>
    </svg>
  );
};
