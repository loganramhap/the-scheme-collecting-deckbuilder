package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type DeckCard struct {
	ID    string `json:"id"`
	Count int    `json:"count"`
	Name  string `json:"name,omitempty"`
}

type DeckMetadata struct {
	Author      string   `json:"author"`
	Created     string   `json:"created"`
	Updated     string   `json:"updated,omitempty"`
	Description string   `json:"description,omitempty"`
	Tags        []string `json:"tags,omitempty"`
}

type Deck struct {
	Game      string       `json:"game"`
	Format    string       `json:"format"`
	Name      string       `json:"name"`
	Cards     []DeckCard   `json:"cards"`
	Sideboard []DeckCard   `json:"sideboard,omitempty"`
	Metadata  DeckMetadata `json:"metadata"`
}

func main() {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// API endpoints
	r.Route("/api/deck", func(r chi.Router) {
		r.Get("/parse", parseDeckHandler)
		r.Get("/validate", validateDeckHandler)
	})

	// Serve static files for the viewer
	r.Get("/viewer/*", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./static/viewer.html")
	})

	port := ":8080"
	log.Printf("Gitea Deck Plugin starting on %s", port)
	log.Fatal(http.ListenAndServe(port, r))
}

func parseDeckHandler(w http.ResponseWriter, r *http.Request) {
	content := r.URL.Query().Get("content")
	if content == "" {
		http.Error(w, "content parameter required", http.StatusBadRequest)
		return
	}

	var deck Deck
	if err := json.Unmarshal([]byte(content), &deck); err != nil {
		http.Error(w, fmt.Sprintf("invalid deck JSON: %v", err), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(deck)
}

func validateDeckHandler(w http.ResponseWriter, r *http.Request) {
	content := r.URL.Query().Get("content")
	if content == "" {
		http.Error(w, "content parameter required", http.StatusBadRequest)
		return
	}

	var deck Deck
	if err := json.Unmarshal([]byte(content), &deck); err != nil {
		http.Error(w, fmt.Sprintf("invalid deck JSON: %v", err), http.StatusBadRequest)
		return
	}

	validation := validateDeck(&deck)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(validation)
}

type ValidationResult struct {
	Valid    bool     `json:"valid"`
	Errors   []string `json:"errors"`
	Warnings []string `json:"warnings"`
}

func validateDeck(deck *Deck) ValidationResult {
	result := ValidationResult{
		Valid:    true,
		Errors:   []string{},
		Warnings: []string{},
	}

	totalCards := 0
	for _, card := range deck.Cards {
		totalCards += card.Count
	}

	// MTG validation
	if deck.Game == "mtg" {
		if deck.Format == "commander" && totalCards != 100 {
			result.Valid = false
			result.Errors = append(result.Errors, fmt.Sprintf("Commander decks must have exactly 100 cards. Current: %d", totalCards))
		} else if (deck.Format == "standard" || deck.Format == "modern") && totalCards < 60 {
			result.Valid = false
			result.Errors = append(result.Errors, fmt.Sprintf("%s decks must have at least 60 cards. Current: %d", strings.Title(deck.Format), totalCards))
		}
	}

	// Riftbound validation
	// Riftbound decks are exactly 40 cards (not including legend, 12 rune cards, and 3 battlefields)
	if deck.Game == "riftbound" {
		if totalCards != 40 {
			result.Valid = false
			result.Errors = append(result.Errors, fmt.Sprintf("Riftbound decks must have exactly 40 cards. Current: %d", totalCards))
		}
		if deck.Legend == nil {
			result.Warnings = append(result.Warnings, "No Legend selected")
		}
		if deck.Battlefield == nil {
			result.Warnings = append(result.Warnings, "No Battlefield selected")
		}
	}

	return result
}
