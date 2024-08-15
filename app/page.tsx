'use client';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Marhaba! I'm your Arabic language partner. I can help you learn how to speak and understand Levantine Arabic, also known as Shami. Let's start with some basic greetings! How can I assist you today?",
    },
  ]);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const [resetTime, setResetTime] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (remainingRequests !== null && remainingRequests <= 0) {
      const timeUntilResetMinutes = resetTime !== null ? Math.ceil(resetTime / 1000 / 60) : 0;
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: `No more questions! Check back in ${timeUntilResetMinutes} minute(s).` },
      ]);
      return;
    }
  
    if (!message.trim() || isLoading) return;
    setIsLoading(true);
  
    setMessage('');
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ]);
  
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      });
  
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response, but received: ${contentType}`);
      }
  
      const data = await response.json();
  
      if (!response.ok || data.error) {
        console.error('Error response from API:', data.message || 'Unknown error');
        const timeUntilReset = data.timeUntilReset;
        setResetTime(timeUntilReset);
        const timeUntilResetMinutes = Math.ceil(timeUntilReset / 1000 / 60);
        setMessages((messages) => [
          ...messages,
          { role: 'assistant', content: `No more questions! Check back in ${timeUntilResetMinutes} minute(s).` },
        ]);
      } else {
        setMessages((messages) => [
          ...messages,
          { role: 'assistant', content: data.message },
        ]);
        setRemainingRequests(data.remainingRequests);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ]);
    }
  
    setIsLoading(false);
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundImage: `
          linear-gradient(135deg, #ff0000 0%, #ff0000 15%, rgba(255, 0, 0, 0) 30%, rgba(0, 0, 0, 0.7) 45%, rgba(255, 255, 255, 0.7) 60%, rgba(0, 128, 0, 0.7) 75%),
          linear-gradient(90deg, rgba(0, 0, 0, 0.7), rgba(255, 255, 255, 0.7), rgba(0, 128, 0, 0.7))
        `,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        padding: '20px',
      }}
    >
      <Typography variant="h4" sx={{ marginBottom: '20px', color: '#ffffff' }}>
        Arabic Language Partner
      </Typography>
      <Stack
        direction={'column'}
        width="100%"
        maxWidth="500px"
        height="600px"
        boxShadow="0px 8px 20px rgba(0, 0, 0, 0.3)"
        borderRadius="12px"
        sx={{ backgroundColor: '#ffffff', padding: '20px' }}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
          sx={{
            paddingRight: '10px',
            marginBottom: '20px',
            '::-webkit-scrollbar': { width: '6px' },
            '::-webkit-scrollbar-thumb': {
              backgroundColor: '#ccc',
              borderRadius: '10px',
            },
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                sx={{
                  backgroundColor:
                    message.role === 'assistant' ? '#e0e0e0' : '#007bff',
                  color: message.role === 'assistant' ? '#333' : '#ffffff',
                  borderRadius: '20px',
                  padding: '10px 15px',
                  maxWidth: '80%',
                  fontSize: '16px',
                }}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        {remainingRequests !== null && (
          <Typography variant="body2" sx={{ color: '#333', textAlign: 'center', marginBottom: '10px' }}>
            You have {remainingRequests} request(s) left.
          </Typography>
        )}
        <Stack direction={'row'} spacing={2}>
          <TextField
            variant="outlined"
            placeholder="Type your message..."
            fullWidth
            value={message}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setMessage(e.target.value)
            }
            onKeyPress={handleKeyPress}
            disabled={isLoading || (remainingRequests !== null && remainingRequests <= 0)}
            sx={{
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              input: {
                padding: '10px',
              },
            }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading || (remainingRequests !== null && remainingRequests <= 0)}
            sx={{
              backgroundColor: isLoading ? '#ccc' : '#007bff',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '16px',
              '&:hover': {
                backgroundColor: '#0056b3',
              },
            }}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
