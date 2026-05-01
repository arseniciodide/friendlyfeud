# FriendlyFeud — How to Play

A Family Feud-style party game for friends, played online from any browser. One person hosts and moderates; everyone else joins on their own device and plays on one of two teams.

> **Recommended:** open a voice/video call (Discord, Zoom, FaceTime, etc.) alongside the game so players can shout out their answers and the host can hear them.

---

## Roles

| Role | What they do |
|---|---|
| **Host** | Sets up the questions, runs the game, reveals answers, judges whether guesses are correct. The host does **not** play on a team. |
| **Players** | Join a team, take turns guessing answers when it's their turn, type into Fast Money when chosen. |

You need at least **3 people total**: 1 host + 1 player on each team. Realistically the game is more fun with 5–9 people.

---

## Starting a game

### If you're the host

1. Open the app.
2. Click **Host a game**.
3. You'll see a 4-letter **room code** (e.g. `BTKR`) at the top of the screen — share this with your friends.
4. Set up your questions on the host setup screen (see [Setting up questions](#setting-up-questions) below).
5. When you've entered everything, click **Save & open lobby**.
6. Wait for players to join and pick teams. When both teams have at least one person, click **Start game**.

### If you're a player

1. Get the 4-letter room code from the host.
2. Open the app.
3. Click **Join with code**.
4. Type the room code and your name (first name or gamer tag).
5. Click **Join**.
6. Pick **Team 1** or **Team 2**. If you're the first to join your team, you get to type your **family name** (e.g. "The Smiths"). Subsequent joiners just see the family name and click to join.
7. Wait for the host to start the game.

---

## Setting up questions

The host enters everything in the app — no files needed.

### Main rounds

For each round you'll set:
- **A question prompt**, e.g. *"Name something you bring to the beach."*
- **Up to 8 answers**, each with a **point value**. Higher-ranked answers should have more points (matching real Family Feud — 30/25/20/15/10/8/6/4 is a reasonable spread).

You don't have to fill all 8 slots. Empty slots become inactive boxes on the board, but the board always renders 8 positions.

### Number of rounds

Set the round counter at the top. The default is 1; bump it up to however many you want. 4–6 rounds plus Fast Money is a good party-length game.

### Fast Money

Always 5 questions. Just type the prompts — you don't pre-enter answers because you'll score them live as players answer.

### Saving / loading question packs

- **Save pack** stores everything in your browser so you can reuse it next time.
- **Load pack** restores the last saved one.
- **Export JSON** downloads a file you can share with another host.
- **Import JSON** loads a file someone gave you.

---

## How a round works

The game alternates which team starts each round (Team 1 starts round 1, Team 2 starts round 2, etc.).

### The board

- The board shows **8 numbered boxes** in two columns of four.
- Players see only the question and the box numbers. Answers are hidden.
- The **host's view** shows the hidden answer text faintly under each box, plus the point value. This is so the host knows which box matches when a player guesses.

### Taking turns

- Players on the controlling team go **single-file** in the order they joined. The current player's name is highlighted in yellow on every screen.
- Players say their answer **out loud** (over voice chat).
- The host listens and decides whether the answer is on the board.

### When a player guesses correctly

- The host clicks the matching box on their board. It flips and reveals the answer + points to everyone.
- Those points go into the **pot** (shown above the board).
- The next player on the same team takes their turn.

### When a player guesses wrong

- The host clicks **Deny — strike X**.
- A red **X** appears on that team's life bar. The next player on the same team takes their turn.
- After **2 strikes**, control passes to the other team for a **steal** (see below).

### When the team reveals everything

- If the team uncovers all answers on the board, they win the pot automatically and the round ends.

---

## The steal

Once a team racks up 2 strikes, the **other team** gets one chance to steal the round.

- Only the next player on the stealing team gets to guess (one player, one guess).
- The host listens to their answer and either:
  - Clicks **a matching box** on the board → the answer is revealed, the stealing team wins the entire pot.
  - Clicks **Steal failed** → the original team wins the pot.
- Either way, the round ends and the host clicks **Next round →**.

> **Why have a pot?** Points are not awarded immediately when boxes are revealed during a round. They go into the pot first, so a successful steal at the end can claim everything the original team uncovered. This matches real Family Feud.

---

## Fast Money (the final round)

After all main rounds are played, the game enters Fast Money. Each team picks **one player** to compete head-to-head. Combined, they need to score the **target** (default: 200 points) to win a big bonus (5x the target = 1000 points added to their team's score).

### Setup

1. The host picks Player 1 (from Team 1) and Player 2 (from Team 2).
2. The host clicks **Start Fast Money**.

### Player 1's turn (20 seconds)

- Player 2's screen automatically blacks out with a **"COVER YOUR EARS"** overlay — they cannot see Player 1's answers. Have them physically leave the room or mute their audio if you want to be extra careful.
- The host shows all 5 questions to Player 1 at once.
- Player 1 types each answer into their screen and hits **Submit**. The host sees each submission appear and decides how many points it's worth (or marks it 0 if it's a bad answer).
- A 20-second timer counts down at the top. When time runs out, Player 1's turn ends.

### Player 2's turn (25 seconds)

- The host clicks **Start Player 2 (25s)**.
- Bring Player 2 back into the room.
- Player 2 sees the same 5 questions and types their answers.
- **Important rule:** if Player 2 gives the same answer as Player 1 for any question, the host clicks **Duplicate (buzz)** — that answer scores 0 and Player 2 has to come up with a different one (within the same timer). The UI warns the host with a ⚠ when an entered answer matches Player 1's.

### Reveal

- After Player 2's timer ends, the host clicks **Reveal next answer** to dramatically uncover each score one at a time.
- The running total updates after each reveal.
- If the total hits the target → 🏆 **bonus win** (huge points added to the leading team's score).
- If it falls short → no bonus.

After the final reveal, the game shows the **GAME OVER** screen with the team totals and a winner.

---

## Host tips

- **You are the judge.** If a player's answer is "in the ballpark" of one of the hidden answers, just click that box to reveal it — be generous. If it's clearly wrong, click **Deny**.
- **The board doesn't have to show all 8 answers.** If your question only has 5 answers, just leave the bottom 3 slots empty. The empty boxes appear faded and aren't clickable.
- **Don't reveal answers in order.** When a player guesses correctly, click whichever box contains the matching answer — the position doesn't matter.
- **For Fast Money duplicate-answer judging:** the duplicate detector is a literal text match. If Player 2 gives a *similar but differently worded* answer to Player 1's, it's your call whether to count it as duplicate.
- **If the host's browser tab closes**, the room stays alive for 60 seconds. Re-open the app on the same device and the room will reconnect automatically (your host token is saved in browser localStorage).
- **If a player drops out mid-game**, their name greys out in the player list but their team keeps playing — turn order skips no one, so you may want to verbally remind whoever is up if the disconnected player is the current guesser.

---

## Player tips

- **Wait for your name to be highlighted in yellow** before answering. Going out of order confuses the host.
- **Speak loudly and clearly** over voice chat — the host needs to hear you.
- **In Fast Money**, type fast and hit Enter to submit. Don't overthink it — partial answers usually beat blank ones.
- **If you reconnect** (closed tab, refresh, etc.) the game remembers you — just enter the same room code and name.

---

## Quick reference

| Situation | What happens |
|---|---|
| Player guesses an answer on the board | Host clicks the box → reveal → next player on same team |
| Player guesses something not on the board | Host clicks **Deny** → strike X → next player on same team |
| Team gets 2 strikes | Steal phase begins — other team gets ONE guess |
| Stealing team guesses right | Host clicks the box → stealing team wins the pot |
| Stealing team guesses wrong | Host clicks **Steal failed** → original team wins the pot |
| All answers revealed | Controlling team wins the pot automatically |
| All rounds done | Game enters Fast Money setup |
| Fast Money total ≥ target (200) | Winning team gets a 1000-point bonus |
