## Contributing to public OpenBench instances using Linux

### Setup

Install the necessary compilers etc. Using Ubuntu for example:-

```
# adapted from https://dannyhammer.github.io/engine-testing-guide/
 
sudo apt update && sudo apt upgrade -y

sudo apt update && sudo apt install git python3 pip make clang lld g++ gcc cargo cmake -y

sudo apt install python3-psutil
sudo apt install python3-cpuinfo

sudo apt search golang-go
sudo apt search gccgo-go
sudo apt install golang-go

# todo: java

sudo apt update && sudo apt upgrade -y

# reboot

sudo apt update && sudo apt upgrade -y

git clone https://github.com/AndyGrant/OpenBench OpenBench
```

### Create a script to fire up OpenBench 

Something like:-

```
rm machine.txt
rm openbench.exit
python3 ./client.py -U username -P password -S $1 -T $2 -S 1 --clean
```

### Run the script

Assuming it's called ob.

```
cd OpenBench/Client
./ob &
```

### Safely kill the script

```
cd OpenBench/Client
echo > openbench.exit
```

### Servers

- https://chess.grantnet.us 
- https://chess.swehosting.se 

