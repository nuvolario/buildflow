# BuildFlow - Makefile
# Comandi rapidi per gestione ambiente Docker

.PHONY: help up down build logs shell migrate clean reset

# Default target
help:
	@echo "BuildFlow - Comandi disponibili:"
	@echo ""
	@echo "  make up        - Avvia tutti i container"
	@echo "  make down      - Ferma tutti i container"
	@echo "  make build     - Rebuild dei container"
	@echo "  make logs      - Mostra logs di tutti i container"
	@echo "  make logs-be   - Mostra logs del backend"
	@echo "  make logs-fe   - Mostra logs del frontend"
	@echo "  make logs-db   - Mostra logs del database"
	@echo "  make shell-be  - Shell nel container backend"
	@echo "  make shell-db  - Shell MySQL"
	@echo "  make migrate   - Esegue migrations"
	@echo "  make clean     - Rimuove container e volumi"
	@echo "  make reset     - Reset completo (clean + up)"
	@echo "  make status    - Stato dei container"
	@echo ""
	@echo "URLs:"
	@echo "  Frontend:   http://localhost:5173"
	@echo "  Backend:    http://localhost:3001/api"
	@echo "  phpMyAdmin: http://localhost:8080"

# Avvia tutti i servizi
up:
	@echo "Avvio BuildFlow..."
	docker-compose up -d
	@echo ""
	@echo "BuildFlow avviato!"
	@echo "Frontend:   http://localhost:5173"
	@echo "Backend:    http://localhost:3001/api"
	@echo "phpMyAdmin: http://localhost:8080"

# Avvia con log
up-logs:
	docker-compose up

# Ferma tutti i servizi
down:
	@echo "Arresto BuildFlow..."
	docker-compose down

# Rebuild
build:
	@echo "Rebuild containers..."
	docker-compose build --no-cache

# Rebuild e avvia
rebuild: build up

# Logs
logs:
	docker-compose logs -f

logs-be:
	docker-compose logs -f backend

logs-fe:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f db

# Shell
shell-be:
	docker-compose exec backend sh

shell-fe:
	docker-compose exec frontend sh

shell-db:
	docker-compose exec db mysql -u buildflow_user -pbuildflow_pass buildflow

# Migrations
migrate:
	docker-compose exec backend npm run migrate

migrate-status:
	docker-compose exec backend npm run migrate:status

# Pulizia
clean:
	@echo "Pulizia completa..."
	docker-compose down -v --remove-orphans
	docker system prune -f

# Reset completo
reset: clean build up

# Status
status:
	docker-compose ps

# Health check
health:
	@echo "Health check..."
	@curl -s http://localhost:3001/api/health | python3 -m json.tool || echo "Backend non raggiungibile"
	@echo ""
	@curl -s http://localhost:3001/api/version | python3 -m json.tool || echo "Backend non raggiungibile"

# Backup database
backup-db:
	@echo "Backup database..."
	@mkdir -p backups
	docker-compose exec db mysqldump -u root -pbuildflow_root buildflow > backups/buildflow_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup salvato in backups/"

# Restore database
restore-db:
	@echo "Restore database da ultimo backup..."
	@LATEST=$$(ls -t backups/*.sql 2>/dev/null | head -1); \
	if [ -n "$$LATEST" ]; then \
		echo "Restore da $$LATEST..."; \
		docker-compose exec -T db mysql -u root -pbuildflow_root buildflow < $$LATEST; \
		echo "Restore completato!"; \
	else \
		echo "Nessun backup trovato in backups/"; \
	fi
