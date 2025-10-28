import React, { useState, useEffect } from 'react';
import type { Quote } from '../types/Quote';
import { generateQuote } from '../services/ApiService';
import { 
  Card, CardContent, Typography, Button, CircularProgress, Box, Fade, IconButton 
} from '@mui/material';
import { 
  FormatQuote as QuoteIcon, 
  Refresh as RefreshIcon,
  AutoAwesome as AIIcon 
} from '@mui/icons-material';

interface QuoteDisplayProps {
  deviceId: string;
}

const QuoteDisplay: React.FC<QuoteDisplayProps> = ({ deviceId }) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = React.useCallback(async () => {
    if (!deviceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newQuote = await generateQuote(deviceId);
      setQuote(newQuote);
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError('Failed to generate quote. Please check your OpenAI API key.');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (deviceId) {
      fetchQuote();
    }
  }, [deviceId, fetchQuote]);

  return (
    <Card 
      sx={{ 
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
        }}
      />
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <AIIcon sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h6" component="div" fontWeight="bold">
              AI Generated Quote
            </Typography>
          </Box>
          <IconButton 
            onClick={fetchQuote} 
            disabled={loading}
            sx={{ color: 'white' }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        )}

        {error && (
          <Typography color="error.light" variant="body2">
            {error}
          </Typography>
        )}

        {!loading && !error && quote && (
          <Fade in={true} timeout={1000}>
            <Box>
              <Box display="flex" alignItems="flex-start" mb={2}>
                <QuoteIcon sx={{ mr: 1, fontSize: 40, opacity: 0.3 }} />
                <Typography 
                  variant="h5" 
                  component="div" 
                  fontStyle="italic"
                  sx={{ 
                    lineHeight: 1.6,
                    fontWeight: 300,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  {quote.text}
                </Typography>
              </Box>
              
              {quote.context && (
                <Typography 
                  variant="caption" 
                  component="div" 
                  sx={{ 
                    opacity: 0.8,
                    mt: 2,
                    fontSize: '0.75rem'
                  }}
                >
                  Based on: {quote.context}
                </Typography>
              )}

              <Typography 
                variant="caption" 
                component="div" 
                sx={{ 
                  opacity: 0.6,
                  mt: 1,
                  fontSize: '0.7rem'
                }}
              >
                Generated at: {new Date(quote.generatedAt).toLocaleString()}
              </Typography>
            </Box>
          </Fade>
        )}

        {!loading && !error && !quote && (
          <Box textAlign="center" py={3}>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
              No quote available yet
            </Typography>
            <Button 
              variant="outlined" 
              onClick={fetchQuote}
              sx={{ 
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  background: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Generate Quote
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default QuoteDisplay;
