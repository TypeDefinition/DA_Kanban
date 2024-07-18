APP_NAME="microservice"

# Is there already an image built?
IMAGE_EXISTS=$(docker images -q -f reference="${APP_NAME}")

# If yes, delete it.
# Use double square brackets. (https://stackoverflow.com/questions/13617843/unary-operator-expected-error-in-bash-if-condition)
if [[ $IMAGE_EXISTS != "" ]]
then
    docker rmi ${APP_NAME}
fi

echo y | docker system prune
docker build -t ${APP_NAME} .
docker-compose -f ./compose.yaml up -d