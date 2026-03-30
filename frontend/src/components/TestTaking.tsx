import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface TestTakingProps {
 test: any;
 onComplete: () => void;
 onExit: () => void;
}

interface Question {
 question: string;
 options: string[];
 correctAnswer: number;
 explanation?: string;
}

const TestTaking: React.FC<TestTakingProps> = ({ test, onComplete, onExit }) => {
 const { addTestResult } = useData();
 const { user } = useAuth();

 // Normalize questions using correct_answer from API
 const normalizedQuestions: Question[] = (test.questions ?? []).map((q: any) => {
  const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
  const correctAnswer = Number(q.correct_answer);
  return { ...q, options, correctAnswer };
 });

 const [currentQuestion, setCurrentQuestion] = useState(0);
 const [answers, setAnswers] = useState<number[]>([]);
 const [timeRemaining, setTimeRemaining] = useState((test.duration ?? 0) * 60);
 const [showResults, setShowResults] = useState(false);
 const [score, setScore] = useState(0);
 const [startTime] = useState(Date.now());

 // Initialize answers once questions are loaded
 useEffect(() => {
  if (normalizedQuestions.length > 0) {
   setAnswers(new Array(normalizedQuestions.length).fill(-1));
  }
 }, [normalizedQuestions.length]);

 // Timer
 useEffect(() => {
  const timer = setInterval(() => {
   setTimeRemaining(prev => {
if (prev <= 1) {
 handleSubmit();
 return 0;
}
return prev - 1;
   });
  }, 1000);
  return () => clearInterval(timer);
 }, [normalizedQuestions.length, startTime]);

 const handleAnswerSelect = (answerIndex: number) => {
  const newAnswers = [...answers];
  newAnswers[currentQuestion] = answerIndex;
  setAnswers(newAnswers);
 };

 // In src/components/TestTaking.tsx

const handleSubmit = () => {
    
    // --- 1. Calculate Score and Time ---
    const correctAnswersCount = normalizedQuestions.reduce(
        (count: number, question: Question, index: number) => {
 const isCorrect = answers[index] === question.correctAnswer;
  return isCorrect ? count + 1 : count;
        },
        0
    );

    const totalTimeInSeconds = Math.round((Date.now() - startTime) / 1000);
    const timeTakenInMinutes = Math.ceil(totalTimeInSeconds / 60); 

    // 🛑 CRITICAL FIX: Explicitly convert to Number() to ensure primitive type
    const finalScore = Number(Math.round(correctAnswersCount)); 
    const finalTotalQuestions = Number(normalizedQuestions.length); 
    const finalTimeTaken = Number(Math.round(timeTakenInMinutes));
    
    // --- 3. Update State and Submit ---
    setScore(finalScore);
    setShowResults(true);
    
    addTestResult({
        testId: test.id,
        // Sending the guaranteed numeric primitives:
        score: finalScore,
        total_questions: finalTotalQuestions, 
        timeTaken: finalTimeTaken, 
        answers,
    });
};

 const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
return `${mins}:${secs.toString().padStart(2, '0')}`;
 };

 // Guard if no questions
 if (normalizedQuestions.length === 0) {
return <div className="text-center p-8 text-gray-500">No questions available</div>;
 }

 // Show results screen
 if (showResults) {
  const percentage = (score / normalizedQuestions.length) * 100;
  return (
<div className="max-w-4xl mx-auto px-4"> {/* Added padding for consistency */}
<div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        <div className="text-center mb-8">
  <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
  <span className="text-2xl font-bold text-white">{percentage.toFixed(0)}%</span>
  </div>
  <h2 className="text-3xl font-bold text-slate-900 mb-2">Test Complete!</h2>
  <p className="text-slate-600">You scored {score} out of {normalizedQuestions.length} questions</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  <div className="bg-slate-50 rounded-lg p-4 text-center">
   <div className="text-2xl font-bold text-slate-900">{score}</div>
   <div className="text-sm text-slate-600">Correct Answers</div>
  </div>
  <div className="bg-slate-50 rounded-lg p-4 text-center">
   <div className="text-2xl font-bold text-slate-900">{normalizedQuestions.length - score}</div>
   <div className="text-sm text-slate-600">Incorrect Answers</div>
  </div>
  <div className="bg-slate-50 rounded-lg p-4 text-center">
   <div className="text-2xl font-bold text-slate-900">{percentage.toFixed(1)}%</div>
   <div className="text-sm text-slate-600">Accuracy</div>
  </div>
 </div>

 <div className="space-y-6">
  <h3 className="text-xl font-semibold text-slate-900">Review Answers</h3>
  {normalizedQuestions.map((question: Question, index: number) => {
   const isCorrect = answers[index] === question.correctAnswer;
   const userAnswer = answers[index];

   return (
<div key={index} className="border border-slate-200 rounded-lg p-6">
 <div className="flex items-start justify-between mb-4">
  <h4 className="text-lg font-medium text-slate-900">{index + 1}. {question.question}</h4>
  <span className={`px-3 py-1 rounded-full text-sm font-medium ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
   {isCorrect ? 'Correct' : 'Incorrect'}
  </span>
 </div>

 <div className="space-y-2 mb-4">
  {question.options.map((option: string, optionIndex: number) => (
   <div key={optionIndex} className={`p-3 rounded-lg border ${optionIndex === question.correctAnswer
? 'bg-green-50 border-green-200'
: optionIndex === userAnswer && !isCorrect
 ? 'bg-red-50 border-red-200'
 : 'border-slate-200'
   }`}>
<div className="flex items-center space-x-2">
 <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span>
 <span>{option}</span>
 {optionIndex === question.correctAnswer && <span className="text-green-600 font-medium">(Correct)</span>}
 {optionIndex === userAnswer && !isCorrect && <span className="text-red-600 font-medium">(Your Answer)</span>}
</div>
   </div>
  ))}
 </div>

 {question.explanation && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
   <h5 className="font-medium text-blue-900 mb-2">Explanation:</h5>
   <p className="text-blue-800">{question.explanation}</p>
  </div>
 )}
</div>
   );
  })}
 </div>

 <div className="mt-8 text-center">
  <button
   onClick={onComplete}
   className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
  >
   Back to Tests
  </button>
 </div>
</div>
   </div>
  );
 }

 // Main Test UI
 return (
  <div className="max-w-4xl mx-auto px-4"> 
   {/* Header (Restored Functional & Styled Header) */}
   <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
 
  {/* Title and Question Counter */}
 <div>
  <h1 className="text-2xl font-bold text-slate-900">{test.title}</h1>
  <p className="text-slate-600">Question {currentQuestion + 1} of {normalizedQuestions.length}</p>
 </div>
  
  {/* Timer and Exit */}
 <div className="flex items-center space-x-4">
  <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
   <Clock className="w-5 h-5 text-red-600" />
   <span className="font-semibold text-red-600">{formatTime(timeRemaining)}</span>
  </div>
  <button 
onClick={onExit} 
className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
  >
   <X size={24} />
  </button>
 </div>
</div>
   </div>

   {/* Question and Options */}
   <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
<h2 className="text-xl font-semibold text-slate-900 mb-6">{normalizedQuestions[currentQuestion].question}</h2>
<div className="space-y-3">
 {normalizedQuestions[currentQuestion].options.map((option, index) => (
  <button
   key={index}
   onClick={() => handleAnswerSelect(index)}
   className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${answers[currentQuestion] === index
? 'border-blue-500 bg-blue-50'
: 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
   }`}
  >
   <div className="flex items-center space-x-3">
<span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-sm font-medium">{String.fromCharCode(65 + index)}</span>
<span className="flex-1">{option}</span>
   </div>
  </button>
 ))}
</div>
   </div>


{/* Navigation */}
<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
    <div className="flex flex-col sm:flex-row items-center justify-between">
        <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            <ChevronLeft size={20} />
            <span>Previous</span>
        </button>

        {/* MODIFIED: Added flex-wrap and gap-2 to enable multi-line layout for buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-full my-4 sm:my-0">
            {normalizedQuestions.map((_, index) => (
                <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${index === currentQuestion
                        ? 'bg-blue-500 text-white shadow-md'
                        : answers[index] !== -1
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                >
                    {index + 1}
                </button>
            ))}
        </div>

        {currentQuestion === normalizedQuestions.length - 1 ? (
            <button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-105 shadow-md"
            >
                Submit Test
            </button>
        ) : (
            <button
                onClick={() => setCurrentQuestion(Math.min(normalizedQuestions.length - 1, currentQuestion + 1))}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
                <span>Next</span>
                <ChevronRight size={20} />
            </button>
        )}
    </div>
</div>
    </div>
);
};

export default TestTaking;