import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendMessageToBot, getChatHistory, clearChatHistory } from '../api/chatbotApi';

// ✅ Hook 1: จัดการประวัติแชทและการโหลด
export const useChatHistory = (user) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load History
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const history = await getChatHistory();
        if (history?.length > 0) {
          setMessages(history);
        } else {
          setMessages([{
            id: 1, sender: 'bot',
            text: `สวัสดีครับคุณ ${user?.name || 'ลูกค้า'} ผม CineBot ยินดีให้บริการครับ! 🎬`
          }]);
        }
      } catch (error) {
        console.error("Load history failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear History
  const clearChat = async () => {
    if (window.confirm("ต้องการลบประวัติการสนทนาทั้งหมด?")) {
      const success = await clearChatHistory();
      if (success) {
        setMessages([{
          id: Date.now(), sender: 'bot',
          text: `เริ่มการสนทนาใหม่ครับ คุณ ${user?.name || 'ลูกค้า'} มีอะไรให้ช่วยไหมครับ?`
        }]);
        return true;
      }
    }
    return false;
  };

  return { messages, setMessages, isLoading, setIsLoading, messagesEndRef, clearChat };
};

// ✅ Hook 2: จัดการ Input (Text, Image, Voice)
export const useChatInput = () => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      window.speechRecognition?.stop();
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return alert("Browser ไม่รองรับ Voice Command");
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'th-TH';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e) => setInputText(prev => (prev ? prev + " " : "") + e.results[0][0].transcript);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    }
  };

  return { 
    inputText, setInputText, selectedImage, imagePreview, isListening, 
    handleFileSelect, clearImage, toggleListening, fileInputRef 
  };
};

// ✅ Hook 3: จัดการ Initial Message & Reload Logic
export const useInitialMessageProcessor = (location, user, handleSendMessage) => {
  const [isReloading, setIsReloading] = useState(false);
  const hasSent = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initialMsg = location.state?.initialMessage;
    if (initialMsg && user && !hasSent.current) {
      hasSent.current = true;
      setIsReloading(true);

      handleSendMessage(initialMsg).then(() => {
        // Clear state without reload first
        window.history.replaceState({}, document.title);
        // Force Reload logic
        setTimeout(() => window.location.reload(), 1000);
      });
    }
  }, [location.state, user, handleSendMessage]);

  return isReloading;
};