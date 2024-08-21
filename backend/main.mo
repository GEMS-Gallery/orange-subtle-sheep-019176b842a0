import Blob "mo:base/Blob";
import Iter "mo:base/Iter";
import Nat8 "mo:base/Nat8";

import Array "mo:base/Array";
import Random "mo:base/Random";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Option "mo:base/Option";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Text "mo:base/Text";

actor TexasHoldem {
  // Types
  type Suit = {#Hearts; #Diamonds; #Clubs; #Spades};
  type Rank = {#Two; #Three; #Four; #Five; #Six; #Seven; #Eight; #Nine; #Ten; #Jack; #Queen; #King; #Ace};
  type Card = {suit: Suit; rank: Rank};
  type Hand = [Card];
  type Player = {
    hand: Hand;
    chips: Nat;
    currentBet: Nat;
  };
  type GameState = {
    players: [Player];
    communityCards: Hand;
    pot: Nat;
    currentPlayerIndex: Nat;
    stage: {#PreFlop; #Flop; #Turn; #River; #Showdown};
  };

  // Stable variables
  stable var gameState : ?GameState = null;

  // Mutable variables
  var deck : [var Card] = Array.init<Card>(52, {suit = #Hearts; rank = #Two});

  // Helper functions
  func initDeck() : [var Card] {
    let suits = [#Hearts, #Diamonds, #Clubs, #Spades];
    let ranks = [#Two, #Three, #Four, #Five, #Six, #Seven, #Eight, #Nine, #Ten, #Jack, #Queen, #King, #Ace];
    var index = 0;
    for (suit in suits.vals()) {
      for (rank in ranks.vals()) {
        deck[index] := {suit = suit; rank = rank};
        index += 1;
      };
    };
    deck
  };

  func shuffleDeck() : () {
    let size = deck.size();
    for (i in Iter.range(0, size - 1)) {
      let timeBlob = Text.encodeUtf8(Int.toText(Time.now()));
      let j = Random.rangeFrom(Nat8.fromNat(size - i), timeBlob) + i;
      let temp = deck[i];
      deck[i] := deck[j];
      deck[j] := temp;
    };
  };

  func dealCards(count: Nat) : [Card] {
    Array.tabulate<Card>(count, func (i) {
      let card = deck[i];
      deck := Array.tabulateVar<Card>(deck.size() - 1, func (j) {
        if (j < i) { deck[j] } else { deck[j + 1] }
      });
      card
    })
  };

  // Public functions
  public func initializeGame() : async GameState {
    deck := initDeck();
    shuffleDeck();
    let newState = {
      players = [
        { hand = dealCards(2); chips = 1000; currentBet = 0 },
        { hand = dealCards(2); chips = 1000; currentBet = 0 },
        { hand = dealCards(2); chips = 1000; currentBet = 0 }
      ];
      communityCards = [];
      pot = 0;
      currentPlayerIndex = 0;
      stage = #PreFlop;
    };
    gameState := ?newState;
    newState
  };

  public query func getGameState() : async ?GameState {
    gameState
  };

  public func placeBet(playerIndex: Nat, amount: Nat) : async Result.Result<GameState, Text> {
    switch (gameState) {
      case (null) { #err("Game not initialized") };
      case (?state) {
        if (playerIndex >= state.players.size()) {
          return #err("Invalid player index");
        };
        let player = state.players[playerIndex];
        if (amount > player.chips) {
          return #err("Insufficient chips");
        };
        var newPlayers = Array.tabulate<Player>(state.players.size(), func (i) {
          if (i == playerIndex) {
            {
              hand = player.hand;
              chips = player.chips - amount;
              currentBet = player.currentBet + amount;
            }
          } else {
            state.players[i]
          }
        });
        let newState = {
          players = newPlayers;
          communityCards = state.communityCards;
          pot = state.pot + amount;
          currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.size();
          stage = state.stage;
        };
        gameState := ?newState;
        #ok(newState)
      };
    }
  };

  public func advanceGameState() : async Result.Result<GameState, Text> {
    switch (gameState) {
      case (null) { #err("Game not initialized") };
      case (?state) {
        var newCommunityCards = state.communityCards;
        var newStage = state.stage;
        switch (state.stage) {
          case (#PreFlop) {
            newCommunityCards := Array.append(newCommunityCards, dealCards(3));
            newStage := #Flop;
          };
          case (#Flop) {
            newCommunityCards := Array.append(newCommunityCards, dealCards(1));
            newStage := #Turn;
          };
          case (#Turn) {
            newCommunityCards := Array.append(newCommunityCards, dealCards(1));
            newStage := #River;
          };
          case (#River) { newStage := #Showdown; };
          case (#Showdown) { return #err("Game is already at showdown"); };
        };
        let newState = {
          players = state.players;
          communityCards = newCommunityCards;
          pot = state.pot;
          currentPlayerIndex = 0;
          stage = newStage;
        };
        gameState := ?newState;
        #ok(newState)
      };
    }
  };

  // Note: This is a simplified hand evaluation function. A real poker hand evaluator would be more complex.
  func evaluateHand(hand: Hand) : Nat {
    // For simplicity, we'll just count the number of pairs
    var pairs = 0;
    for (i in Iter.range(0, hand.size() - 2)) {
      for (j in Iter.range(i + 1, hand.size() - 1)) {
        if (hand[i].rank == hand[j].rank) {
          pairs += 1;
        };
      };
    };
    pairs
  };

  public func determineWinner() : async Result.Result<Text, Text> {
    switch (gameState) {
      case (null) { #err("Game not initialized") };
      case (?state) {
        if (state.stage != #Showdown) {
          return #err("Game is not at showdown stage");
        };
        var winnerIndex = 0;
        var highestScore = 0;
        for (i in Iter.range(0, state.players.size() - 1)) {
          let playerScore = evaluateHand(Array.append(state.players[i].hand, state.communityCards));
          if (playerScore > highestScore) {
            highestScore := playerScore;
            winnerIndex := i;
          };
        };
        #ok("Player " # Nat.toText(winnerIndex + 1) # " wins!")
      };
    }
  };

  // System functions
  system func preupgrade() {
    // Persistence logic here if needed
  };

  system func postupgrade() {
    // Reinitialize any necessary state here
  };
}
