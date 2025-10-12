import { TimerIcon } from "lucide-react";

interface TimerProps {
  timeLeft: number;
}

export default function Timer({ timeLeft }: TimerProps) {
  return (
    <div
      data-testid="timer"
      className={`flex items-center justify-center space-x-2 text-2xl font-bold mb-8 ${
        timeLeft <= 10 ? 'text-red-600' : 'text-gray-700'
      }`}
    >
      <TimerIcon className="w-6 h-6" />
      <span data-testid="timer-value">{timeLeft}s</span>
    </div>
  );
}