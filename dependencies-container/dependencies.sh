set -e

apt-get update
apt-get install -y git mercurial gcc curl postgresql openssl

wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash

wget -nv https://storage.googleapis.com/golang/go1.8.linux-amd64.tar.gz
tar xf go1.8.linux-amd64.tar.gz
mv go /usr/local

mkdir -p /.gopath/bin
mkdir -p /.gopath/src
curl https://glide.sh/get | sh

# build glide cache so final container starts faster
git clone https://github.com/stellar/go go-temp
cd go-temp
glide install
cd -
rm -rf go-temp
