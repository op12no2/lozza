Log of Lozza's 768x128x1 *zero* net evolution using a datagen.js -> filter.js -> trainer.js loop.

**Attempt 1**

- Data = mega filtered positions including nstm positions. i.e. each position appears twice (but shuffled).
- SPRT1 = v previous gen.
- SPRT2 = v Lozza 4.

| Gen | Data | Epochs | Loss | SPRT1 | SPRT2 | Date | Note |
| --- | ---- | ------ | ---- | ----- | ----- | ---- | ---- | 
| 0  | -     | -  | -      | -    | -    | 12/1 | Random init of weights. |
| 1  | 0.5   | 7  | 0.0016 | +inf | -inf | 12/1 | All draws. |
| 2  | 1.7   | 10 | 0.0165 | +inf | -inf | 12/1 | |
| 3  | 3.9   | 13 | 0.0128 | +inf | -inf | 12/1 | |
| 4  | 12.8  | 26 | 0.0144 | +400 | -inf | 13/1 | |
| 5  |   |  |  |  |  | 14/1 | |

Notes

- 0.5 lerp throughtout, should have used 1.0 (WDL) for early generations!
