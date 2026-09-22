# --- Stage 1: build -----------------------------------------------------
# Uses the Maven wrapper against a JDK image so the build doesn't depend on
# Maven being installed on the host — only Docker is required.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy wrapper + pom first so dependency resolution is cached in its own
# layer and doesn't re-download on every source change.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

COPY src/ src/
RUN ./mvnw -B clean package -DskipTests

# --- Stage 2: run ---------------------------------------------------------
# JRE-only (no JDK/Maven) runtime image, so the final image is a fraction of
# the build image's size.
FROM eclipse-temurin:21-jre AS run
WORKDIR /app

# Run as a non-root user rather than the default root.
RUN useradd --create-home --shell /bin/false blncr
USER blncr

COPY --from=build /app/target/*.jar app.jar

EXPOSE 9090

# JWT_SECRET, DB_HOST, DB_PASSWORD, etc. are supplied at `docker run`/compose
# time (see .env.example) — nothing secret is baked into the image.
ENTRYPOINT ["java", "-jar", "/app/app.jar"]