import { motion } from 'framer-motion';

interface Props {
  className?: string;
  animate?: boolean;
}

export const DiceHeroIcon = ({ className = '', animate = true }: Props) => {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="diceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE66D" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFA500" stopOpacity="0.9" />
        </linearGradient>
        <filter id="diceShadow">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
        </filter>
      </defs>

      {/* Background sparkles */}
      <g opacity="0.5">
        {[
          { x: 20, y: 20 },
          { x: 100, y: 30 },
          { x: 30, y: 90 },
          { x: 90, y: 85 },
        ].map((pos, i) => (
          <motion.g
            key={i}
            initial={{ scale: 0 }}
            animate={animate ? { scale: [1, 1.5, 1], rotate: [0, 180, 360] } : {}}
            transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
          >
            <circle cx={pos.x} cy={pos.y} r="2" fill="#FFE66D" />
            {[0, 90, 180, 270].map(angle => (
              <line
                key={angle}
                x1={pos.x}
                y1={pos.y}
                x2={pos.x + 5 * Math.cos((angle * Math.PI) / 180)}
                y2={pos.y + 5 * Math.sin((angle * Math.PI) / 180)}
                stroke="#FFE66D"
                strokeWidth="1"
                strokeLinecap="round"
              />
            ))}
          </motion.g>
        ))}
      </g>

      {/* Main dice */}
      <motion.g
        initial={{ rotate: 0 }}
        animate={animate ? { 
          rotate: [0, 360, 720, 1080, 1440, 1440],
          scale: [1, 1.1, 1]
        } : {}}
        transition={{ 
          duration: 2, 
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          repeat: Infinity,
          repeatDelay: 1
        }}
        style={{ transformOrigin: '60px 60px' }}
      >
        <rect
          x="35"
          y="35"
          width="50"
          height="50"
          rx="8"
          fill="url(#diceGradient)"
          stroke="#FF6B6B"
          strokeWidth="2"
          filter="url(#diceShadow)"
        />

        {/* Dice dots (showing 6) */}
        <g fill="#1A1A2E">
          {/* Left column */}
          <circle cx="45" cy="45" r="4" />
          <circle cx="45" cy="60" r="4" />
          <circle cx="45" cy="75" r="4" />
          {/* Right column */}
          <circle cx="75" cy="45" r="4" />
          <circle cx="75" cy="60" r="4" />
          <circle cx="75" cy="75" r="4" />
        </g>
      </motion.g>

      {/* Win indicator */}
      <motion.text
        x="60"
        y="105"
        textAnchor="middle"
        fill="#4ECDC4"
        fontSize="16"
        fontWeight="bold"
        initial={{ opacity: 0 }}
        animate={animate ? { 
          opacity: [0, 0, 0, 0, 0, 1],
          scale: [1, 1, 1, 1, 1, 1.2]
        } : {}}
        transition={{ 
          duration: 2,
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          repeat: Infinity,
          repeatDelay: 1
        }}
      >
        WINNER!
      </motion.text>
    </svg>
  );
};
