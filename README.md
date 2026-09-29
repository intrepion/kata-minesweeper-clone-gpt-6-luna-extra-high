# Field Notes — Hidden Field

A small, dependency-free hidden-mine logic game that runs in a browser. Open `index.html` directly or serve this directory with any static file server.

## Play

- Choose Beginner (9 × 9, 10 mines), Intermediate (16 × 16, 40 mines), Expert (16 × 30, 99 mines), or make a custom field.
- Click a square to uncover it. The first click is safe and clears a small starting area when the field size allows.
- Right-click or press **F** on a covered square to cycle it through unmarked, certain flag, ½ note, ⅓ note, and ¼ note. Probability notes display as plain fractions without a flag graphic. They subtract their displayed fraction from mines remaining and remain eligible to be uncovered; only certain flags satisfy a number when chording. On touch screens, turn on **Flag mode** and tap squares to cycle them.
- Each new game gives you three optional hints. After your first reveal, a hint places a certain flag on one randomly selected mine that is not already certainly flagged. It replaces any probability note on that square.
- The timer starts on the first reveal and counts up to 9,999 seconds.
- During a game, choose **Pause** to stop the timer and hide the full screen until you resume.
- Use the arrow keys to move around the board. Click a revealed numbered square after flagging its neighbors to uncover the remaining neighbors together.
- Press **R** or use the face button to start a fresh field. The top three named, unassisted times are saved locally for each preset difficulty; custom board dimensions keep separate tables.

There is no build step and no server-side code.
