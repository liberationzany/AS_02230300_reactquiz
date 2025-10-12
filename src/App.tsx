import { useEffect, useState } from "react";
import GameOver from "./components/game-over";
import QuestionCard from "./components/question-card";
import StartScreen from "./components/start-screen";
import { GameState } from "./types/quiz";
import { QUESTIONS } from "./data/questions";
import Timer from "./components/timer";

// detect if running in test mode
const TEST_MODE = import.meta.env.VITE_TEST === "true";
const INITIAL_TIME = TEST_MODE ? 5 : 30; // 5s in tests, 30s normally

function App() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  // ✅ Use shorter timer in test mode (5s instead of 30s)
  const [timeLeft, setTimeLeft] = useState<number>(TEST_MODE ? 5 : 30);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  console.log("🚀 Timer starts at:", INITIAL_TIME, "seconds (TEST_MODE:", TEST_MODE, ")");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === "playing" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState("end");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleStart = async () => {
    if (!isStarting) {
      setIsStarting(true);
    }

    setTimeout(() => {
      if (gameState === "start") {
        setGameState("playing");
        setTimeLeft(INITIAL_TIME);
      
        setScore(0);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
      }
      setIsStarting(false);
    }, 100);
  };

  const handleRestart = () => {
    setGameState("start");
    setScore(0);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setTimeLeft(INITIAL_TIME);

    setIsStarting(false);
  };

  const handleAnswer = (index: number): void => {
    if (selectedAnswer !== null) return; // Prevent multiple selections

    setSelectedAnswer(index);
    const isCorrect = index === QUESTIONS[currentQuestion].correct;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestion < QUESTIONS.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer(null);
      } else {
        setGameState("end");
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        {gameState === "start" && <StartScreen onStart={handleStart} />}
        {gameState === "playing" && (
          <div className="p-8">
            <Timer timeLeft={timeLeft} />
            <QuestionCard
              question={QUESTIONS[currentQuestion]}
              onAnswerSelect={handleAnswer}
              selectedAnswer={selectedAnswer}
              totalQuestions={QUESTIONS.length}
              currentQuestion={currentQuestion}
            />
            <div className="mt-6 text-center text-gray-600" data-testid="score">
              Score: {score}/{QUESTIONS.length}
            </div>
          </div>
        )}
        {gameState === "end" && (
          <GameOver
            score={score}
            totalQuestions={QUESTIONS.length}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
}



export default App;
