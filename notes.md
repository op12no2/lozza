### todo

- iir - done - sprt
- lmp - done - sprt
- use tt move in qs - fails sprt - why?
- use tt score in qs - fails sprt - why?
- remove tt move from captures list
- remove tt move from quiets list
- write to tt in qs beta
- write to tt in qs alpha
- pv
- see
- use mat draw in s
- use mat draw in qs
- killers
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

- simplify - zob_stm can be scaler
- don't rank moves when in check
- track probable cut nodes
- use tt score, not eval
- normalise eval scale 
- eval cache
- nodes test nearer top of s and qs
- don't test for time up in qs
- id - don't start next depth if not enough time
- id - remove the bm paranoia now there is a tt
- defer nnue updates (post m-m and/or eval)
- pass incheck to move ierator in qs (only for move gen)
- extensions if in check etc
- only 2 calls to lmr in pv context
- tt protect bigger depths
- tt buckets
- spsa tune
- lmp - tell move iterator rather then cycle

### sprt on hetzner epyc 7502p server

- Make sure ./lozza and ./releases/lozza are different (uci / bench etc)

```
./bin/sync.sh # copy to server
ssh root@epyc

tmux new -s sprt
./bin/sprt.sh | tee sprt.log; bash

# detach (make sure tmux pane is focused)
ctrl-b d

# later...
ssh root@epyc
tmux ls
tmux attach -t sprt # works after finish (b/c of `; bash`)
tail -f sprt.log # or just tail sprt.log if finished

# optional cleanup
tmux kill-session -t sprt
```
