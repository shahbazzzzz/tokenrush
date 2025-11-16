import { motion } from 'framer-motion';

interface Props {
  className?: string;
  animate?: boolean;
}

export const LimboLeapIcon = ({ className = '', animate = true }: Props) => {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1A1A2E" />
          <stop offset="50%" stopColor="#16213E" />
          <stop offset="100%" stopColor="#0F3460" />
        </linearGradient>
        <radialGradient id="rocketGradient">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#FF4444" />
        </radialGradient>
        <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE66D" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF6B6B" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="120" height="120" fill="url(#skyGradient)" />

      {/* Stars */}
      {[
        { x: 20, y: 20, size: 1 },
        { x: 40, y: 15, size: 1.5 },
        { x: 80, y: 25, size: 1 },
        { x: 100, y: 30, size: 1.2 },
        { x: 30, y: 40, size: 1 },
        { x: 90, y: 45, size: 1.3 },
      ].map((star, i) => (
        <motion.circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.size}
          fill="#FFE66D"
          initial={{ opacity: 0.3 }}
          animate={animate ? { opacity: [0.3, 1, 0.3] } : {}}
          transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
        />
      ))}

      {/* Rocket */}
      <motion.g
        initial={{ y: 0 }}
        animate={animate ? { 
          y: [-40, -60, -40],
          rotate: [-5, 0, 5, 0, -5]
        } : {}}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ transformOrigin: '60px 80px' }}
      >
        {/* Rocket body */}
        <ellipse cx="60" cy="80" rx="12" ry="20" fill="url(#rocketGradient)" />
        
        {/* Rocket tip */}
        <path
          d="M 48 75 Q 60 55 72 75"
          fill="url(#rocketGradient)"
        />
        
        {/* Rocket window */}
        <circle cx="60" cy="75" r="5" fill="#4ECDC4" opacity="0.8" />
        
        {/* Rocket fins */}
        <path d="M 48 85 L 43 95 L 48 90" fill="#FF4444" />
        <path d="M 72 85 L 77 95 L 72 90" fill="#FF4444" />

        {/* Flame */}
        <motion.g
          animate={animate ? {
            scaleY: [1, 1.3, 0.8, 1],
            opacity: [0.8, 1, 0.8, 0.8]
          } : {}}
          transition={{
            duration: 0.3,
            repeat: Infinity
          }}
          style={{ transformOrigin: '60px 100px' }}
        >
          <ellipse cx="60" cy="100" rx="8" ry="15" fill="url(#flameGradient)" opacity="0.9" />
          <ellipse cx="60" cy="98" rx="5" ry="10" fill="#FFE66D" opacity="0.8" />
        </motion.g>
      </motion.g>

      {/* Height indicator lines */}
      <g opacity="0.3">
        {[30, 50, 70].map(y => (
          <line
            key={y}
            x1="10"
            y1={y}
            x2="110"
            y2={y}
            stroke="#4ECDC4"
            strokeWidth="0.5"
            strokeDasharray="5,5"
          />
        ))}
      </g>

      {/* Multiplier text */}
      <motion.text
        x="60"
        y="15"
        textAnchor="middle"
        fill="#4ECDC4"
        fontSize="14"
        fontWeight="bold"
        initial={{ opacity: 0 }}
        animate={animate ? { 
          opacity: [0, 1, 1, 0],
          scale: [1, 1.2, 1.2, 1]
        } : {}}
        transition={{ 
          duration: 3,
          repeat: Infinity
        }}
      >
        5.2x
      </motion.text>
    </svg>
  );
};
