FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

COPY . .

RUN chmod +x mvnw && ./mvnw package -DskipTests -B

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Health check for Render
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod}", "-jar", "app.jar"]
