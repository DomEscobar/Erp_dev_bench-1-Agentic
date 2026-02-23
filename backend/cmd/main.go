package main

import (
	"github.com/DomEscobar/erp-dev-bench/internal/config"
	"github.com/DomEscobar/erp-dev-bench/internal/server"
)

func main() {
	cfg := config.Load()
	server.Start(cfg)
}
