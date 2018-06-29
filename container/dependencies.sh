set -e

apt-get update
apt-get install -y git mercurial gcc curl postgresql openssl

wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash

wget -nv https://storage.googleapis.com/golang/go1.10.linux-amd64.tar.gz
tar xf go1.10.linux-amd64.tar.gz
mv go /usr/local

mkdir -p /.gopath/bin
mkdir -p /.gopath/src
curl https://glide.sh/get | sh
