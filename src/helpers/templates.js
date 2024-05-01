export const NAVIGATION_TEMPLATE = `
<div class="navigate">
    <div class="nav-slider">
        <div class="nav-slider-left">
            <button type="button" class="btn btn-outline-dark nav-sort-bar-order"
                title="Sort bar order" id='sort-bar-order'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-list-nested" viewBox="0 0 16 16">
                    <path fill-rule="evenodd"
                        d="M4.5 11.5A.5.5 0 0 1 5 11h10a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5m-2-4A.5.5 0 0 1 3 7h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m-2-4A.5.5 0 0 1 1 3h10a.5.5 0 0 1 0 1H1a.5.5 0 0 1-.5-.5">
                    </path>
                </svg>
                <!-- <span>続けて表示</span> -->
            </button>
            <select name="pageSize" id="pageSize" title="Items per page">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="50">50</option>
                <option value="100" selected="">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="500">500</option>
                <option value="1000">1,000</option>
            </select>
            <button type="button" class="btn btn-outline-dark nav-page-back" title="Previous page" id='page-back'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-dash-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"></path>
                    <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"></path>
                </svg>
            </button>
            <div class="page-number text-md-left" id='pageInfo'><span>1 / 1</span></div>
            <button type="button"
                class="btn btn-outline-dark nav-page-next" title="Next page" id='page-next'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-plus-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"></path>
                    <path
                        d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4">
                    </path>
                </svg>
            </button>
            <button type="button" class="btn btn-outline-dark nav-now" title="Show current time" id='current-time'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-crosshair" viewBox="0 0 16 16">
                    <path
                        d="M8.5.5a.5.5 0 0 0-1 0v.518A7 7 0 0 0 1.018 7.5H.5a.5.5 0 0 0 0 1h.518A7 7 0 0 0 7.5 14.982v.518a.5.5 0 0 0 1 0v-.518A7 7 0 0 0 14.982 8.5h.518a.5.5 0 0 0 0-1h-.518A7 7 0 0 0 8.5 1.018zm-6.48 7A6 6 0 0 1 7.5 2.02v.48a.5.5 0 0 0 1 0v-.48a6 6 0 0 1 5.48 5.48h-.48a.5.5 0 0 0 0 1h.48a6 6 0 0 1-5.48 5.48v-.48a.5.5 0 0 0-1 0v.48A6 6 0 0 1 2.02 8.5h.48a.5.5 0 0 0 0-1zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4">
                    </path>
                </svg></button>
            <button type="button" class="btn btn-outline-dark nav-prev-week" id='prev-week'
                title="Slide more to the left">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-chevron-double-left" viewBox="0 0 16 16">
                    <path fill-rule="evenodd"
                        d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0">
                    </path>
                    <path fill-rule="evenodd"
                        d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0">
                    </path>
                </svg>
            </button>
            <button type="button" class="btn btn-outline-dark nav-prev-day" title="Slide to the left" id='prev-day'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-chevron-left" viewBox="0 0 16 16">
                    <path fill-rule="evenodd"
                        d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0">
                    </path>
                </svg>
            </button>
        </div>
        <div class="progress bg-light border border-dark canScroll" id='progress'
            title="Click to set progress, or (ctrl) shift+wheel to scroll"
            style="--progress: 8.792061897978641%;">
            <div class="progress-bar bg-light text-dark" role="progressbar" aria-valuenow="0" aria-valuemin="0"
                aria-valuemax="100">9%</div>
            <div class="circle" draggable="true" tabindex="0"></div>
        </div>
        <div class="nav-slider-right">
            <button type="button" class="btn btn-outline-dark nav-next-day" id='next-day'
                title="Slide to the right">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-chevron-right" viewBox="0 0 16 16">
                    <path fill-rule="evenodd"
                        d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708">
                    </path>
                </svg>
            </button>
            <button type="button" class="btn btn-outline-dark nav-next-week" id='next-week'
                title="Slide more to the right">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-chevron-double-right" viewBox="0 0 16 16">
                    <path fill-rule="evenodd"
                        d="M3.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L9.293 8 3.646 2.354a.5.5 0 0 1 0-.708">
                    </path>
                    <path fill-rule="evenodd"
                        d="M7.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L13.293 8 7.646 2.354a.5.5 0 0 1 0-.708">
                    </path>
                </svg>
            </button>
            <button type="button" class="btn btn-outline-dark nav-zoomIn" title="Zoom in" id='zoom-in'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-zoom-in" viewBox="0 0 16 16">
                    <path fill-rule="evenodd"
                        d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0">
                    </path>
                    <path
                        d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z">
                    </path>
                    <path fill-rule="evenodd"
                        d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5">
                    </path>
                </svg>
            </button>
            <button type="button" class="btn btn-outline-dark nav-zoomOut" title="Zoom out" id='zoom-out'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-zoom-out" viewBox="0 0 16 16">
                    <path fill-rule="evenodd"
                        d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0">
                    </path>
                    <path
                        d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z">
                    </path>
                    <path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5">
                    </path>
                </svg>
            </button>
        </div>
    </div>
    <section class="nav-holidays-input">
        <form method='post' id='csvForm'>
            <div class="form-group">
            <label for="csv">Upload Holidays CSV</label>
                <input type="file" name="csv" id="csv" accept=".csv" required/>
            </div>
            <button type="submit">Upload CSV</button>
        </form>
        <a href="https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv" target="_blank" rel="noopener noreferrer" download>Sample</a>
    </section>
</div>
`;

export const header_year = (width, year) => `<div class="row year" style="width: ${width}px">
<div class="fn-label">${year}</div></div>`;

export const header_month = (width, month) => `<div class="row month" style="width: ${width}px">
<div class="fn-label">${month}</div>
</div>`