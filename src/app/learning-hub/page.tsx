
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GraduationCap, Film, Gamepad2, Check, X, Box, Droplets, Utensils, FirstAidKit, Flashlight, Radio } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  {
    question: "In a flood, what is the most dangerous thing to do?",
    options: ["Climb to the roof", "Walk or drive through floodwaters", "Listen to the radio for news", "Turn off utilities"],
    correctAnswer: "Walk or drive through floodwaters",
  },
  {
    question: "What is the national emergency number for police in India?",
    options: ["100", "101", "102", "112"],
    correctAnswer: "112",
  },
    {
    question: "How much water per person, per day, should you have in your emergency kit?",
    options: ["1 cup", "1 liter", "1 gallon (approx 4 liters)", "As much as you can carry"],
    correctAnswer: "1 gallon (approx 4 liters)",
  },
];

const safetyKitItems = [
    { icon: Droplets, name: "Water", description: "1 gallon per person, per day" },
    { icon: Utensils, name: "Food", description: "Non-perishable, 3-day supply" },
    { icon: FirstAidKit, name: "First-Aid Kit", description: "Bandages, antiseptic, medicines" },
    { icon: Flashlight, name: "Flashlight", description: "With extra batteries" },
    { icon: Radio, name: "Hand-crank Radio", description: "To get news and alerts" },
    { icon: Box, name: "Other essentials", description: "Whistle, masks, local maps" },
];


export default function LearningHubPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuestion = quizQuestions[currentQuestionIndex];

  const handleNextQuestion = () => {
    // Check answer and update score if it hasn't been done
    if(showResult && selectedAnswer) {
        if (selectedAnswer === currentQuestion.correctAnswer) {
            setScore(prevScore => prevScore + 1);
        }
    }
    
    setShowResult(false);
    setSelectedAnswer(null);

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizFinished(true);
    }
  };
  
  const handleCheckAnswer = () => {
    if(!selectedAnswer) return;
    setShowResult(true);
  }

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizFinished(false);
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
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
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
           <div className="space-y-2">
            <h3 className="font-semibold">Flood Safety</h3>
            <div className="aspect-video">
              <iframe
                className="w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/OpNps_3-A6A"
                title="Flood Safety Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
           <div className="space-y-2">
            <h3 className="font-semibold">Fire Safety</h3>
            <div className="aspect-video">
              <iframe
                className="w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/74h4b1-gW3A"
                title="Fire Safety Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Safety Kit Section */}
      <Card>
        <CardHeader>
            <CardTitle>What's in a Safety Kit?</CardTitle>
            <CardDescription>A good safety kit has essentials for at least 72 hours.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {safetyKitItems.map(item => {
                const Icon = item.icon;
                return (
                    <div key={item.name} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                        <Icon className="h-8 w-8 text-primary" />
                        <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                    </div>
                );
            })}
        </CardContent>
      </Card>


      {/* Interactive Quiz Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6" />
            <CardTitle>Disaster Prep Quiz</CardTitle>
          </div>
          <CardDescription>Test your knowledge and see your score at the end!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {quizFinished ? (
                <div className="text-center space-y-4">
                    <Alert>
                        <AlertTitle className="text-2xl font-bold">Quiz Finished!</AlertTitle>
                        <AlertDescription className="text-lg">
                            Your final score is: <span className="font-bold text-primary">{score} / {quizQuestions.length}</span>
                        </AlertDescription>
                    </Alert>
                    <Button onClick={restartQuiz}>Play Again</Button>
                </div>
            ) : (
            <>
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
            </>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

