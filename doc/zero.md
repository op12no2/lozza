A log of Lozza 5's probably futile 'zero' net attempts.

**Attempt 1**

- Net architecture: 768x128x1 unquantised float32s, squared relu (unclamped) activation. 
- Generation 0 net weights, biases: Random, 0.
- Data generation: 10k/100k soft/hard nodes. 9/10 random ply. Ignore first 15/16 ply. Include nstm positions (because the net is white-relative). Discard data at each generation. 
- Filtering: Positions which are in/gives check and positions where best move is noisy. Total filtered M positions is in Data column below. 
- Training: lerp=0.5. stretch=100. Shuffle after each epoch. Very quick testing for # epochs. 
- Testing: SPRT1 == v previous generation net, SPRT2 == v Lozza 4. 

| Gen | Data | Epochs | Loss | SPRT1 | SPRT2 | Date | Note |
| --- | ---- | ------ | ---- | ----- | ----- | ---- | ---- | 
| 0  | -     | -  | -      | -    | -    | 12/1 |  |
| 1  | 0.5   | 7  | 0.0016 | +inf | -inf | 12/1 | All draws. |
| 2  | 1.7   | 10 | 0.0165 | +inf | -inf | 12/1 | |
| 3  | 3.9   | 13 | 0.0128 | +inf | -inf | 12/1 | |
| 4  | 12.8  | 26 | 0.0144 | +400 | -inf | 13/1 | |
| 5  | 23.6  | 5 | 0.0168 | +130 | -inf | 14/1 | |
| 6  | 40.2 | 19 | 0.0162 | +101 | ? | 16/1 | |
