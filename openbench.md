## Contributing to public OpenBench instances using Linux

### Setup

Install the necessary compilers etc. Using Ubuntu and assuming no dev tools are present for example:-

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

### Fire up OpenBench 

```
cd OpenBench/Client
rm machine.txt     # do this if you use more than one server
rm openbench.exit  # just in case

python3 ./client.py -U username -P password -S server -T threads -N sockets --clean
```

For example:-

```
python3 ./client.py -U username -P password -S http://grantnet.us -T 8 -N 1 --clean
```

```username```, ```password``` and ```server``` can be specified using environment variables if you prefer:- 

```
OPENBENCH_USERNAME
OPENBENCH_PASSWORD
OPENBENCH_SERVER
```

```-T``` - Number of threads to use; don't exceed processor threads and use less than max if using PC.

```-N``` - Number of sockets, usually 1.

```--clean``` - Keeps ```client.py``` up to date, so not always needed.

Additionally:-

```--focus engine(s)``` will preferentially but not exclusively download work for the stated engine(s). 

If you get an error saying a ```.pgn``` file doesn't exist it means you have not deleted ```openbench.exit``` before running the script.

If you start getting other errors, make sure you are up to date: ```sudo apt update && sudo apt upgrade -y```

It's not recommended to use a processor that has a combination of performance and efficient cores unless you take steps to explicitly target the P or E cores, or somehow randomise things that such everything falls out in the wash.  

### Safely kill the client

```
cd OpenBench/Client
echo > openbench.exit
# wait for the client to stop
rm openbench.exit
```

### Using Windows

It is possible to get all the dev tools set up in Windows, but it's far easier to install WSL and use Linux.

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
    
