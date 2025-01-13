Log of Lozza 5's *zero* net attempts using a datagen.js -> filter.js -> trainer.js loop.

**Attempt 1**

768x128x1 float32s squared relu. Random init of weights for gen. 0 net. Biases=0. lerp=0.5. stretch=100. 10k/100k soft/hard nodes. Filter positions which are in/gives check and positions where best move is noisy. Include nstm positions (because net is white-relative). Discard data at each gen.

- Data = mega filtered positions (including nstm positions). 
- SPRT1 = v previous gen.
- SPRT2 = v Lozza 4.

| Gen | Data | Epochs | Loss | SPRT1 | SPRT2 | Date | Note |
| --- | ---- | ------ | ---- | ----- | ----- | ---- | ---- | 
| 0  | -     | -  | -      | -    | -    | 12/1 |  |
| 1  | 0.5   | 7  | 0.0016 | +inf | -inf | 12/1 | All draws. |
| 2  | 1.7   | 10 | 0.0165 | +inf | -inf | 12/1 | |
| 3  | 3.9   | 13 | 0.0128 | +inf | -inf | 12/1 | |
| 4  | 12.8  | 26 | 0.0144 | +400 | -inf | 13/1 | |
| 5  |   |  |  |  |  | 14/1 | |


