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
  type GameState = {
    playerHand: Hand;
    aiHand: Hand;
    communityCards: Hand;
    playerChips: Nat;
    aiChips: Nat;
    pot: Nat;
    currentBet: Nat;
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
      playerHand = dealCards(2);
      aiHand = dealCards(2);
      communityCards = [];
      playerChips = 1000;
      aiChips = 1000;
      pot = 0;
      currentBet = 0;
      stage = #PreFlop;
    };
    gameState := ?newState;
    newState
  };

  public query func getGameState() : async ?GameState {
    gameState
  };

  public func placeBet(amount: Nat) : async Result.Result<GameState, Text> {
    switch (gameState) {
      case (null) { #err("Game not initialized") };
      case (?state) {
        if (amount > state.playerChips) {
          return #err("Insufficient chips");
        };
        let newState = {
          playerHand = state.playerHand;
          aiHand = state.aiHand;
          communityCards = state.communityCards;
          playerChips = state.playerChips - amount;
          aiChips = state.aiChips;
          pot = state.pot + amount;
          currentBet = amount;
          stage = state.stage;
        };
        gameState := ?newState;
        #ok(newState)
      };
    }
  };

  public func aiAction() : async Result.Result<GameState, Text> {
    switch (gameState) {
      case (null) { #err("Game not initialized") };
      case (?state) {
        // Simple AI logic: always call or check
        let aiBet = if (state.currentBet > 0) { state.currentBet } else { 0 };
        if (aiBet > state.aiChips) {
          return #err("AI cannot match the bet");
        };
        let newState = {
          playerHand = state.playerHand;
          aiHand = state.aiHand;
          communityCards = state.communityCards;
          playerChips = state.playerChips;
          aiChips = state.aiChips - aiBet;
          pot = state.pot + aiBet;
          currentBet = 0;
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
          playerHand = state.playerHand;
          aiHand = state.aiHand;
          communityCards = newCommunityCards;
          playerChips = state.playerChips;
          aiChips = state.aiChips;
          pot = state.pot;
          currentBet = 0;
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
        let playerScore = evaluateHand(Array.append(state.playerHand, state.communityCards));
        let aiScore = evaluateHand(Array.append(state.aiHand, state.communityCards));
        if (playerScore > aiScore) {
          #ok("Player wins!")
        } else if (aiScore > playerScore) {
          #ok("AI wins!")
        } else {
          #ok("It's a tie!")
        }
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
