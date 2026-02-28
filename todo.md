### todo

- iir (fails - why?) 
- use mat draw in qs
- futility
- output buckets
- corrhist
- conthist
- caphist 
- singular extensions
- probcut
- tablebases support
- dfrc support
- mate distance pruning
- improving heuristic (and use of)

### things to try 

- try delta pruning in qs (see_ge fails)
- sort captures using see
- reduce bad captures in lmr (see)
- reduce good captures in lmr (see)
- reduce captures in lmr
- lmr if in check
- compare uci bm and nodes[0].pv[0] - are they ever different? if not simplify
- change tc check quantise to 4095
- experiment with promote ranking in rank_noisy()
- apply penalty to pruned moves, currently skipped
- use put_tt_score in qs
- simplify zob_stm - can be scaler
- track probable cut nodes
- use tt score, not eval
- normalise eval scale 
- eval cache - but struct would quantise up to 24 bytes
- don't test for time up in qs
- defer nnue updates until eval (so we skip for tt early exists for example)
- pass incheck to move ierator in qs (only for use by move gen)
- extensions if in check etc
- only 2 calls to lmr in pv context
- tt protect bigger depths 
- tt buckets
- spsa tune
- lmp - tell move iterator rather then cycle
- try R = 0.75 + ln(depth) * ln(moves_played) / 2.25
- board is currently undefined on time up - sprt fixing that

