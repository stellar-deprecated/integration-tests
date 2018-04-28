FROM stellar/base:latest

ENV GOPATH "/.gopath"
ENV PATH "$PATH:/usr/local/go/bin:$GOPATH/bin"

ADD dependencies.sh /
RUN ["chmod", "+x", "dependencies.sh"]
RUN /dependencies.sh
