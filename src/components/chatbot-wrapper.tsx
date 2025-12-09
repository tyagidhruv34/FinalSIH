"use client";

import dynamic from 'next/dynamic';

// Lazy load Chatbot - only load when needed (client component)
const Chatbot = dynamic(() => import('@/components/chatbot'), {
  ssr: false,
});

export default function ChatbotWrapper() {
  return <Chatbot />;
}

