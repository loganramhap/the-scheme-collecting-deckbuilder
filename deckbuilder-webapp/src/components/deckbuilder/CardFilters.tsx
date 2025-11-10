import React, { useState, useEffect, useCallback } from 'react';
import {
  CardFilters as CardFiltersType,
  MTG_CARD_TYPES,
  MTG_RARITIES,
  MTG_COLORS,
  RIFTBOUND_CARD_TYPES,
  RIFTBOUND_RARITIES,
  RIFTBOUND_FACTIONS,
} from '../../types/filters';
import './CardFilters.css';

interface CardFiltersProps {
  filters: CardFiltersType;
  onFilterChange: (filters: CardFiltersType) => void;
  gameType: 'mtg' | 'riftbound';
}

export const CardFilters: React.FC<CardFiltersProps> = ({
  filters,
  onFilterChange,
  gameType,
}) => {
  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null);

  // Debounced search handler
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = window.setTimeout(() => {
      if (searchInput !== filters.searchQuery) {
        onFilterChange({ ...filters, searchQuery: searchInput });
      }
    }, 300);

    setDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [searchInput]);

  // Update search input when filters change externally
  useEffect(() => {
    setSearchInput(filters.searchQuery);
  }, [filters.searchQuery]);

  // Get game-specific options
  const cardTypes = gameType === 'mtg' ? MTG_CARD_TYPES : RIFTBOUND_CARD_TYPES;
  const rarities = gameType === 'mtg' ? MTG_RARITIES : RIFTBOUND_RARITIES;

  // Handle type filter toggle
  const handleTypeToggle = useCallback((type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    onFilterChange({ ...filters, types: newTypes });
  }, [filters, onFilterChange]);

  // Handle rarity filter toggle
  const handleRarityToggle = useCallback((rarity: string) => {
    const newRarities = filters.rarities.includes(rarity)
      ? filters.rarities.filter(r => r !== rarity)
      : [...filters.rarities, rarity];
    onFilterChange({ ...filters, rarities: newRarities });
  }, [filters, onFilterChange]);

  // Handle color filter toggle (MTG only)
  const handleColorToggle = useCallback((color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color];
    onFilterChange({ ...filters, colors: newColors });
  }, [filters, onFilterChange]);

  // Handle cost range changes
  const handleMinCostChange = useCallback((value: string) => {
    const minCost = value === '' ? null : parseInt(value, 10);
    onFilterChange({ ...filters, minCost });
  }, [filters, onFilterChange]);

  const handleMaxCostChange = useCallback((value: string) => {
    const maxCost = value === '' ? null : parseInt(value, 10);
    onFilterChange({ ...filters, maxCost });
  }, [filters, onFilterChange]);

  // Calculate active filter count
  const activeFilterCount = 
    filters.types.length +
    filters.rarities.length +
    filters.colors.length +
    (filters.minCost !== null ? 1 : 0) +
    (filters.maxCost !== null ? 1 : 0) +
    (filters.searchQuery ? 1 : 0);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    onFilterChange({
      types: [],
      minCost: null,
      maxCost: null,
      rarities: [],
      colors: [],
      searchQuery: '',
    });
  }, [onFilterChange]);

  return (
    <div className="card-filters">
      <div className="card-filters-header">
        <h3>Filters</h3>
        {activeFilterCount > 0 && (
          <div className="filter-actions">
            <span className="active-filter-count">{activeFilterCount} active</span>
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="filter-section">
        <label htmlFor="card-search">Search</label>
        <input
          id="card-search"
          type="text"
          className="search-input"
          placeholder="Search by card name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {/* Card Type Filter */}
      <div className="filter-section">
        <label>Card Type</label>
        <div className="filter-options">
          {cardTypes.map(type => (
            <button
              key={type}
              className={`filter-chip ${filters.types.includes(type) ? 'active' : ''}`}
              onClick={() => handleTypeToggle(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Cost Range Filter */}
      <div className="filter-section">
        <label>Cost Range</label>
        <div className="cost-range-inputs">
          <input
            type="number"
            className="cost-input"
            placeholder="Min"
            min="0"
            value={filters.minCost ?? ''}
            onChange={(e) => handleMinCostChange(e.target.value)}
          />
          <span className="cost-separator">to</span>
          <input
            type="number"
            className="cost-input"
            placeholder="Max"
            min="0"
            value={filters.maxCost ?? ''}
            onChange={(e) => handleMaxCostChange(e.target.value)}
          />
        </div>
      </div>

      {/* Rarity Filter */}
      <div className="filter-section">
        <label>Rarity</label>
        <div className="filter-options">
          {rarities.map(rarity => (
            <button
              key={rarity}
              className={`filter-chip ${filters.rarities.includes(rarity) ? 'active' : ''}`}
              onClick={() => handleRarityToggle(rarity)}
            >
              {rarity}
            </button>
          ))}
        </div>
      </div>

      {/* Color Filter (MTG only) */}
      {gameType === 'mtg' && (
        <div className="filter-section">
          <label>Colors</label>
          <div className="filter-options color-options">
            {MTG_COLORS.map(color => (
              <button
                key={color.code}
                className={`filter-chip color-chip color-${color.code.toLowerCase()} ${
                  filters.colors.includes(color.code) ? 'active' : ''
                }`}
                onClick={() => handleColorToggle(color.code)}
                title={color.name}
              >
                {color.code}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Faction Filter (Riftbound only) */}
      {gameType === 'riftbound' && (
        <div className="filter-section">
          <label>Faction</label>
          <div className="filter-options">
            {RIFTBOUND_FACTIONS.map(faction => (
              <button
                key={faction}
                className={`filter-chip ${filters.colors.includes(faction) ? 'active' : ''}`}
                onClick={() => handleColorToggle(faction)}
              >
                {faction}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
