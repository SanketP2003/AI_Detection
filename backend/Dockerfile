FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

COPY . .

RUN chmod +x mvnw && ./mvnw package -DskipTests -B

FROM eclipse-temurin:21-jre

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENV SPRING_PROFILES_ACTIVE=prod

# Health check for Render
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -fsS http://localhost:8080/actuator/health || exit 1

# Use shell form to allow environment variable expansion
ENTRYPOINT java -jar app.jar
