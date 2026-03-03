import { useState, useEffect, useRef } from 'react';
// ✅ แก้ไข: นำเข้า importExcelMovies จาก chatbotApi
import { 
  sendMessageToBot, 
  getChatHistory, 
  clearChatHistory, 
  importExcelMovies 
} from '../api/chatbotApi';

export const useChatHistory = (user) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const history = await getChatHistory();
        if (history?.length > 0) setMessages(history);
        else setMessages([{ id: 1, sender: 'bot', text: `สวัสดีครับคุณ ${user?.name || 'ลูกค้า'} ผม CineBot ยินดีให้บริการครับ!` }]);
      } catch (error) { console.error("Load history failed", error); }
      finally { setIsLoading(false); }
    };
    fetchHistory();
  }, [user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const clearChat = async () => {
    if (window.confirm("ต้องการลบประวัติการสนทนาทั้งหมด?")) {
      const success = await clearChatHistory();
      if (success) {
        setMessages([{ id: Date.now(), sender: 'bot', text: `เริ่มการสนทนาใหม่ครับ คุณ ${user?.name || 'ลูกค้า'} มีอะไรให้ช่วยไหมครับ?` }]);
        return true;
      }
    }
    return false;
  };
  return { messages, setMessages, isLoading, setIsLoading, messagesEndRef, clearChat };
};

export const useChatInput = (setMessages, setIsLoading) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isExcel = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.name.endsWith('.xlsx');

    if (isExcel) {
      setIsLoading(true);
      try {
        // ✅ แก้ไข: ใช้ฟังก์ชันที่รวม BaseURL และ Token ไว้แล้ว
        const response = await importExcelMovies(file);

        if (response.success) {
          setMessages(prev => [...prev, { 
            id: Date.now(), 
            sender: 'bot', 
            text: response.aiResponse // แสดงตาราง Preview (::VISUAL::)
          }]);
        }
      } catch (error) {
        console.error("Excel Upload Error:", error);
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          sender: 'bot', 
          text: `❌ ${error.message || 'เกิดข้อผิดพลาดในการนำเข้าไฟล์'}` 
        }]);
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      return;
    }

    if (file.type.startsWith('image/')) {
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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser ไม่รองรับ");
    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    if (isListening) { setIsListening(false); recognition.stop(); }
    else {
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e) => setInputText(prev => (prev ? prev + " " : "") + e.results[0][0].transcript);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    }
  };

  return { inputText, setInputText, selectedImage, imagePreview, isListening, handleFileSelect, clearImage, toggleListening, fileInputRef };
};

export const useInitialMessageProcessor = (location, user, handleSendMessage) => {
  const [isReloading, setIsReloading] = useState(false);
  const hasSent = useRef(false);
  useEffect(() => {
    const initialMsg = location.state?.initialMessage;
    if (initialMsg && user && !hasSent.current) {
      hasSent.current = true;
      setIsReloading(true);
      handleSendMessage(initialMsg).then(() => {
        window.history.replaceState({}, document.title);
        setTimeout(() => window.location.reload(), 1000);
      });
    }
  }, [location.state, user, handleSendMessage]);
  return isReloading;
};