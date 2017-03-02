# build container image
docker build ./container -t container

# TODO cache the image

# download ngrok
wget -nv https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip
unzip ngrok-stable-linux-amd64.zip

# start ngrok
export FI1_SUBDOMAIN=stellarfi$(openssl rand -hex 5)
export FI1_DOMAIN=${FI1_SUBDOMAIN}.ngrok.io
export FI2_SUBDOMAIN=stellarfi$(openssl rand -hex 5)
export FI2_DOMAIN=${FI2_SUBDOMAIN}.ngrok.io

cp ngrok.tpl.yml ngrok.yml
sed -i "s/{NGROK_AUTH_TOKEN}/${NGROK_AUTH_TOKEN}/g" ngrok.yml
sed -i "s/{FI1_SUBDOMAIN}/${FI1_SUBDOMAIN}/g" ngrok.yml
sed -i "s/{FI2_SUBDOMAIN}/${FI2_SUBDOMAIN}/g" ngrok.yml

./ngrok start --config ./ngrok.yml --all --log=stdout > ngrok.log &

# build cluster
docker-compose up &

# start monitoring app
node monitor.js
