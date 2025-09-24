/**
 * Blog List Component (partial implementation)
 * Candidates must complete: sorting, filtering, search, robust error handling, and caching.
 */
export class BlogList {
    constructor(container) {
        this.container = container;
        this.listContainer = container.querySelector('.blog-list-content');
        this.loadingIndicator = container.querySelector('.loading-indicator');
        this.errorContainer = container.querySelector('.error-container');

        this.sortSelect = container.querySelector('.sort-select');
        this.filterSelect = container.querySelector('.filter-select');
        this.searchInput = container.querySelector('.search-input');

        this.apiUrl = 'https://frontend-blog-lyart.vercel.app/blogsData.json';
        this.items = [];
        this.filteredItems = [];
        this.page = 1;
        this.perPage = 10;

        this.sortBy = '';
        this.categoryFilter = '';
        this.searchQuery = '';

        // Bind handlers
        this.onSortChange = this.onSortChange.bind(this);
        this.onFilterChange = this.onFilterChange.bind(this);
        this.onSearchInput = this.onSearchInput.bind(this);
    }

    async init() {
        try {
            this.showLoading();
            await this.fetchData();
            this.setupEventListeners();
            this.render();
        } catch (err) {
            this.showError(err);
        } finally {
            this.hideLoading();
        }
    }

    async fetchData() {
        const cacheKey = 'blogs-cache-v1';
        try {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) {
                    this.items = parsed;
                    this.filteredItems = [...parsed];
                    return;
                }
            }
        } catch {}

        const fetchOnce = async () => {
            const res = await fetch(this.apiUrl, { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch blogs');
            const data = await res.json();
            if (!Array.isArray(data)) throw new Error('Unexpected API response');
            return data;
        };

        let data;
        try {
            data = await fetchOnce();
        } catch (e) {
            // one retry
            data = await fetchOnce();
        }

        this.items = data;
        this.filteredItems = [...data];
        try {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {}
    }

    setupEventListeners() {
        this.sortSelect?.addEventListener('change', this.onSortChange);
        this.filterSelect?.addEventListener('change', this.onFilterChange);
        let t;
        this.searchInput?.addEventListener('input', (e) => {
            clearTimeout(t);
            t = setTimeout(() => this.onSearchInput(e), 250);
        });
    }

    render() {
        const end = this.page * this.perPage;
        const slice = this.filteredItems.slice(0, end);
        this.listContainer.innerHTML = slice.map(item => `
            <article class=\"blog-item\">\n                <img src=\"${item.image}\" alt=\"\" class=\"blog-image\" />\n                <div class=\"blog-content\">\n                    <h3 class=\"blog-title\">${item.title}</h3>\n                    <div class=\"blog-meta\">\n                        <span class=\"blog-author\">${item.author}</span>\n                        <time class=\"blog-date\">${new Date(item.published_date).toLocaleDateString()}</time>\n                        <span class=\"blog-reading-time\">${item.reading_time}</span>\n                    </div>\n                    <p class=\"blog-excerpt\">${item.content}</p>\n                    <div class=\"blog-tags\">${(item.tags || []).map(t => `<span class=\"tag\">${t}</span>`).join('')}</div>\n                </div>\n            </article>
        `).join('');

        if (slice.length === 0) {
            this.listContainer.innerHTML = '<p class="no-results">No blogs found</p>';
        }
    }

    onSortChange(e) {
        this.sortBy = e.target.value || '';
        this.applyFiltersAndRender();
    }

    onFilterChange(e) {
        this.categoryFilter = e.target.value || '';
        this.applyFiltersAndRender();
    }

    onSearchInput(e) {
        this.searchQuery = (e.target.value || '').toLowerCase();
        this.applyFiltersAndRender();
    }

    applyFiltersAndRender() {
        const categoryRank = {
            'Writing': 1,
            'Gadgets': 2,
            'Startups': 3,
            'Other': 4
        };

        // Filter
        let working = this.items.filter(item => {
            const inCategory = !this.categoryFilter || (item.tags || []).some(t => String(t).toLowerCase() === this.categoryFilter.toLowerCase());
            const inSearch = !this.searchQuery || String(item.title || '').toLowerCase().includes(this.searchQuery);
            return inCategory && inSearch;
        });

        // Sort
        if (this.sortBy === 'date') {
            working.sort((a, b) => new Date(b.published_date) - new Date(a.published_date));
        } else if (this.sortBy === 'reading_time') {
            const getMinutes = (v) => {
                if (typeof v === 'number') return v;
                const m = String(v || '').match(/(\d+)/);
                return m ? parseInt(m[1], 10) : 0;
            };
            working.sort((a, b) => getMinutes(a.reading_time) - getMinutes(b.reading_time));
        } else if (this.sortBy === 'category') {
            const getCategory = (it) => {
                const tags = (it.tags || []).map(x => String(x));
                const found = ['Writing','Gadgets','Startups'].find(c => tags.includes(c));
                return found || 'Other';
            };
            working.sort((a, b) => {
                const ca = getCategory(a);
                const cb = getCategory(b);
                if (categoryRank[ca] !== categoryRank[cb]) return categoryRank[ca] - categoryRank[cb];
                return String(a.title).localeCompare(String(b.title));
            });
        }

        this.filteredItems = working;
        this.page = 1; // ensure exactly 10 shown
        this.render();
    }

    showLoading() {
        this.loadingIndicator?.classList.remove('hidden');
    }
    hideLoading() {
        this.loadingIndicator?.classList.add('hidden');
    }
    showError(err) {
        if (!this.errorContainer) return;
        this.errorContainer.classList.remove('hidden');
        this.errorContainer.textContent = `Error: ${err.message}`;
    }
}

