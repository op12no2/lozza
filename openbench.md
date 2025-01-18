## Contributing to public OpenBench instances using Linux

### Setup

Install the necessary compilers etc. Using a Ubuntu and assuming no dev tools are present for example:-

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
```

If a compiler or runtime environment is missing (e.g. Java) the affected engines are simply not tested on your machine.

### Clone OpenBench

```
git clone https://github.com/AndyGrant/OpenBench OpenBench
```

### Create a script to fire up OpenBench 

Start with something like:-

```
[ -f machine.txt ] && rm machine.txt
[ -f openbench.exit ] && rm openbench.exit
python3 ./client.py -U username -P password -S $1 -T $2 -N 1 --clean
```

There are more options that ```client.py``` can take, including being able to preferentially focus on certain engines. See ```client.py``` and ```worker.py``` in the OpenBench repo (link below).

The script doesn't need to delete ```machine.txt``` if you always use the same server. ```--clean``` keeps ```client.py``` up to date.

Your username and password can be specified using environment variables if you prefer. See links below.
 
### Run the script

The number of threads (-T option) should not exceed the capacity of your processor. For example on a Ryzen 7950x being exclusively used for OpenBench:-

```
cd OpenBench/Client
./ob http://chess.grantnet.us 32 &
```

If you get an error saying a ```.pgn``` file doesn't exist it means you have not deleted ```openbench.exit``` before running the script.

If you start getting errors, make sure you are up to date: ```sudo apt update && sudo apt upgrade -y```

It's not recommended to use a processor that has a combination of performance and efficient cores unless you take steps to explicitly target the P or E cores, or somehow randomise things that such everything falls out in the wash.  

### Safely kill the script

```
cd OpenBench/Client
echo > openbench.exit
```

Alternatively run the script in the foreground and fire up another terminal to kill it.

### Using Windows

It is possible to get all the dev tools set up in Windows but it's much easier to install WSL and use Linux.

### Servers

Get a user name by registering with a server. Example servers:-

- http://chess.grantnet.us 
- https://chess.swehosting.se
- https://pyronomy.pythonanywhere.com

There are more listed in the OpenBench Discord ```#openbench-instances``` channel (link below).

### Links

- Openbench repo and documentation - https://github.com/AndyGrant/OpenBench
- OpenBench discord - https://discord.com/invite/9MVg7fBTpM
- Pyro's engine testing guide - https://dannyhammer.github.io/engine-testing-guide
- WSL - https://learn.microsoft.com/en-us/windows/wsl/install
    
