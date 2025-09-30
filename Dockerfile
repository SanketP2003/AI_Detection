# Use an official OpenJDK runtime as a parent image
FROM eclipse-temurin:17-jdk as build

# Set the working directory
WORKDIR /app

# Copy Maven files and download dependencies (for better build caching)
COPY pom.xml .
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline

# Copy the rest of the application source code
COPY . .

# Build the application
RUN ./mvnw package -DskipTests

# Use a smaller JRE image for the final container
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080 (default for Spring Boot)
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
