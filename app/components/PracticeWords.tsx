"use client";

import { usePracticeStore } from "@/lib/stores/practice-store";

function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{score}/100</p>
    </div>
  );
}

export function PracticeWords() {
  const currentWord = usePracticeStore((state) => state.currentWord);
  const answer = usePracticeStore((state) => state.answer);
  const evaluation = usePracticeStore((state) => state.evaluation);
  const statusMessage = usePracticeStore((state) => state.statusMessage);
  const isSubmitting = usePracticeStore((state) => state.isSubmitting);
  const setAnswer = usePracticeStore((state) => state.setAnswer);
  const pickRandomWord = usePracticeStore((state) => state.pickRandomWord);
  const submitAnswer = usePracticeStore((state) => state.submitAnswer);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Practice Words</h2>
        <p className="mt-2 text-sm text-slate-500">
          Practice your words by explaining words with your own words
        </p>
      </div>

      {statusMessage && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {statusMessage}
        </p>
      )}

      <div className="mt-6 flex flex-row gap-4">
        <div className="mt-6 flex flex-col gap-4">
          <p className="text-sm text-slate-500">
            {currentWord
              ? currentWord.word
              : "pick word randomly by pressing the button below!"}
          </p>
          <button
            type="button"
            className="rounded-md bg-sky-400 px-4 py-2 text-white hover:bg-sky-600"
            onClick={() => void pickRandomWord()}
          >
            I am lucky!
          </button>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <textarea
            className="min-h-[100px] w-full resize-none rounded-md border border-slate-300 p-2"
            placeholder="Enter your answer here..."
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
          />
          <button
            type="button"
            disabled={isSubmitting || !currentWord}
            className="mt-4 rounded-md bg-sky-400 px-4 py-2 text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-400"
            onClick={() => void submitAnswer()}
          >
            {isSubmitting ? "Submitting..." : "Submit Answer"}
          </button>
        </div>
      </div>

      <div>
        <p className="mt-4 text-sm text-slate-500">Your answer:</p>
        <p className="font-medium text-slate-400">
          {answer.trim() ? answer : "No answer yet"}
        </p>

        <p className="mt-4 text-sm text-slate-500">Evaluation:</p>
        {!evaluation ? (
          <p className="font-medium text-slate-400">No evaluation yet</p>
        ) : (
          <div className="mt-2 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ScoreBadge label="Overall" score={evaluation.overallScore} />
              <ScoreBadge label="Meaning" score={evaluation.meaning.score} />
              <ScoreBadge label="Grammar" score={evaluation.grammar.score} />
            </div>

            {evaluation.summary && (
              <p className="text-sm text-slate-700">{evaluation.summary}</p>
            )}

            <div>
              <p className="text-sm font-medium text-slate-800">Meaning</p>
              <p className="mt-1 text-sm text-slate-600">
                {evaluation.meaning.feedback || "No meaning feedback."}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-800">Grammar</p>
              <p className="mt-1 text-sm text-slate-600">
                {evaluation.grammar.feedback || "No grammar feedback."}
              </p>
              {evaluation.grammar.mistakes.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {evaluation.grammar.mistakes.map((mistake, index) => (
                    <li
                      key={`${mistake.mistake}-${index}`}
                      className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-700"
                    >
                      <p>
                        <span className="font-medium">Mistake:</span>{" "}
                        {mistake.mistake}
                      </p>
                      <p>
                        <span className="font-medium">Correction:</span>{" "}
                        {mistake.correction}
                      </p>
                      <p>
                        <span className="font-medium">Why:</span>{" "}
                        {mistake.explanation}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
