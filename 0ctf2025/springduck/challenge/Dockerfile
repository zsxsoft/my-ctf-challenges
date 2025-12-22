FROM openjdk:26-ea-17-jdk-slim

COPY duckknows-0.0.1-SNAPSHOT.jar /app/duckknows.jar
COPY readflag /readflag
COPY run.sh /run.sh
RUN useradd -m -u 1000 user && \
    chmod +x /run.sh && \
    chmod +x /readflag && \
    su user -c "java -jar /app/duckknows.jar --init-db"

EXPOSE 8080

CMD ["/run.sh"]
