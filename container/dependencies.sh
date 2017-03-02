set -e

apt-get update
apt-get install -y git gcc postgresql openssl

wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash

wget -nv https://storage.googleapis.com/golang/go1.8.linux-amd64.tar.gz
tar xf go1.8.linux-amd64.tar.gz
mv go /usr/local

mkdir /.gopath
go get -v github.com/constabulary/gb/...
