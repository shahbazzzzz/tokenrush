import { motion } from 'framer-motion';

interface Props {
  className?: string;
  animate?: boolean;
}

export const MineQuestIcon = ({ className = '', animate = true }: Props) => {
  const gridSize = 5;
  const cellSize = 18;
  const startX = 15;
  const startY = 15;

  return (
    <svg
      viewBox="0 0 120 120"
      className={`w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ECDC4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4ECDC4" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id="gemGradient">
          <stop offset="0%" stopColor="#FFE66D" />
          <stop offset="100%" stopColor="#FFA500" />
        </radialGradient>
        <radialGradient id="mineGradient2">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#8B0000" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width="120" height="120" fill="url(#mineGradient)" rx="10" />

      {/* Grid cells */}
      {Array.from({ length: gridSize }).map((_, row) =>
        Array.from({ length: gridSize }).map((_, col) => {
          const x = startX + col * cellSize;
          const y = startY + row * cellSize;
          const isRevealed = (row + col) % 3 === 0;
          const isMine = row === 1 && col === 3;
          const isGem = row === 2 && col === 1;

          return (
            <motion.g key={`${row}-${col}`}>
              {/* Cell background */}
              <motion.rect
                x={x}
                y={y}
                width={cellSize - 2}
                height={cellSize - 2}
                rx="2"
                fill={isRevealed ? '#1A1A2E' : '#16213E'}
                stroke="#4ECDC4"
                strokeWidth="0.5"
                strokeOpacity="0.5"
                initial={{ scale: 0 }}
                animate={animate ? { scale: 1 } : {}}
                transition={{ delay: (row * gridSize + col) * 0.05 }}
              />

              {/* Revealed content */}
              {isRevealed && isMine && (
                <motion.g
                  initial={{ scale: 0, rotate: 0 }}
                  animate={animate ? { scale: 1, rotate: 360 } : {}}
                  transition={{ delay: 0.5 + (row * gridSize + col) * 0.05 }}
                >
                  {/* Mine */}
                  <circle
                    cx={x + cellSize / 2 - 1}
                    cy={y + cellSize / 2 - 1}
                    r="5"
                    fill="url(#mineGradient2)"
                  />
                  {/* Mine spikes */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                    <line
                      key={angle}
                      x1={x + cellSize / 2 - 1}
                      y1={y + cellSize / 2 - 1}
                      x2={x + cellSize / 2 - 1 + 7 * Math.cos((angle * Math.PI) / 180)}
                      y2={y + cellSize / 2 - 1 + 7 * Math.sin((angle * Math.PI) / 180)}
                      stroke="#FF6B6B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  ))}
                </motion.g>
              )}

              {isRevealed && isGem && (
                <motion.polygon
                  points={`${x + cellSize / 2 - 1},${y + 3} ${x + cellSize - 4},${y + cellSize / 2} ${x + cellSize / 2 - 1},${y + cellSize - 4} ${x + 2},${y + cellSize / 2}`}
                  fill="url(#gemGradient)"
                  initial={{ scale: 0, rotate: 0 }}
                  animate={animate ? { scale: 1, rotate: 360 } : {}}
                  transition={{ delay: 0.5 + (row * gridSize + col) * 0.05 }}
                />
              )}

              {!isRevealed && (
                <text
                  x={x + cellSize / 2 - 1}
                  y={y + cellSize / 2 + 2}
                  textAnchor="middle"
                  fill="#4ECDC4"
                  fontSize="12"
                  fontWeight="bold"
                  opacity="0.5"
                >
                  ?
                </text>
              )}
            </motion.g>
          );
        })
      )}

      {/* Score indicator */}
      <motion.text
        x="60"
        y="110"
        textAnchor="middle"
        fill="#FFE66D"
        fontSize="14"
        fontWeight="bold"
        initial={{ opacity: 0 }}
        animate={animate ? { opacity: 1 } : {}}
      >
        +50 💎
      </motion.text>
    </svg>
  );
};
