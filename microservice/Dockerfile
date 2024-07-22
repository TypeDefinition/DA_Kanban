FROM node:18-alpine

ENV APP_NAME microservice
ENV DEP_FILE microservice-1.0.0.tgz

ENV ROOT_DIR /docker-app
ENV SRC_DIR ${ROOT_DIR}/src
ENV DEP_DIR ${ROOT_DIR}/dep

# Override the DB_HOST. Yes, it works.
ENV DB_HOST=host.docker.internal

RUN mkdir ${ROOT_DIR}

# Copy application.
# Docker can only copy files from the directory the Dockfile is in, or it's children.
# Not from the parent.
COPY ./src ${SRC_DIR}

# Copy node modules.
COPY ./dep/${DEP_FILE} ${DEP_DIR}/${DEP_FILE}

# Set work directory.
WORKDIR ${SRC_DIR}

# Install
RUN npm install --prefix ./tmp ${DEP_DIR}/${DEP_FILE}
RUN cmp ./package.json ./tmp/node_modules/${APP_NAME}/package.json
RUN mv ./tmp/node_modules/${APP_NAME}/node_modules ./node_modules
RUN rm -rf ./tmp

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