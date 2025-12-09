
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GraduationCap, Film, Gamepad2, Check, X, Box, Droplets, Utensils, BriefcaseMedical, Flashlight, Radio, Award, PartyPopper, Star } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

// Local video files stored in public/videos/ for offline access
const educationalVideos = [
  {
    title: "Earthquake Safety Video",
    src: "/videos/SSYouTube.online_How to Protect Yourself During an Earthquake  Disasters_720p.mp4",
  },
  {
    title: "Fire Extinguisher Training Video (P.A.S.S.)",
    src: "/videos/How to Use a Fire Extinguisher 720p.mp4",
  },
  {
    title: "Build an Emergency Kit",
    src: "/videos/SSYouTube.online_How to build an Emergency Preparedness Kit_720p.mp4",
  },
  {
    title: "Flood Safety",
    src: "/videos/SSYouTube.online_How To Survive Floods  Preparing For A Flood  The Dr Binocs Show  Peekaboo Kidz_720p.mp4",
  },
];


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
    { icon: Droplets, name: "Water", description: "1 gallon per person, per day", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300" },
    { icon: Utensils, name: "Food", description: "Non-perishable, 3-day supply", color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300" },
    { icon: BriefcaseMedical, name: "First-Aid Kit", description: "Bandages, antiseptic, medicines", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300" },
    { icon: Flashlight, name: "Flashlight", description: "With extra batteries", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300" },
    { icon: Radio, name: "Hand-crank Radio", description: "To get news and alerts", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300" },
    { icon: Box, name: "Other essentials", description: "Whistle, masks, local maps", color: "bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300" },
];


export default function LearningHubPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  
  const getScoreMessage = (finalScore: number) => {
    const percentage = (finalScore / quizQuestions.length) * 100;
    if (percentage === 100) return { message: "Perfect Score! You're a safety superstar!", icon: Award };
    if (percentage >= 80) return { message: "Excellent work! You really know your stuff.", icon: Star };
    if (percentage >= 50) return { message: "Good job! A little more review and you'll be an expert.", icon: PartyPopper };
    return { message: "Keep trying! Every question you learn makes you safer.", icon: GraduationCap };
  };
  
  const finalScoreMessage = getScoreMessage(score);

  const handleNextQuestion = () => {
    // Check answer and update score
    if (selectedAnswer === currentQuestion.correctAnswer) {
      if(!showResult) { // Only add score if it hasn't been shown
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
            <h1 className="text-4xl font-bold tracking-tight">Student Learning Hub</h1>
            <p className="text-muted-foreground">
                Learn how to stay safe with videos and interactive quizzes.
            </p>
        </div>
      </div>

      {/* Educational Videos Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Film className="h-6 w-6 text-primary" />
            <CardTitle>Safety Videos</CardTitle>
          </div>
          <CardDescription>Watch these videos to learn about disaster preparedness.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          {educationalVideos.map((video) => (
            <div key={video.title} className="space-y-2 group">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{video.title}</h3>
              <div className="aspect-video overflow-hidden rounded-lg border-2 border-transparent group-hover:border-primary transition-all group-hover:shadow-lg bg-black">
                <video
                  className="w-full h-full"
                  controls
                  preload="metadata"
                  title={video.title}
                >
                  <source src={video.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          ))}
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
                    <div key={item.name} className={`flex items-center gap-4 p-4 rounded-lg ${item.color} transition-transform hover:scale-105`}>
                        <Icon className="h-12 w-8" />
                        <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-4xl opacity-80">{item.description}</p>
                        </div>
                    </div>
                );
            })}
        </CardContent>
      </Card>


      {/* Interactive Quiz Section */}
      <Card className="bg-gradient-to-br from-background to-muted/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-primary" />
            <CardTitle>Disaster Prep Quiz</CardTitle>
          </div>
          <CardDescription>Test your knowledge and see your score at the end!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {quizFinished ? (
                <div className="text-center space-y-4 p-4 rounded-lg bg-background">
                     <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300">
                        <finalScoreMessage.icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-4xl font-bold">Quiz Finished!</AlertTitle>
                        <AlertDescription className="text-4xl">
                            Your final score is: <span className="font-bold text-primary">{score} / {quizQuestions.length}</span>
                        </AlertDescription>
                    </Alert>
                    <p className="text-4xl font-semibold">{finalScoreMessage.message}</p>
                    <Button onClick={restartQuiz}>Play Again</Button>
                </div>
            ) : (
            <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-4xl font-medium text-muted-foreground">
                    <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                    <span>Score: {score}</span>
                  </div>
                  <Progress value={((currentQuestionIndex + 1) / quizQuestions.length) * 100} className="w-full h-2" />
                </div>
                <div>
                <p className="font-semibold text-4xl mb-4">{currentQuestion.question}</p>
                <RadioGroup value={selectedAnswer || ""} onValueChange={setSelectedAnswer} className="space-y-2">
                    {currentQuestion.options.map((option) => (
                    <div key={option} className={`flex items-center space-x-3 p-3 rounded-md border-2 transition-all ${showResult ? (option === currentQuestion.correctAnswer ? 'border-green-500 bg-green-100/50 dark:bg-green-900/30' : (option === selectedAnswer ? 'border-red-500 bg-red-100/50 dark:bg-red-900/30' : 'border-border')) : 'border-border hover:border-primary cursor-pointer'}`}>
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
                    <Alert variant={selectedAnswer === currentQuestion.correctAnswer ? 'default' : 'destructive'} className={selectedAnswer === currentQuestion.correctAnswer ? 'bg-green-100/60 dark:bg-green-900/30 border-green-300 dark:border-green-700' : ''}>
                        <AlertTitle>{selectedAnswer === currentQuestion.correctAnswer ? "Correct!" : "Not quite!"}</AlertTitle>
                        <AlertDescription>
                            {selectedAnswer !== currentQuestion.correctAnswer && `The correct answer is "${currentQuestion.correctAnswer}".`}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-end gap-2">
                    {showResult ? (
                         <Button onClick={handleNextQuestion}>
                            {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={handleCheckAnswer} disabled={!selectedAnswer || showResult}>Check Answer</Button>
                    )}
                </div>
            </>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
