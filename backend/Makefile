.PHONY: run build test lint vet clean

run:
	go run ./cmd/main.go

build:
	go build -o bin/server ./cmd/main.go

test:
	go test ./... -v -cover -coverprofile=coverage.out

vet:
	go vet ./...

lint:
	golangci-lint run ./...

coverage: test
	go tool cover -html=coverage.out -o coverage.html

clean:
	rm -rf bin/ erp.db coverage.out coverage.html

docker:
	docker build -t erp-dev-bench:latest .

docker-run:
	docker run -p 8080:8080 erp-dev-bench:latest
