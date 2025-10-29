"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Star, 
  History, 
  X, 
  ChevronDown, 
  ChevronUp,
  SortAsc,
  SortDesc,
  Grid,
  List,
  RotateCcw
} from "lucide-react";
import { format } from "date-fns";

export interface SearchFilter {
  id: string;
  name: string;
  type: 'text' | 'select' | 'date' | 'range' | 'checkbox' | 'multiselect';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'development' | 'planned';
  price?: number;
  date: string;
  relevance: number;
  tags: string[];
  isFavorite: boolean;
}

export interface AdvancedSearchProps {
  data: SearchResult[];
  filters: SearchFilter[];
  onSearch?: (results: SearchResult[], filters: any) => void;
  className?: string;
}

export default function AdvancedSearch({ 
  data, 
  filters, 
  onSearch, 
  className = "" 
}: AdvancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>(data);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'relevance' | 'title' | 'date' | 'price'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  // Load search history and favorites from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('finsmartai_search_history');
    const savedFavorites = localStorage.getItem('finsmartai_favorites');
    
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
    
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Save search history and favorites to localStorage
  useEffect(() => {
    localStorage.setItem('finsmartai_search_history', JSON.stringify(searchHistory));
    localStorage.setItem('finsmartai_favorites', JSON.stringify(Array.from(favorites)));
  }, [searchHistory, favorites]);

  // Get available categories from data
  const availableCategories = useMemo(() => {
    return Array.from(new Set(data.map(item => item.category)));
  }, [data]);

  // Filter and search data
  useEffect(() => {
    let results = [...data];

    // Apply search query
    if (searchQuery.trim()) {
      results = results.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      results = results.filter(item => selectedCategories.includes(item.category));
    }

    // Apply date range filter
    if (dateRange.from || dateRange.to) {
      results = results.filter(item => {
        const itemDate = new Date(item.date);
        if (dateRange.from && itemDate < dateRange.from) return false;
        if (dateRange.to && itemDate > dateRange.to) return false;
        return true;
      });
    }

    // Apply price range filter
    results = results.filter(item => {
      if (!item.price) return true;
      return item.price >= priceRange[0] && item.price <= priceRange[1];
    });

    // Apply status filter
    if (activeFilters.status) {
      results = results.filter(item => item.status === activeFilters.status);
    }

    // Apply other active filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (key !== 'status' && value) {
        results = results.filter(item => {
          if (Array.isArray(value)) {
            return value.includes(item[key as keyof SearchResult]);
          }
          return item[key as keyof SearchResult] === value;
        });
      }
    });

    // Sort results
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'relevance':
        default:
          comparison = a.relevance - b.relevance;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setSearchResults(results);
    setCurrentPage(1);
    
    if (onSearch) {
      onSearch(results, activeFilters);
    }
  }, [searchQuery, activeFilters, selectedCategories, dateRange, priceRange, sortBy, sortOrder, data, onSearch]);

  // Handle search submission
  const handleSearch = (query: string) => {
    if (query.trim() && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory].slice(0, 10); // Keep last 10 searches
      setSearchHistory(newHistory);
    }
    setSearchQuery(query);
  };

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters({});
    setSelectedCategories([]);
    setDateRange({ from: undefined, to: undefined });
    setPriceRange([0, 100000]);
    setSearchQuery("");
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = selectedCategories.length;
    if (dateRange.from || dateRange.to) count++;
    if (priceRange[0] > 0 || priceRange[1] < 100000) count++;
    if (activeFilters.status) count++;
    return count;
  };

  // Pagination calculations
  const totalPages = Math.ceil(searchResults.length / itemsPerPage);
  const paginatedResults = searchResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Advanced Search
          </CardTitle>
          <CardDescription>
            Search through {data.length} items with advanced filtering options
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={() => handleSearch(searchQuery)}
              className="px-6"
            >
              Search
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {getActiveFilterCount()}
                </Badge>
              )}
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Recent Searches:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((query, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSearch(query)}
                  >
                    {query}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchHistory(prev => prev.filter(h => h !== query));
                      }}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Advanced Filters</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAllFilters}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Categories</label>
                  <div className="space-y-2">
                    {availableCategories.map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories(prev => [...prev, category]);
                            } else {
                              setSelectedCategories(prev => prev.filter(c => c !== category));
                            }
                          }}
                        />
                        <label htmlFor={category} className="text-sm">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <div className="space-y-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange.from}
                          selected={{
                            from: dateRange.from,
                            to: dateRange.to,
                          }}
                          onSelect={(range) => {
                            setDateRange({
                              from: range?.from,
                              to: range?.to,
                            });
                          }}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Price Range: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={100000}
                    min={0}
                    step={1000}
                    className="w-full"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={activeFilters.status || ""}
                    onValueChange={(value) => {
                      setActiveFilters(prev => ({
                        ...prev,
                        status: value || undefined
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Filters */}
                {filters.map(filter => (
                  <div key={filter.id}>
                    <label className="text-sm font-medium mb-2 block">{filter.name}</label>
                    {filter.type === 'select' && filter.options && (
                      <Select
                        value={activeFilters[filter.id] || ""}
                        onValueChange={(value) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            [filter.id]: value || undefined
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={filter.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All</SelectItem>
                          {filter.options.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {filter.type === 'text' && (
                      <Input
                        placeholder={filter.placeholder}
                        value={activeFilters[filter.id] || ""}
                        onChange={(e) => {
                          setActiveFilters(prev => ({
                            ...prev,
                            [filter.id]: e.target.value || undefined
                          }));
                        }}
                      />
                    )}
                    
                    {filter.type === 'checkbox' && filter.options && (
                      <div className="space-y-2">
                        {filter.options.map(option => (
                          <div key={option} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${filter.id}-${option}`}
                              checked={activeFilters[filter.id]?.includes(option) || false}
                              onCheckedChange={(checked) => {
                                const currentValues = activeFilters[filter.id] || [];
                                if (checked) {
                                  setActiveFilters(prev => ({
                                    ...prev,
                                    [filter.id]: [...currentValues, option]
                                  }));
                                } else {
                                  setActiveFilters(prev => ({
                                    ...prev,
                                    [filter.id]: currentValues.filter((v: string) => v !== option)
                                  }));
                                }
                              }}
                            />
                            <label htmlFor={`${filter.id}-${option}`} className="text-sm">
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">
            Search Results ({searchResults.length} items)
          </h2>
          <p className="text-gray-600 text-sm">
            Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, searchResults.length)} of {searchResults.length}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Sort Controls */}
          <Select
            value={sortBy}
            onValueChange={(value: any) => setSortBy(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* View Mode Toggle */}
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedResults.map(item => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription className="mt-1">{item.description}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(item.id)}
                    className="p-1 h-auto"
                  >
                    <Star 
                      className={`w-4 h-4 ${favorites.has(item.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} 
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  
                  {item.price && (
                    <div className="text-lg font-semibold text-green-600">
                      ₹{item.price.toLocaleString()}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${item.relevance * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Relevance: {(item.relevance * 100).toFixed(0)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedResults.map(item => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{item.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                      {item.price && (
                        <span className="text-green-600 font-semibold">
                          ₹{item.price.toLocaleString()}
                        </span>
                      )}
                      <span>Relevance: {(item.relevance * 100).toFixed(0)}%</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(item.id)}
                    className="p-1 h-auto ml-4"
                  >
                    <Star 
                      className={`w-5 h-5 ${favorites.has(item.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} 
                    />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}