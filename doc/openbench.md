## OpenBench Notes

### Linux/Windows

Lozza only works with OpenBench on Linux. On Windows machines install WSL2 to get a Linux environment.

### Node

Lozza needs Node to run. The latest version of Node is 22 and Lozza needs at least version 18. Node is often packaged with Linux but is usually very old.

```
node --version
```

If Node is not installed or your verison is older than 18 you can install it like this:-

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# restart terminal
nvm install 22
# restart terminal
node --version
# check that which find the correct version
which node
```
### Install OpenBench on Opalstack hosting.

Create a new django app in the control panel and attach it to a site/domain. Assuming it's called openbench:-
```
cd ~/apps/openbench 
source env/bin/activate
git clone https://github.com/<you>/OpenBench 
sed -i -e 's/myproject/OpenBench/' uwsgi.ini
sed -i -e 's/myproject/OpenSite/' uwsgi.ini
cd OpenBench
pip install -r requirements.txt 
python3 manage.py makemigrations OpenBench 
python3 manage.py migrate 
python3 manage.py createsuperuser 
../stop
../start
```
### Links

- https://nodejs.org
- https://nodejs.org/en/download
- https://github.com/AndyGrant/OpenBench
- https://github.com/op12no2/OpenBench
- https://github.com/op12no2/OpenBench/blob/master/Engines/Lozza.json
- https://github.com/op12no2/OpenBench/blob/master/Config/config.json


