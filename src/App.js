import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

const GRID_SIZE = 25;
const CELL_SIZE = 20;
const INITIAL_SPEED = 100;

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  w: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  s: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  a: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  d: { x: 1, y: 0 }
};

function SnakeGame() {
  // Game state
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Refs
  const lastRenderTimeRef = useRef(0);
  const speed = useRef(INITIAL_SPEED);
  const gameAreaRef = useRef(null);
  const requestRef = useRef();

  // Generate food with collision check
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    
    if (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      return generateFood();
    }
    return newFood;
  }, [snake]);

  // Handle keyboard input
  const handleKeyPress = useCallback((e) => {
    if (e.key === ' ') {
      setIsPaused(prev => !prev);
      return;
    }

    const newDirection = DIRECTIONS[e.key];
    if (newDirection) {
      // Prevent 180-degree turns
      if (direction.x + newDirection.x !== 0 || direction.y + newDirection.y !== 0) {
        setDirection(newDirection);
      }
    }
  }, [direction]);

  // Handle touch controls for mobile
  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchMove = (e) => {
    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const xDiff = touchEnd.x - touchStart.x;
    const yDiff = touchEnd.y - touchStart.y;
    
    // Determine swipe direction
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      // Horizontal swipe
      if (xDiff > 0 && direction.x !== -1) {
        setDirection({ x: 1, y: 0 }); // Right
      } else if (xDiff < 0 && direction.x !== 1) {
        setDirection({ x: -1, y: 0 }); // Left
      }
    } else {
      // Vertical swipe
      if (yDiff > 0 && direction.y !== -1) {
        setDirection({ x: 0, y: 1 }); // Down
      } else if (yDiff < 0 && direction.y !== 1) {
        setDirection({ x: 0, y: -1 }); // Up
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Game loop using requestAnimationFrame
  const gameLoop = useCallback((timestamp) => {
    if (gameOver || isPaused) return;
    
    const deltaTime = timestamp - lastRenderTimeRef.current;
    
    if (deltaTime >= speed.current) {
      setSnake(prevSnake => {
        const head = { 
          x: prevSnake[0].x + direction.x, 
          y: prevSnake[0].y + direction.y 
        };

        // Check collisions
        if (
          head.x < 0 || head.x >= GRID_SIZE ||
          head.y < 0 || head.y >= GRID_SIZE ||
          prevSnake.some(segment => segment.x === head.x && segment.y === head.y)
        ) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];
        if (head.x === food.x && head.y === food.y) {
          setFood(generateFood());
          setScore(prev => prev + 1);
          speed.current = Math.max(50, INITIAL_SPEED - (score * 2));
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
      
      lastRenderTimeRef.current = timestamp;
    }
    
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [direction, food, gameOver, isPaused, generateFood, score]);

  // Set up and clean up game loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameLoop]);

  // Event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Reset game
  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection({ x: 1, y: 0 });
    setGameOver(false);
    setScore(0);
    speed.current = INITIAL_SPEED;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🐍 Snake Game</h1>
        <div style={{ marginBottom: '10px' }}>
          <strong>Score: {score}</strong> | 
          <button onClick={() => setIsPaused(prev => !prev)}>
            {isPaused ? 'Resume' : 'Pause'}
          </button> |
          <button onClick={resetGame}>Restart</button>
        </div>
        
        <div
          ref={gameAreaRef}
          className="game-area"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {snake.map((segment, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: segment.x * CELL_SIZE,
                top: segment.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: i === 0 ? '#2E8B57' : '#3CB371',
                border: '1px solid #fff',
                borderRadius: i === 0 ? '30%' : '15%',
                transition: 'transform 0.1s ease',
                transform: i === 0 ? 'scale(1.1)' : 'scale(1)'
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: '#FF6347',
              borderRadius: '50%',
              boxShadow: '0 0 5px rgba(0,0,0,0.3)'
            }}
          />
        </div>

        {gameOver && (
          <div className="game-over">
            <h2>Game Over! Final Score: {score}</h2>
            <button 
              onClick={resetGame}
              className="play-again-button"
            >
              Play Again
            </button>
          </div>
        )}
        
        <p>Controls: {window.innerWidth > 768 ? 'WASD/Arrow Keys' : 'Swipe'} | Tap to pause</p>
      </header>
    </div>
  );
}

export default SnakeGame;