FROM postgres:17 as build
ARG PGVECTOR_VERSION=v0.8.0

USER root

RUN set -e; \
    apt-get update ; \
    apt-get install -y build-essential git postgresql-server-dev-17 ; \
    git clone --branch $PGVECTOR_VERSION https://github.com/pgvector/pgvector.git /tmp/pgvector ; \
    cd /tmp/pgvector ; \
    make OPTFLAGS="" ; \
    make install ; \
    :

FROM postgres:17

# Doc
COPY --from=build \
     /tmp/pgvector/README.md \
     /tmp/pgvector/LICENSE \
       /usr/share/doc/pgvector/
# Code
COPY --from=build \
     /tmp/pgvector/vector.so \
       /usr/lib/postgresql/17/lib/
COPY --from=build \
     /tmp/pgvector/vector.control \
       /usr/share/postgresql/17/extension/
COPY --from=build \
     /tmp/pgvector/sql/*.sql \
       /usr/share/postgresql/17/extension/
