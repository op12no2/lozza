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

### Get the client

This is OTT but quick and easy:-

```
git clone https://github.com/AndyGrant/OpenBench OpenBench
```

### Fire up the client 

For example:-

```
cd OpenBench/Client

rm machine.txt     # just in case (last server was different)
rm openbench.exit  # just in case (forgot to delete it after previous use)

python3 ./client.py -U baabaa -P blacksheep -S http://chess.grantnet.us -T 12 -N 1 
```

```-U user``` - Register with a server to get a user name.

```-P password```

```-S server``` - See list below.

```-T threads``` - The number of threads to use. Don't exceed processor threads and use significantly less than the physical maximum if you are using your machine while the client is running.

```-N sockets``` - The number of sockets, usually 1.

Optional parameters:-

```-I identity``` - Give your machine a name.

```--focus engine(s)``` - Preferentially but not exclusively download work for the stated engine or space separated engines. 

```--clean``` - Keeps ```client.py``` up to date, so not always needed.

If you get an error saying a ```.pgn``` file doesn't exist it means you have not deleted ```openbench.exit``` before running the script. ```cutechess``` starts, exists and ```worker.py``` gets confused because the ```.pgn``` file doesn't exist.

If you start getting other errors, make sure you are up to date: ```sudo apt update && sudo apt upgrade -y```

It's not recommended to use a processor that has a combination of performance and efficiency cores unless you take steps to explicitly target one or the other, or somehow randomise things that such everything falls out in the wash.  

### Safely kill the client

```
# fire up a new terminal
cd OpenBench/Client
echo > openbench.exit
# wait for the client to stop
rm openbench.exit
```

### Using Windows

It is possible to get all the dev tools set up in Windows, but it's far easier to install WSL and use Linux.

### Servers

Example servers:-

- http://chess.grantnet.us 
- https://chess.swehosting.se
- https://pyronomy.pythonanywhere.com

There are more listed in the OpenBench Discord ```#openbench-instances``` channel (link below).

### Links

- Openbench repo and documentation - https://github.com/AndyGrant/OpenBench
- OpenBench discord - https://discord.com/invite/9MVg7fBTpM
- Pyro's engine testing guide - https://dannyhammer.github.io/engine-testing-guide
- WSL - https://learn.microsoft.com/en-us/windows/wsl/install
    
