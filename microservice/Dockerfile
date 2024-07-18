FROM node:alpine

ENV APP_NAME microservice
ENV DEP_FILE microservice-1.0.0.tgz

ENV ROOT_DIR /docker-app
ENV SRC_DIR ${ROOT_DIR}/src
ENV DEP_DIR ${ROOT_DIR}/dep

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
RUN addgroup -S dockergroup && adduser -S -D dockeruser -G dockergroup
RUN chown -R dockeruser:dockergroup ${ROOT_DIR}
USER dockeruser

CMD ["npm", "run", "start"]