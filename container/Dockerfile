FROM stellar/base:latest

# FI server (stellar.toml, federation and proxied auth server)
EXPOSE 8003

ENV GOPATH "/.gopath"
ENV PATH "$PATH:/usr/local/go/bin:$GOPATH/bin"

ADD dependencies.sh /
RUN ["chmod", "+x", "dependencies.sh"]
RUN /dependencies.sh

ADD start.sh dependencies.sh bridge.cfg compliance.cfg index.js package.json /
ADD tests /tests
RUN ["chmod", "+x", "start.sh"]

ENTRYPOINT ./start.sh
