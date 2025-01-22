### Linux/Windows

Lozza only works with OpenBench on Linux. On Windows machines install WSL2 to get a Linux environment.

### Node

Lozza needs Node to run. The latest version of Node is 22. Install Node like this:-

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# restart terminal
nvm install 22
# restart terminal
```

To check node is installed do this:-
```
node --version
```
Note that some Linux installs come with Node but it's often old, so always do the above. Lozza needs version 18 or higher to work in OpenBench.

