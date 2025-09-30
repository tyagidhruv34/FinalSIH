'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Loader2, Send, X, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { chat, ChatInput } from '@/ai/flows/chatbot-flow';
import { useAuth } from '@/hooks/use-auth';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export default function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Pass the up-to-date history, excluding the latest user message which is passed separately
      const chatHistory = newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      
      const result = await chat({
        history: chatHistory,
        message: input,
      });
      
      const modelMessage: Message = { role: 'model', content: result.message };
      setMessages((prev) => [...prev, modelMessage]);

    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = { role: 'model', content: 'Sorry, I am having trouble connecting. Please try again later.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user) {
      return null;
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 z-50 w-full max-w-sm"
          >
            <Card className="flex flex-col h-[60vh] shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  <CardTitle>AI Assistant</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-6">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                        <div
                          className={`max-w-xs rounded-lg px-4 py-2 text-sm ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start gap-2">
                            <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                            <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin"/>
                                <span className="text-sm">Thinking...</span>
                            </div>
                        </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="pt-6">
                <div className="flex w-full items-center space-x-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isLoading}
                  />
                  <Button onClick={handleSend} disabled={isLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="fixed bottom-4 right-4 z-40 rounded-full h-16 w-16 shadow-lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        <span className="sr-only">Toggle Chatbot</span>
      </Button>
    </>
  );
}
