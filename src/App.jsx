import { useState } from 'react'
import './App.css'

import React, { useEffect } from 'react';
import { Search, Book, User, Calendar, Star, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

const BookFinder = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('title');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [useSampleData, setUseSampleData] = useState(false);

  // Sample data for demonstration when API fails
  const sampleBooks = [
    {
      key: '/works/OL45804W',
      title: 'The Great Gatsby',
      author_name: ['F. Scott Fitzgerald'],
      first_publish_year: 1925,
      cover_i: 8091016,
      subject: ['American literature', 'Classic fiction', 'Jazz Age']
    },
    {
      key: '/works/OL362427W',
      title: 'To Kill a Mockingbird',
      author_name: ['Harper Lee'],
      first_publish_year: 1960,
      cover_i: 8231808,
      subject: ['American literature', 'Legal drama', 'Civil rights']
    },
    {
      key: '/works/OL27448W',
      title: '1984',
      author_name: ['George Orwell'],
      first_publish_year: 1949,
      cover_i: 8229182,
      subject: ['Dystopian fiction', 'Political fiction', 'Science fiction']
    },
    {
      key: '/works/OL15537077W',
      title: 'The Catcher in the Rye',
      author_name: ['J. D. Salinger'],
      first_publish_year: 1951,
      subject: ['Coming-of-age', 'American literature', 'Teen fiction']
    }
  ];

  // Load favorites from memory on component mount
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage?.getItem('bookFavorites') || '[]');
    setFavorites(new Set(savedFavorites));
  }, []);

  // Save favorites to memory whenever favorites change
  useEffect(() => {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('bookFavorites', JSON.stringify([...favorites]));
    }
  }, [favorites]);

  const searchBooks = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    setHasSearched(true);
    setUseSampleData(false);
    
    try {
      // Build the URL with proper fields parameter (required as of Jan 21, 2025)
      let url = 'https://openlibrary.org/search.json?';
      
      switch (searchType) {
        case 'author':
          url += `author=${encodeURIComponent(searchQuery)}`;
          break;
        case 'subject':
          url += `subject=${encodeURIComponent(searchQuery)}`;
          break;
        default:
          url += `title=${encodeURIComponent(searchQuery)}`;
      }
      
      // Add required fields parameter (new requirement as of Jan 2025)
      url += '&fields=key,title,author_name,first_publish_year,cover_i,subject,edition_count,publish_year';
      url += '&limit=20';
      
      console.log('Requesting URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BookFinder-App'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response URL:', response.url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.docs && Array.isArray(data.docs)) {
        setBooks(data.docs);
        if (data.docs.length === 0) {
          setError('No books found for your search. Try different keywords or search type.');
        }
      } else {
        setBooks([]);
        setError('Unexpected response format from the API.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(`API request failed: ${err.message}. Showing sample data instead.`);
      
      // Use sample data as fallback
      const filteredSample = sampleBooks.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author_name.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (book.subject && book.subject.some(subj => subj.toLowerCase().includes(searchQuery.toLowerCase())))
      );
      
      setBooks(filteredSample.length > 0 ? filteredSample : sampleBooks.slice(0, 4));
      setUseSampleData(true);
    } finally {
      setLoading(false);
    }
  };



  const toggleFavorite = (bookKey) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(bookKey)) {
      newFavorites.delete(bookKey);
    } else {
      newFavorites.add(bookKey);
    }
    setFavorites(newFavorites);
  };

  const getCoverUrl = (book) => {
    if (book.cover_i) {
      return `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
    }
    return null;
  };

  const formatAuthors = (authors) => {
    if (!authors || authors.length === 0) return 'Unknown Author';
    return authors.slice(0, 2).join(', ') + (authors.length > 2 ? ` and ${authors.length - 2} more` : '');
  };

  const getOpenLibraryUrl = (book) => {
    if (book.key) {
      return `https://openlibrary.org${book.key}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-6">
          <div className="flex items-center justify-center mb-4">
            <Book className="w-8 h-8 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">BookFinder</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover your next great read! Search by title, author, or subject to find books for study or pleasure.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchBooks()}
                    placeholder={`Search by ${searchType}...`}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                  />
                </div>
              </div>
              
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-lg"
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="subject">Subject</option>
              </select>
              
              <button
                onClick={searchBooks}
                disabled={loading || !searchQuery.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center min-w-[120px]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`${useSampleData ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4 mb-6 flex items-center`}>
            <AlertCircle className={`w-5 h-5 ${useSampleData ? 'text-yellow-500' : 'text-red-500'} mr-3`} />
            <p className={useSampleData ? 'text-yellow-700' : 'text-red-700'}>{error}</p>
          </div>
        )}

        {/* Sample Data Notice */}
        {useSampleData && books.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-700">
              📚 <strong>Demo Mode:</strong> Showing sample books since the API is temporarily unavailable. 
              In a real deployment, this would show live search results from Open Library.
            </p>
          </div>
        )}

        {/* Results */}
        {hasSearched && !loading && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              {books.length > 0 ? `Found ${books.length} books` : 'No books found'}
            </h2>
          </div>
        )}

        {/* Books Grid */}
        {books.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book, index) => (
              <div
                key={book.key || index}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
              >
                <div className="relative">
                  {getCoverUrl(book) ? (
                    <img
                      src={getCoverUrl(book)}
                      alt={book.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center" style={{display: getCoverUrl(book) ? 'none' : 'flex'}}>
                    <Book className="w-16 h-16 text-gray-400" />
                  </div>
                  
                  <button
                    onClick={() => toggleFavorite(book.key)}
                    className={`absolute top-3 right-3 p-2 rounded-full ${
                      favorites.has(book.key)
                        ? 'bg-yellow-400 text-white'
                        : 'bg-white/80 text-gray-600 hover:bg-yellow-400 hover:text-white'
                    } transition-colors duration-200`}
                  >
                    <Star className={`w-5 h-5 ${favorites.has(book.key) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2 leading-tight">
                    {book.title}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start">
                      <User className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{formatAuthors(book.author_name)}</span>
                    </div>
                    
                    {book.first_publish_year && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>First published: {book.first_publish_year}</span>
                      </div>
                    )}
                    
                    {book.subject && book.subject.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {book.subject.slice(0, 3).map((subject, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
                          >
                            {subject}
                          </span>
                        ))}
                        {book.subject.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{book.subject.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {getOpenLibraryUrl(book) && (
                    <a
                      href={getOpenLibraryUrl(book)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Details
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mr-3" />
            <span className="text-lg text-gray-600">Searching for books...</span>
          </div>
        )}

        {/* Empty State */}
        {hasSearched && !loading && books.length === 0 && !error && (
          <div className="text-center py-12">
            <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No books found</h3>
            <p className="text-gray-500">Try adjusting your search terms or search type.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-8 text-gray-500">
          <p>Powered by Open Library API • Built for Alex the College Student 📚</p>
        </footer>
      </div>
    </div>
  );
};

export default BookFinder;


