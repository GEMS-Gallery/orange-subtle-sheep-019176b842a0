import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Card { 'rank' : Rank, 'suit' : Suit }
export interface GameState {
  'pot' : bigint,
  'playerChips' : bigint,
  'communityCards' : Hand,
  'aiHand' : Hand,
  'stage' : { 'Flop' : null } |
    { 'Turn' : null } |
    { 'River' : null } |
    { 'Showdown' : null } |
    { 'PreFlop' : null },
  'aiChips' : bigint,
  'playerHand' : Hand,
  'currentBet' : bigint,
}
export type Hand = Array<Card>;
export type Rank = { 'Ace' : null } |
  { 'Six' : null } |
  { 'Ten' : null } |
  { 'Two' : null } |
  { 'Eight' : null } |
  { 'Seven' : null } |
  { 'Five' : null } |
  { 'Four' : null } |
  { 'Jack' : null } |
  { 'King' : null } |
  { 'Nine' : null } |
  { 'Three' : null } |
  { 'Queen' : null };
export type Result = { 'ok' : GameState } |
  { 'err' : string };
export type Result_1 = { 'ok' : string } |
  { 'err' : string };
export type Suit = { 'Diamonds' : null } |
  { 'Hearts' : null } |
  { 'Clubs' : null } |
  { 'Spades' : null };
export interface _SERVICE {
  'advanceGameState' : ActorMethod<[], Result>,
  'aiAction' : ActorMethod<[], Result>,
  'determineWinner' : ActorMethod<[], Result_1>,
  'getGameState' : ActorMethod<[], [] | [GameState]>,
  'initializeGame' : ActorMethod<[], GameState>,
  'placeBet' : ActorMethod<[bigint], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
