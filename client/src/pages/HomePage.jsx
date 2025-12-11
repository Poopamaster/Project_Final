import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import RecommendedSection from '../components/RecommendedSection';

const Homepage = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ ฟังก์ชันส่งข้อความ → Redirect ไป ChatBotPage
  const handleSendFromHomepage = (textOverride = null) => {
    const textToSend = textOverride || inputText;
    
    if (!textToSend?.trim()) return;

    setIsLoading(true);

    // ✅ Smooth transition (300ms delay)
    setTimeout(() => {
      navigate('/chatbot', { 
        state: { 
          initialMessage: textToSend 
        } 
      });
    }, 500);
  };

  // ✅ Speech to Text
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      window.speechRecognition?.stop();
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser ของคุณไม่รองรับฟีเจอร์นี้");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev ? prev + " " + transcript : transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendFromHomepage();
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans">
      <main>
        <HeroSection 
          handleSendMessage={handleSendFromHomepage}
          inputText={inputText}
          setInputText={setInputText}
          toggleListening={toggleListening}
          isListening={isListening}
          isLoading={isLoading}
          handleKeyPress={handleKeyPress}
        />
        <RecommendedSection />
      </main>
    </div>
  );
};

export default Homepage;