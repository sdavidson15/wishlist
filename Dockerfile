FROM golang:1.16
WORKDIR /go/src/wishlist/
ADD . .
RUN go get
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
ADD config.txt config.txt
ADD frontend frontend
ADD storage/imdb/db storage/imdb/db
COPY --from=0 /go/src/wishlist/main .
ENV AWS_DEFAULT_REGION=us-east-1

CMD ["./main"]
