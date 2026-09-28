# Minesweeper — Field Notes

A small, dependency-free Minesweeper clone that runs in a browser. Open `index.html` directly or serve this directory with any static file server.

## Play

- Choose Beginner (9 × 9, 10 mines), Intermediate (16 × 16, 40 mines), Expert (16 × 30, 99 mines), or make a custom field.
- Click a square to uncover it. The first click is safe and clears a small starting area when the field size allows.
- Right-click or press **F** on a covered square to cycle it through unmarked, certain flag, and ½-chance flag. Certain flags subtract one mine; ½-chance flags subtract half a mine and are still eligible to be uncovered. Only certain flags satisfy a number when chording. On touch screens, turn on **Flag mode** and tap squares to cycle them.
- Use the arrow keys to move around the board. Click a revealed numbered square after flagging its neighbors to uncover the remaining neighbors together.
- Press **R** or use the face button to start a fresh field. Best times are saved locally in the browser.

There is no build step and no server-side code.
