import React, { useState, useEffect } from 'react';
import { Container, Box, Button, Typography, CircularProgress, Grid } from '@mui/material';
import { backend } from 'declarations/backend';

type Card = {
  suit: 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
  rank: 'Two' | 'Three' | 'Four' | 'Five' | 'Six' | 'Seven' | 'Eight' | 'Nine' | 'Ten' | 'Jack' | 'Queen' | 'King' | 'Ace';
};

type Player = {
  hand: Card[];
  chips: bigint;
  currentBet: bigint;
};

type GameState = {
  players: Player[];
  communityCards: Card[];
  pot: bigint;
  currentPlayerIndex: number;
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

  const placeBet = async (playerIndex: number, amount: number) => {
    setLoading(true);
    try {
      const result = await backend.placeBet(playerIndex, BigInt(amount));
      if ('ok' in result) {
        setGameState(result.ok);
        if (result.ok.currentPlayerIndex === 0) {
          await advanceGameState();
        }
      } else {
        setError(result.err);
      }
    } catch (err) {
      setError('Failed to place bet');
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

  const renderPlayer = (player: Player, index: number) => (
    <Box key={index} sx={{ border: '1px solid white', padding: 2, margin: 1 }}>
      <Typography>Player {index + 1}</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
        {player.hand.map((card, cardIndex) => renderCard(card))}
      </Box>
      <Typography>Chips: {Number(player.chips)}</Typography>
      <Typography>Current Bet: {Number(player.currentBet)}</Typography>
      <Box sx={{ mt: 1 }}>
        <Button onClick={() => placeBet(index, 10)} disabled={loading || gameState?.currentPlayerIndex !== index}>Bet 10</Button>
        <Button onClick={() => placeBet(index, 20)} disabled={loading || gameState?.currentPlayerIndex !== index}>Bet 20</Button>
        <Button onClick={() => placeBet(index, 50)} disabled={loading || gameState?.currentPlayerIndex !== index}>Bet 50</Button>
      </Box>
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
      <Grid container spacing={2}>
        {gameState.players.map((player, index) => (
          <Grid item xs={12} md={4} key={index}>
            {renderPlayer(player, index)}
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        {gameState.communityCards.map((card, index) => renderCard(card))}
      </Box>
      <Typography>Pot: {Number(gameState.pot)}</Typography>
      <Typography>Stage: {gameState.stage}</Typography>
      <Typography>Current Player: Player {gameState.currentPlayerIndex + 1}</Typography>
      {error && <Typography color="error">{error}</Typography>}
    </Container>
  );
};

export default App;
