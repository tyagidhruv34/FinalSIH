
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GraduationCap, Film, Gamepad2, Check, X } from "lucide-react";

// Quiz data
const quizQuestions = [
  {
    question: "What is the first thing you should do during an earthquake?",
    options: ["Run outside immediately", "Drop, Cover, and Hold On", "Call for help", "Stand in a doorway"],
    correctAnswer: "Drop, Cover, and Hold On",
  },
  {
    question: "Which of these items is essential for an emergency kit?",
    options: ["Video games", "A three-day supply of water", "Scented candles", "Your favorite book"],
    correctAnswer: "A three-day supply of water",
  },
  {
    question: "If you are told to evacuate your home, what should you do?",
    options: ["Wait to see what your neighbors do", "Argue with the officials", "Follow the instructions of authorities immediately", "Pack all your belongings"],
    correctAnswer: "Follow the instructions of authorities immediately",
  },
];

export default function LearningHubPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = quizQuestions[currentQuestionIndex];

  const handleNextQuestion = () => {
    // Check answer
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
    
    setShowResult(false);
    setSelectedAnswer(null);

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // End of quiz
      alert(`Quiz finished! Your score: ${score + (selectedAnswer === currentQuestion.correctAnswer ? 1 : 0)} / ${quizQuestions.length}`);
      // Reset quiz
      setCurrentQuestionIndex(0);
      setScore(0);
    }
  };
  
  const handleCheckAnswer = () => {
    if(!selectedAnswer) return;
    setShowResult(true);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <GraduationCap className="h-10 w-10 text-primary" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Learning Hub</h1>
            <p className="text-muted-foreground">
                Learn how to stay safe with videos and interactive quizzes.
            </p>
        </div>
      </div>

      {/* Educational Videos Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Film className="h-6 w-6" />
            <CardTitle>Safety Videos</CardTitle>
          </div>
          <CardDescription>Watch these videos to learn about disaster preparedness.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-semibold">Earthquake Safety</h3>
            <div className="aspect-video">
              <iframe
                className="w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/Gsd-44Mv_iE"
                title="Earthquake Safety Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Build an Emergency Kit</h3>
            <div className="aspect-video">
              <iframe
                className="w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/y-z4q3-4_vE"
                title="Emergency Kit Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Quiz Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6" />
            <CardTitle>Disaster Prep Quiz</CardTitle>
          </div>
          <CardDescription>Test your knowledge and earn points!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
              <p className="font-semibold text-lg mb-4">Question {currentQuestionIndex + 1}/{quizQuestions.length}: {currentQuestion.question}</p>
              <RadioGroup value={selectedAnswer || ""} onValueChange={setSelectedAnswer} className="space-y-2">
                {currentQuestion.options.map((option) => (
                  <div key={option} className={`flex items-center space-x-3 p-3 rounded-md border transition-colors ${showResult && (option === currentQuestion.correctAnswer ? 'bg-green-100 border-green-300' : (option === selectedAnswer ? 'bg-red-100 border-red-300' : ''))}`}>
                    <RadioGroupItem value={option} id={option} disabled={showResult} />
                    <Label htmlFor={option} className="flex-1 cursor-pointer">{option}</Label>
                    {showResult && (
                        option === currentQuestion.correctAnswer ? <Check className="h-5 w-5 text-green-600" /> : (option === selectedAnswer ? <X className="h-5 w-5 text-red-600" /> : null)
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            {showResult && (
                <div className={`p-4 rounded-md text-center font-medium ${selectedAnswer === currentQuestion.correctAnswer ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {selectedAnswer === currentQuestion.correctAnswer ? "Correct!" : "Not quite! The correct answer is highlighted in green."}
                </div>
            )}

            <div className="flex justify-end gap-2">
                 <Button variant="outline" onClick={handleCheckAnswer} disabled={!selectedAnswer || showResult}>Check Answer</Button>
                 <Button onClick={handleNextQuestion} disabled={!showResult}>
                    {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
