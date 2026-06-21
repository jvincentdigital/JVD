PROJECT_NAME := john-vincent-digital

# Default target
.DEFAULT_GOAL := help

# ─── Development ──────────────────────────────────────────────

.PHONY: run
run: ## Start dev server
	pnpm run dev

.PHONY: build
build: ## Build for production
	pnpm run build

.PHONY: analyze
analyze: ## Build with bundle analyzer reports (writes .next/analyze/*.html)
	ANALYZE=true pnpm run build

.PHONY: start
start: ## Start production server locally
	pnpm run start

.PHONY: lint
lint: ## Run Next.js linter
	pnpm run lint

.PHONY: format
format: ## Format with Prettier
	pnpm run format

.PHONY: format-check
format-check: ## Verify formatting with Prettier (read-only)
	pnpm run format:check

.PHONY: typecheck
typecheck: ## Run TypeScript type checking
	npx tsc --noEmit

# ─── Testing ──────────────────────────────────────────────────

.PHONY: test
test: ## Run unit tests
	pnpm test

.PHONY: test-e2e
test-e2e: ## Run Playwright end-to-end tests against a built site
	pnpm run build && pnpm run test:e2e

# ─── Deployment ───────────────────────────────────────────────

.PHONY: deploy
deploy: ## Deploy to Vercel production
	vercel --yes --prod

.PHONY: deploy-preview
deploy-preview: ## Deploy a Vercel preview
	vercel --yes

.PHONY: logs
logs: ## View Vercel deployment logs
	vercel logs $(PROJECT_NAME).vercel.app

.PHONY: status
status: ## Show git and Vercel project status
	@echo "=== Git ===" && git log --oneline -5 && echo "" && echo "=== Vercel ===" && vercel ls 2>&1 | head -10

# ─── Utilities ────────────────────────────────────────────────

.PHONY: deps
deps: ## Install dependencies
	pnpm install

.PHONY: clean
clean: ## Remove build artifacts
	rm -rf .next

.PHONY: docs
docs: ## Serve docs locally
	python3 -m http.server 8080 --directory docs

# ─── Help ─────────────────────────────────────────────────────

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'
