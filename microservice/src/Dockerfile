FROM node:alpine

ENV SRC_DIR /docker-app

# Override the DB_HOST. Yes, it works.
ENV DB_HOST=host.docker.internal

# Copy application.
# Docker can only copy files from the directory the Dockfile is in, or it's children.
# Not from the parent.
COPY ./ ${SRC_DIR}

# Set work directory.
WORKDIR ${SRC_DIR}

# Install
RUN npm install

# Create user. Put this last or else we won't have write permission and cannot npm install.
# Specific to Alpine Linux,
#    -h --home DIR           Home directory
#    -g --gecos GECOS        GECOS field
#    -s --shell SHELL        Login shell named SHELL by example /bin/bash
#    -G --ingroup GRP        Group (by name)
#    -S --system             Create a system user
#    -D --disabled-password  Don't assign a password, so cannot login
#    -H --no-create-home     Don't create home directory
#    -u --uid UID            User id
#    -k SKEL                 Skeleton directory (/etc/skel)
RUN adduser -H -D dockeruser
USER dockeruser

CMD ["npm", "run", "start"]