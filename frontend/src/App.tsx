import React, { useState, useEffect } from 'react';
import { Container, Box, Button, Typography, CircularProgress } from '@mui/material';
import { backend } from 'declarations/backend';

type Card = {
  suit: 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
  rank: 'Two' | 'Three' | 'Four' | 'Five' | 'Six' | 'Seven' | 'Eight' | 'Nine' | 'Ten' | 'Jack' | 'Queen' | 'King' | 'Ace';
};

type GameState = {
  playerHand: Card[];
  aiHand: Card[];
  communityCards: Card[];
  playerChips: bigint;
  aiChips: bigint;
  pot: bigint;
  currentBet: bigint;
  stage: 'PreFlop' | 'Flop' | 'Turn' | 'River' | 'Showdown';
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = async () => {
    setLoading(true);
    try {
      const newGameState = await backend.initializeGame();
      setGameState(newGameState);
    } catch (err) {
      setError('Failed to initialize game');
    } finally {
      setLoading(false);
    }
  };

  const placeBet = async (amount: number) => {
    setLoading(true);
    try {
      const result = await backend.placeBet(BigInt(amount));
      if ('ok' in result) {
        setGameState(result.ok);
        await aiAction();
      } else {
        setError(result.err);
      }
    } catch (err) {
      setError('Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  const aiAction = async () => {
    setLoading(true);
    try {
      const result = await backend.aiAction();
      if ('ok' in result) {
        setGameState(result.ok);
        await advanceGameState();
      } else {
        setError(result.err);
      }
    } catch (err) {
      setError('AI action failed');
    } finally {
      setLoading(false);
    }
  };

  const advanceGameState = async () => {
    setLoading(true);
    try {
      const result = await backend.advanceGameState();
      if ('ok' in result) {
        setGameState(result.ok);
        if (result.ok.stage === 'Showdown') {
          await determineWinner();
        }
      } else {
        setError(result.err);
      }
    } catch (err) {
      setError('Failed to advance game state');
    } finally {
      setLoading(false);
    }
  };

  const determineWinner = async () => {
    setLoading(true);
    try {
      const result = await backend.determineWinner();
      if ('ok' in result) {
        setError(result.ok); // Using error state to display winner
      } else {
        setError(result.err);
      }
    } catch (err) {
      setError('Failed to determine winner');
    } finally {
      setLoading(false);
    }
  };

  const renderCard = (card: Card) => (
    <Box
      sx={{
        width: 50,
        height: 70,
        border: '1px solid black',
        borderRadius: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        color: card.suit === 'Hearts' || card.suit === 'Diamonds' ? 'red' : 'black',
        margin: 0.5,
      }}
    >
      {card.rank[0]}
      {card.suit[0]}
    </Box>
  );

  if (loading) {
    return <CircularProgress />;
  }

  if (!gameState) {
    return (
      <Container>
        <Button onClick={initializeGame}>Start New Game</Button>
        {error && <Typography color="error">{error}</Typography>}
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        {gameState.aiHand.map((card, index) => (
          <Box key={index} sx={{ width: 50, height: 70, backgroundColor: 'blue', borderRadius: 1, margin: 0.5 }} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        {gameState.communityCards.map((card, index) => renderCard(card))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        {gameState.playerHand.map((card, index) => renderCard(card))}
      </Box>
      <Typography>Player Chips: {Number(gameState.playerChips)}</Typography>
      <Typography>AI Chips: {Number(gameState.aiChips)}</Typography>
      <Typography>Pot: {Number(gameState.pot)}</Typography>
      <Typography>Stage: {gameState.stage}</Typography>
      <Box sx={{ mt: 2 }}>
        <Button onClick={() => placeBet(10)} disabled={loading}>Bet 10</Button>
        <Button onClick={() => placeBet(20)} disabled={loading}>Bet 20</Button>
        <Button onClick={() => placeBet(50)} disabled={loading}>Bet 50</Button>
      </Box>
      {error && <Typography color="error">{error}</Typography>}
    </Container>
  );
};

export default App;
