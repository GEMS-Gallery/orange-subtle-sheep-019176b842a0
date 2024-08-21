export const idlFactory = ({ IDL }) => {
  const Rank = IDL.Variant({
    'Ace' : IDL.Null,
    'Six' : IDL.Null,
    'Ten' : IDL.Null,
    'Two' : IDL.Null,
    'Eight' : IDL.Null,
    'Seven' : IDL.Null,
    'Five' : IDL.Null,
    'Four' : IDL.Null,
    'Jack' : IDL.Null,
    'King' : IDL.Null,
    'Nine' : IDL.Null,
    'Three' : IDL.Null,
    'Queen' : IDL.Null,
  });
  const Suit = IDL.Variant({
    'Diamonds' : IDL.Null,
    'Hearts' : IDL.Null,
    'Clubs' : IDL.Null,
    'Spades' : IDL.Null,
  });
  const Card = IDL.Record({ 'rank' : Rank, 'suit' : Suit });
  const Hand = IDL.Vec(Card);
  const GameState = IDL.Record({
    'pot' : IDL.Nat,
    'playerChips' : IDL.Nat,
    'communityCards' : Hand,
    'aiHand' : Hand,
    'stage' : IDL.Variant({
      'Flop' : IDL.Null,
      'Turn' : IDL.Null,
      'River' : IDL.Null,
      'Showdown' : IDL.Null,
      'PreFlop' : IDL.Null,
    }),
    'aiChips' : IDL.Nat,
    'playerHand' : Hand,
    'currentBet' : IDL.Nat,
  });
  const Result = IDL.Variant({ 'ok' : GameState, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  return IDL.Service({
    'advanceGameState' : IDL.Func([], [Result], []),
    'aiAction' : IDL.Func([], [Result], []),
    'determineWinner' : IDL.Func([], [Result_1], []),
    'getGameState' : IDL.Func([], [IDL.Opt(GameState)], ['query']),
    'initializeGame' : IDL.Func([], [GameState], []),
    'placeBet' : IDL.Func([IDL.Nat], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
