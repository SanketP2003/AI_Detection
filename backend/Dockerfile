# Use an official OpenJDK runtime as a parent image
FROM eclipse-temurin:17-jdk AS build

# Set the working directory
WORKDIR /app

# Copy Maven wrapper and pom first for better caching
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Copy the rest of the application source code
COPY . .

# Build the application using sh to bypass executable permission issues
# Render will inject PORT; server.port is configured via application properties
RUN sh ./mvnw package -DskipTests -B

# Use a smaller JRE image for the final container
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080 as metadata (Render still uses the PORT env var it provides)
EXPOSE 8080

# Run the application; port is controlled via configuration (e.g. server.port=${PORT:8080})
ENTRYPOINT ["java", "-jar", "app.jar"]
