if [ "$(hostname)" != "colinj" ]
then
  echo "use colinj!"
  exit 1
fi

#rsync -avz ~/lozza/ xyzzy:~/lozza/
rsync -avz ~/lozza/ root@135.181.131.186:~/lozza/
