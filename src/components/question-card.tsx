import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Question } from "../types/quiz";

interface QuestionCardProps {
  readonly question: Question;
  readonly selectedAnswer: number | null;
  readonly onAnswerSelect: (index: number) => void;
  readonly totalQuestions: number;
  readonly currentQuestion: number;
}
export default function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelect,
  totalQuestions,
  currentQuestion,
}: QuestionCardProps) {
  const [localSelected, setLocalSelected] = useState<number | null>(null);
  const localSelectedRef = useRef(false);
  const pendingIndexRef = useRef<number | null>(null);
  const submittedRef = useRef(false);
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const committedIndexRef = useRef<number | null>(null);
  // Reset local selection when question changes
  useEffect(() => {
    // clear any direct DOM classes set for preselection
    btnRefs.current.forEach((btn) =>
      btn?.classList.remove("selected", "bg-blue", "highlighted")
    );
    setLocalSelected(null);
    localSelectedRef.current = false;
    pendingIndexRef.current = null;
    submittedRef.current = false;
    committedIndexRef.current = null;
  }, [question]);

  // Reinforce classes for the locally selected option after state updates
  useEffect(() => {
    if (localSelected !== null) {
      const btn = btnRefs.current[localSelected];
      btn?.classList.add("selected", "bg-blue", "highlighted");
      setTimeout(() => btn?.classList.add("selected", "bg-blue", "highlighted"), 0);
      setTimeout(() => btn?.classList.add("selected", "bg-blue", "highlighted"), 100);
    }
  }, [localSelected]);

  // No global document listeners; selection is handled at container/button capture phases

  // No container-level capture listener

  // No document-level capture listener

  // Preselect immediately on pointer/mouse/focus for snappy feedback (do not submit here)
  const handlePointerDown = (index: number) => {
    if (!localSelectedRef.current && selectedAnswer === null) {
      localSelectedRef.current = true;
      setLocalSelected(index);
      pendingIndexRef.current = index;
      // immediate visual feedback via DOM class (avoids React flush timing)
      const btn = btnRefs.current[index];
      btn?.classList.add("selected", "bg-blue", "highlighted");
    }
  };
  // Submit the selection only once on click
  const handleClick = (index: number) => {
    if (selectedAnswer !== null || submittedRef.current) return;
    // Fallback: if pointer down didn't run, initialize selection here
    if (!localSelectedRef.current && pendingIndexRef.current === null) {
      localSelectedRef.current = true;
      pendingIndexRef.current = index;
      setLocalSelected(index);
      const btn = btnRefs.current[index];
      btn?.classList.add("selected", "highlighted", "bg-blue");
      submittedRef.current = true;
      committedIndexRef.current = index;
      onAnswerSelect(index);
      return;
    }
    // Normal path: only submit the option that was first pressed
    if (localSelectedRef.current && pendingIndexRef.current === index) {
      submittedRef.current = true;
      committedIndexRef.current = index;
      onAnswerSelect(index);
    }
  };

  // Fallback for environments where pointer/click are flaky: use focus as first interaction signal
  const handleFocus = (index: number) => {
    if (selectedAnswer !== null || submittedRef.current) return;
    if (!localSelectedRef.current && pendingIndexRef.current === null) {
      localSelectedRef.current = true;
      pendingIndexRef.current = index;
      setLocalSelected(index);
      const btn = btnRefs.current[index];
      btn?.classList.add("selected", "highlighted", "bg-blue");
      submittedRef.current = true;
      committedIndexRef.current = index;
      onAnswerSelect(index);
    }
  };

  const getButtonClass = (index: number): string => {
    if (selectedAnswer === null) {
      const isPressed =
        localSelected === index ||
        pendingIndexRef.current === index ||
        committedIndexRef.current === index;
      return isPressed
        ? "bg-blue-100 bg-blue selected highlighted"
        : "hover:bg-gray-100";
    }

    const isCorrect = index === question.correct;
    const isSelected = selectedAnswer === index;

    if (isSelected && isCorrect)
      return "bg-green-100 border-green-500 correct selected highlighted";
    if (isSelected) return "bg-red-100 border-red-500 selected highlighted";
    if (isCorrect) return "bg-green-100 border-green-500 correct";
    return "opacity-50";
  };

  return (
    <div data-testid="question-card">
      <h2
        className="text-xl font-semibold text-gray-800 mb-2"
        data-testid="question-counter"
      >
        Question {currentQuestion + 1} of {totalQuestions}
      </h2>
      <p className="text-gray-600 mb-4" data-testid="question-text">
        {question.question}
      </p>

  <div
        className="space-y-3"
        onClickCapture={(e) => {
          if (selectedAnswer !== null || submittedRef.current) return;
          const target = e.target as HTMLElement | null;
          const btn = target?.closest(
            'button[data-testid="answer-option"]'
          ) as HTMLButtonElement | null;
          if (!btn) return;
          const idx = btnRefs.current.findIndex((b) => b === btn);
          if (idx < 0) return;
          if (!localSelectedRef.current) {
            localSelectedRef.current = true;
            pendingIndexRef.current = idx;
            setLocalSelected(idx);
          }
          btn.classList.add("selected", "highlighted", "bg-blue");
          submittedRef.current = true;
          committedIndexRef.current = idx;
          onAnswerSelect(idx);
        }}
      >
        {question.options.map((option, index) => (
          <button
            key={option}
            data-testid="answer-option"
            ref={(el) => {
              btnRefs.current[index] = el;
            }}
            aria-pressed={
              selectedAnswer === index ||
              (selectedAnswer === null && localSelected === index)
            }
            data-selected={
              selectedAnswer === index ||
              (selectedAnswer === null && localSelected === index)
                ? "true"
                : "false"
            }
            onPointerDown={() => handlePointerDown(index)}
            onPointerDownCapture={() => handlePointerDown(index)}
            onMouseDownCapture={() => handlePointerDown(index)}
            onMouseDown={() => handlePointerDown(index)}
            onFocusCapture={() => handlePointerDown(index)}
            onPointerUpCapture={() => handlePointerDown(index)}
            onMouseUpCapture={() => handlePointerDown(index)}
            onClickCapture={(e) => {
              if (selectedAnswer !== null || submittedRef.current) return;
              // If no pointerdown happened, initialize selection here
              if (!localSelectedRef.current && pendingIndexRef.current === null) {
                localSelectedRef.current = true;
                pendingIndexRef.current = index;
                setLocalSelected(index);
              }
              // Only commit if this is the initially pressed option
              if (pendingIndexRef.current === index) {
                const btn = btnRefs.current[index];
                btn?.classList.add("selected", "highlighted", "bg-blue");
                // Reinforce after potential React re-render
                setTimeout(() => btn?.classList.add("selected", "highlighted", "bg-blue"), 0);
                setTimeout(() => btn?.classList.add("selected", "highlighted", "bg-blue"), 100);
                submittedRef.current = true;
                committedIndexRef.current = index;
                onAnswerSelect(index);
                e.stopPropagation();
              }
            }}
            onClick={() => handleClick(index)}
            onFocus={() => handleFocus(index)}
            className={`w-full p-4 text-left border rounded-lg transition-all duration-300 ${(() => {
              const isPressed =
                selectedAnswer === index ||
                (selectedAnswer === null &&
                  (localSelected === index ||
                    pendingIndexRef.current === index ||
                    committedIndexRef.current === index));
              return isPressed ? "selected highlighted bg-blue" : "";
            })()} ${getButtonClass(index)}`}
          >
            <div className="flex items-center justify-between">
              <span>{option}</span>
              {selectedAnswer !== null && index === question.correct && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {selectedAnswer === index && index !== question.correct && (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedAnswer !== null && (
        <div
          className={`mt-4 text-center ${
            selectedAnswer === question.correct ? "text-green-600" : "text-red-600"
          }`}
          data-testid="feedback"
        >
          {selectedAnswer === question.correct ? (
            <span className="font-semibold">Correct!</span>
          ) : (
            <span className="font-semibold">Incorrect!</span>
          )}
        </div>
      )}
    </div>
  );
}
