import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import NavigationBar from '../pages/NavigationBar';
import { useNavigate } from 'react-router-dom';
import Loading from './Loading';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: start;
  height: 90vh;
  padding: 20px;
`;

const GuidePanel = styled.div`
  width: 40%;
  background: #fff;
  margin-right: 20px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  overflow: auto;
  display: flex;
  flex-direction: column;
`;

const StyledChatBot = styled.div`
  width: 60%;
  background: #f5f5f5;
  font-family: sans-serif;
  text-align: center;
  
  .chat-box {
    width: 100%;
    height: 620px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0px 14px 24px rgba(0, 0, 0, 0.13);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .messages-list {
    flex-grow: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 10px 20px; /* Reduced padding */
  }
  .bot, .user {
    margin-bottom: 20px;
    max-width: 35%;
    padding: 10px 15px;
    border-radius: 16px;
    align-self: flex-start;
    background: #f0f0f0;
    color: #333;
    text-align: left;
  }
  .user {
    align-self: flex-end;
    background: #2979ff;
    color: #fff;
    border-radius: 16px 16px 0 16px;
    text-align: left;
  }
  .message-input {
    flex-grow: 1;
    margin-right: 5px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 16px;
    margin-bottom: 10px;
    width: 70%;
  }

  .send-button {
    padding: 10px 20px;
    background-color: #2979ff;
    color: #fff;
    border: none;
    border-radius: 16px;
    cursor: pointer;
  }
`;

function ChatBot() {
  const [messages, setMessages] = useState([{ id: 1, text: "로딩 중...", sender: "bot" }]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // 메시지를 지정된 간격으로 추가하는 함수
  const addMessageInIntervals = (messagesArray) => {
    return new Promise(resolve => {
      messagesArray.forEach((messageText, index) => {
        setTimeout(() => {
          setMessages(prevMessages => [
            ...prevMessages,
            { id: prevMessages.length + 1, text: messageText, sender: "bot" }
          ]);
  
          // 마지막 메시지를 추가한 후에 resolve를 호출
          if (index === messagesArray.length - 1) {
            resolve();
          }
        }, index * 1000); // 1초 간격으로 메시지 추가
      });
    });
  };


  useEffect(() => {
    async function fetchInitialMessage() {
      
       // 로컬 스토리지에서 가져온 정보들
      const accessToken = localStorage.getItem('accessToken');
      const accessName = localStorage.getItem('userName');

      if (!accessToken) {
        console.error('No access token available');
        return;
      }

      try {
        const response = await axios.post('http://127.0.0.1:8000/api/chat', {
          request_message: "",
          user_name: accessName
        }, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${accessToken}`
          }
        });
        setMessages([{ id: 1, text: response.data.response_message || "반갑습니다! 무엇을 도와드릴까요?", sender: "bot" }]);
      } catch (error) {
        console.log(accessToken);
        console.error('There was an error!', error);
        setMessages([{ id: 1, text: "오류가 발생했습니다.", sender: "bot" }]);
      }
    }
    fetchInitialMessage();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  

  

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSend = async () => {
    setInputValue('');
    if (inputValue.trim()) {
      const newMessage = { id: messages.length + 1, text: inputValue, sender: "user" };
      setMessages([...messages, newMessage]);
      const accessToken = localStorage.getItem('accessToken');
      const accessName = localStorage.getItem('userName');

      try {
        const response = await axios.post('http://127.0.0.1:8000/api/chat', {
          request_message: inputValue,
          user_name: accessName
        }, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${accessToken}`
          }
        });
  
        const fullMessage = response.data.response_message;
        const splitPoint = fullMessage.indexOf("예를 들어");
        const firstPart = fullMessage.substring(0, splitPoint).trim();
        const secondPart = fullMessage.substring(splitPoint).trim();
  
        if (splitPoint !== -1) {
          await addMessageInIntervals([firstPart, secondPart]);
        } else {
          await addMessageInIntervals([fullMessage]);
        }
  
        if (response.data.response_message.includes("부동산 소비 유형을 알려드리기 위해 분석 중이에요!") && response.data.report_data) {
          // 모든 메시지가 화면에 표시된 후 5초를 기다립니다
          await new Promise(resolve => setTimeout(resolve, 5000));
  
          setIsLoading(true); // 로딩 상태 활성화
          setTimeout(() => { // 로딩 화면을 보여주고 나서 리포트 페이지로 네비게이션
            navigate('/report', { state: { reportData: response.data.report_data } });
            setIsLoading(false); // 로딩 상태 해제
          }, 5000); // 예: 5초 동안 로딩 화면 표시
        }
  
      } catch (error) {
        console.error('There was an error!', error);
        setMessages(messages => [...messages, { id: messages.length + 1, text: "오류가 발생했습니다.", sender: "bot" }]);
      }
    }
  };
  



  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <NavigationBar />
      <Container>
      {isLoading && <Loading />}
        <GuidePanel>
          <h2>이용 가이드</h2>
          <p>챗봇 사용법을 소개합니다.</p>
          <h2>FAQ</h2>
          <p>자주 묻는 질문과 답변을 확인하세요.</p>
        </GuidePanel>
        <StyledChatBot>
          <div className='chat-box'>
            <div className='messages-list'>
              {messages.map(message => (
                <div key={message.id} className={`bubble ${message.sender === 'bot' ? 'bot' : 'user'}`}>
                  {message.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="message-form">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력해주세요."
                className='message-input'
              />
              <button onClick={handleSend} className='send-button'>
                전송
              </button>
            </div>
          </div>
        </StyledChatBot>
      </Container>
    </>
  );
}

export default ChatBot;
