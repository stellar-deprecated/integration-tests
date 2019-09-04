set -e

apt-get update
apt-get install -y git mercurial gcc curl postgresql openssl

wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash

wget -nv https://dl.google.com/go/go1.13.linux-amd64.tar.gz
tar xf go1.13.linux-amd64.tar.gz
mv go /usr/local

mkdir -p /.gopath/bin
mkdir -p /.gopath/src
