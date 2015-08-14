#!/bin/bash

NO="--dry-run"
if [ "$1" = "do" ] ; then
  NO=""
else
echo DRY-RUN!!!!!!!!!!!!!!!!!!!!!!!!!
fi

rsync $NO -avP --delete build/ netztest@www.netztest.at:/var/www/www.netztest.at/

[ "$1" = "do" ] || echo !!!!!!!!!!!!DRY-RUN!!!!!!!!!!!!!!!!!!!!!!!!!
