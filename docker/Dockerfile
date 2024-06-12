FROM node:alpine
COPY . /app
WORKDIR /app

RUN addgroup -S appgroup && adduser -S -D appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

CMD node app.js